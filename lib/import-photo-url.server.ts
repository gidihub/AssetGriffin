import dns from 'node:dns/promises'
import https from 'node:https'
import { Readable } from 'node:stream'
import {
  extensionForMime,
  MAX_ASSET_PHOTO_BYTES,
  uploadAssetPhotoObject,
  type StoredAssetPhoto,
} from '@/lib/asset-photo-storage'
import {
  normalizeImportPhotoUrl,
  validateImportPhotoUrl,
} from '@/lib/import-photo-url'
import type { SupabaseClient } from '@supabase/supabase-js'

const FETCH_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 5

function mimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

function normalizeHostname(hostname: string): string {
  const host = hostname.toLowerCase()
  if (host.startsWith('[') && host.endsWith(']')) return host.slice(1, -1)
  return host
}

function parseIpv4Dotted(value: string): number[] | null {
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return null
  const octets = match.slice(1, 5).map(Number)
  return octets.some((octet) => octet > 255) ? null : octets
}

function isBlockedIpv4Octets(octets: number[]): boolean {
  if (octets.length !== 4 || octets.some((octet) => octet > 255)) return true
  const [a, b] = octets
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a >= 224) return true
  return false
}

function expandIpv6Hextets(hostname: string): number[] | null {
  const host = hostname.toLowerCase()
  if (host.includes('.') && !host.includes(':')) return null

  const [leftPart = '', rightPart = ''] = host.split('::')
  if (host.split('::').length > 2) return null

  const left = leftPart ? leftPart.split(':').filter(Boolean) : []
  const right = rightPart ? rightPart.split(':').filter(Boolean) : []

  if (right.length > 0 && right[right.length - 1]?.includes('.')) {
    const embeddedIpv4 = right.pop()
    if (!embeddedIpv4) return null
    const octets = parseIpv4Dotted(embeddedIpv4)
    if (!octets) return null
    right.push(String((octets[0] << 8) | octets[1]), String((octets[2] << 8) | octets[3]))
  }

  const missing = 8 - left.length - right.length
  if (missing < 0) return null

  const parts = [...left, ...Array(missing).fill('0'), ...right]
  if (parts.length !== 8) return null

  const hextets = parts.map((part) => Number.parseInt(part, 16))
  return hextets.some((hextet) => !Number.isFinite(hextet)) ? null : hextets
}

function isBlockedIpv6(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === '::') return true

  const mappedWithIpv4 = host.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mappedWithIpv4) {
    const octets = parseIpv4Dotted(mappedWithIpv4[1])
    return !octets || isBlockedIpv4Octets(octets)
  }

  const hextets = expandIpv6Hextets(host)
  if (!hextets) return true

  if (hextets.every((hextet, index) => (index === 7 ? hextet === 1 : hextet === 0))) {
    return true
  }

  const isMappedIpv4 =
    hextets.slice(0, 5).every((hextet) => hextet === 0) && hextets[5] === 0xffff
  if (isMappedIpv4) {
    const octets = [
      (hextets[6] >> 8) & 0xff,
      hextets[6] & 0xff,
      (hextets[7] >> 8) & 0xff,
      hextets[7] & 0xff,
    ]
    if (isBlockedIpv4Octets(octets)) return true
  }

  const firstHextet = hextets[0]
  if (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) return true
  if (firstHextet >= 0xfe80 && firstHextet <= 0xfebf) return true

  return false
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost')) return true
  if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return true

  if (host.includes(':') || host.startsWith('[')) {
    const ipv6Host = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
    if (isBlockedIpv6(ipv6Host)) return true
  }

  const octets = parseIpv4Dotted(host)
  if (!octets) return false
  return isBlockedIpv4Octets(octets)
}

async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  const host = normalizeHostname(hostname)

  if (isBlockedHostname(host)) {
    throw new Error('Photo URL host is not allowed.')
  }

  const literalIpv4 = parseIpv4Dotted(host)
  if (literalIpv4) {
    return [host]
  }

  if (host.includes(':')) {
    return [host]
  }

  const addresses: string[] = []
  const [v4Result, v6Result] = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host)])

  if (v4Result.status === 'fulfilled') {
    for (const address of v4Result.value) {
      const octets = parseIpv4Dotted(address)
      if (!octets || isBlockedIpv4Octets(octets)) {
        throw new Error('Photo URL host is not allowed.')
      }
      addresses.push(address)
    }
  }

  if (v6Result.status === 'fulfilled') {
    for (const address of v6Result.value) {
      if (isBlockedIpv6(address)) {
        throw new Error('Photo URL host is not allowed.')
      }
      addresses.push(address)
    }
  }

  if (addresses.length === 0) {
    throw new Error('Photo URL host could not be resolved.')
  }

  return addresses
}

type PinnedPhotoResponse = {
  status: number
  headers: Headers
  body: ReadableStream<Uint8Array> | null
}

