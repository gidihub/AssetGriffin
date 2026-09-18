const PHOTO_HEADER_PATTERNS = [
  /^asset\s*photo$/i,
  /^photo\s*url$/i,
  /^image\s*url$/i,
  /^photo$/i,
  /^picture(\s*url)?$/i,
  /^asset\s*image$/i,
  /^thumbnail(\s*url)?$/i,
]

export function detectPhotoUrlColumn(headers: string[], sampleRows: string[][] = []): string | null {
  for (const header of headers) {
    if (PHOTO_HEADER_PATTERNS.some((pattern) => pattern.test(header.trim()))) {
      return header
    }
  }

  for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
    const hasUrl = sampleRows.some((row) => isHttpsPhotoUrl(row[columnIndex]?.trim() ?? ''))
    if (hasUrl) return headers[columnIndex]
  }

  return null
}

export function isHttpsPhotoUrl(value: string): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

export function normalizeImportPhotoUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!isHttpsPhotoUrl(trimmed)) return null
  return new URL(trimmed).toString()
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

function parseIpv4Dotted(value: string): number[] | null {
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!match) return null
  const octets = match.slice(1, 5).map(Number)
  return octets.some((octet) => octet > 255) ? null : octets
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
  // fc00::/7 — unique local addresses
  if (firstHextet >= 0xfc00 && firstHextet <= 0xfdff) return true
  // fe80::/10 — link-local addresses
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

export function validateImportPhotoUrl(url: string): { ok: true; url: URL } | { ok: false; reason: string } {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') {
      return { ok: false, reason: 'Photo URLs must use HTTPS.' }
    }
    if (isBlockedHostname(parsed.hostname)) {
      return { ok: false, reason: 'Photo URL host is not allowed.' }
    }
    return { ok: true, url: parsed }
  } catch {
    return { ok: false, reason: 'Invalid photo URL.' }
  }
}
