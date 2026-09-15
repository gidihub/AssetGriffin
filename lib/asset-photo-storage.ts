import type { SupabaseClient } from '@supabase/supabase-js'

export const ASSET_PHOTOS_BUCKET = 'asset-photos'
export const MAX_ASSET_PHOTO_BYTES = 2 * 1024 * 1024
export const SIGNED_URL_TTL_SECONDS = 60 * 60

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

export function extensionForMime(mimeType: string): string | null {
  return ALLOWED_MIME[mimeType.toLowerCase()] ?? null
}

export function buildAssetPhotoStoragePath(
  organizationId: string,
  recordId: string,
  photoId: string,
  ext: string,
): string {
  return `${organizationId}/${recordId}/${photoId}${ext}`
}

export async function uploadAssetPhotoObject(
  supabase: SupabaseClient,
  organizationId: string,
  recordId: string,
  buffer: Buffer,
  mimeType: string,
  photoId = crypto.randomUUID(),
): Promise<{ storagePath: string; photoId: string }> {
  const ext = extensionForMime(mimeType)
  if (!ext) throw new Error('Upload JPG, PNG, or WebP photos.')
  if (buffer.byteLength > MAX_ASSET_PHOTO_BYTES) throw new Error('Each photo must be 2 MB or smaller.')

  const storagePath = buildAssetPhotoStoragePath(organizationId, recordId, photoId, ext)
  const { error } = await supabase.storage.from(ASSET_PHOTOS_BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  })

  if (error) throw new Error(error.message)
  return { storagePath, photoId }
}

export async function signAssetPhotoPaths(
  supabase: SupabaseClient,
  storagePaths: string[],
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {}
  await Promise.all(
    storagePaths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from(ASSET_PHOTOS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
      if (!error && data?.signedUrl) urls[path] = data.signedUrl
    }),
  )
  return urls
}

export async function deleteAssetPhotoObject(supabase: SupabaseClient, storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(ASSET_PHOTOS_BUCKET).remove([storagePath])
  if (error) throw new Error(error.message)
}

/** Persisted photo metadata — no inline base64. */
export type StoredAssetPhoto = {
  id: string
  storagePath: string
  name: string
  primary: boolean
  addedAt: string
}

/** Authenticated proxy URL — signs and redirects when the browser loads the image. */
export function assetPhotoDisplayUrl(recordId: string, storagePath: string): string {
  if (!storagePath.trim()) return ''
  return `/api/assets/records/${recordId}/photos?path=${encodeURIComponent(storagePath)}`
}

export function stripPhotoForStorage(photo: StoredAssetPhoto & { previewUrl?: string }): StoredAssetPhoto | null {
  if (!photo.storagePath.trim()) return null
  return {
    id: photo.id,
    storagePath: photo.storagePath,
    name: photo.name,
    primary: photo.primary,
    addedAt: photo.addedAt,
  }
}