function fetchPinnedHttpsResponse(
  url: URL,
  addresses: string[],
  signal: AbortSignal,
): Promise<PinnedPhotoResponse> {
  return new Promise((resolve, reject) => {
    let nextAddress = 0
    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        headers: {
          Host: url.hostname,
          Accept: 'image/jpeg,image/png,image/webp,*/*',
          'User-Agent': 'AssetGriffin-Import/1.0',
        },
        servername: url.hostname,
        lookup: (_lookupHost, _options, callback) => {
          const address = addresses[nextAddress % addresses.length]!
          nextAddress += 1
          callback(null, address, address.includes(':') ? 6 : 4)
        },
      },
      (response) => {
        const headers = new Headers()
        for (const [key, value] of Object.entries(response.headers)) {
          if (typeof value === 'string') headers.set(key, value)
          else if (Array.isArray(value)) headers.set(key, value.join(', '))
        }

        resolve({
          status: response.statusCode ?? 0,
          headers,
          body: Readable.toWeb(response) as ReadableStream<Uint8Array>,
        })
      },
    )

    const onAbort = () => {
      request.destroy(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }))
    }

    if (signal.aborted) {
      onAbort()
      return
    }

    signal.addEventListener('abort', onAbort, { once: true })
    request.on('error', (error) => {
      signal.removeEventListener('abort', onAbort)
      reject(error)
    })
    request.on('close', () => {
      signal.removeEventListener('abort', onAbort)
    })
    request.end()
  })
}

async function fetchImportPhotoResponse(
  initialUrl: URL,
  signal: AbortSignal,
): Promise<PinnedPhotoResponse | { error: string }> {
  let currentUrl = initialUrl

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let addresses: string[]
    try {
      addresses = await resolvePublicAddresses(currentUrl.hostname)
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Photo URL host is not allowed.' }
    }

    let response: PinnedPhotoResponse
    try {
      response = await fetchPinnedHttpsResponse(currentUrl, addresses, signal)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      return { error: error instanceof Error ? error.message : 'Photo download failed.' }
    }

    if (response.status >= 300 && response.status < 400) {
      if (hop >= MAX_REDIRECTS) {
        return { error: 'Photo URL redirected too many times.' }
      }

      const location = response.headers.get('location')
      if (!location) {
        return { error: 'Photo download redirect is missing a target URL.' }
      }

      const validation = validateImportPhotoUrl(new URL(location, currentUrl).toString())
      if (!validation.ok) {
        return { error: validation.reason }
      }

      await response.body?.cancel().catch(() => undefined)
      currentUrl = validation.url
      continue
    }

    return response
  }

  return { error: 'Photo URL redirected too many times.' }
}

async function readResponseBodyWithLimit(
  response: PinnedPhotoResponse,
  maxBytes: number,
): Promise<Buffer | { error: string }> {
  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > maxBytes) {
    return { error: 'Photo exceeds the 2 MB limit.' }
  }

  if (!response.body) {
    return { error: 'Photo download failed.' }
  }

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel()
        return { error: 'Photo exceeds the 2 MB limit.' }
      }

      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }

  return Buffer.concat(chunks)
}

export async function fetchImportPhotoBuffer(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string } | { error: string }> {
  const validation = validateImportPhotoUrl(url)
  if (!validation.ok) return { error: validation.reason }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const responseOrError = await fetchImportPhotoResponse(validation.url, controller.signal)
    if ('error' in responseOrError) {
      return { error: responseOrError.error }
    }

    const response = responseOrError
    if (response.status < 200 || response.status >= 300) {
      return { error: `Photo download failed (HTTP ${response.status}).` }
    }

    const bodyOrError = await readResponseBodyWithLimit(response, MAX_ASSET_PHOTO_BYTES)
    if ('error' in bodyOrError) {
      return { error: bodyOrError.error }
    }

    const buffer = bodyOrError
    let mimeType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''
    if (!extensionForMime(mimeType)) {
      mimeType = mimeFromBuffer(buffer) ?? ''
    }
    if (!extensionForMime(mimeType)) {
      return { error: 'Photo must be JPG, PNG, or WebP.' }
    }

    return { buffer, mimeType }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Photo download timed out.' }
    }
    return { error: error instanceof Error ? error.message : 'Photo download failed.' }
  } finally {
    clearTimeout(timeout)
  }
}

export type ImportPhotoHydrationResult = {
  attached: number
  skipped: number
  failed: Array<{ assetTag: string; reason: string }>
}

/**
 * Attach imported photos to records. Intended for newly inserted import rows
 * (see importAssetsWithPhotosForCurrentOrg); appends to any existing asset_photos
 * atomically per record via append_record_asset_photo.
 */
export async function hydrateImportRecordPhotos(
  supabase: SupabaseClient,
  organizationId: string,
  items: Array<{ recordId: string; photoUrl: string; assetTag: string }>,
): Promise<ImportPhotoHydrationResult> {
  const result: ImportPhotoHydrationResult = { attached: 0, skipped: 0, failed: [] }

  for (const item of items) {
    const normalizedUrl = normalizeImportPhotoUrl(item.photoUrl)
    if (!normalizedUrl) {
      result.skipped += 1
      continue
    }

    const fetched = await fetchImportPhotoBuffer(normalizedUrl)
    if ('error' in fetched) {
      result.failed.push({ assetTag: item.assetTag, reason: fetched.error })
      continue
    }

    try {
      const photoId = crypto.randomUUID()
      const { storagePath } = await uploadAssetPhotoObject(
        supabase,
        organizationId,
        item.recordId,
        fetched.buffer,
        fetched.mimeType,
        photoId,
      )

      const storedPhoto: StoredAssetPhoto = {
        id: photoId,
        storagePath,
        name: 'Imported photo',
        primary: true,
        addedAt: new Date().toISOString(),
      }

      const { error: appendError } = await supabase.rpc('append_record_asset_photo', {
        p_record_id: item.recordId,
        p_photo: storedPhoto,
      })

      if (appendError) {
        result.failed.push({ assetTag: item.assetTag, reason: appendError.message })
        continue
      }

      result.attached += 1
    } catch (error) {
      result.failed.push({
        assetTag: item.assetTag,
        reason: error instanceof Error ? error.message : 'Could not attach photo.',
      })
    }
  }

  return result
}
