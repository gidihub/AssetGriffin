import type { SupabaseClient } from '@supabase/supabase-js'

export const ORG_BRANDING_BUCKET = 'org-branding'
export const MAX_ORG_LOGO_BYTES = 512 * 1024

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

const EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export function extensionForOrgLogo(mimeType: string): string | null {
  return ALLOWED_MIME[mimeType.toLowerCase()] ?? null
}

export function resolveOrgLogoMimeType(mimeType: string, fileName: string): string {
  const normalized = mimeType.toLowerCase().trim()
  if (normalized && extensionForOrgLogo(normalized)) return normalized

  const ext = fileName.includes('.') ? `.${fileName.split('.').pop()?.toLowerCase() ?? ''}` : ''
  return EXTENSION_MIME[ext] ?? normalized
}

export function buildOrgLogoStoragePath(organizationId: string, ext: string): string {
  return `${organizationId}/logo${ext}`
}

export async function uploadOrgLogoObject(
  supabase: SupabaseClient,
  organizationId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = extensionForOrgLogo(mimeType)
  if (!ext) throw new Error('Upload JPG, PNG, or WebP logos.')
  if (buffer.byteLength > MAX_ORG_LOGO_BYTES) throw new Error('Logo must be 512 KB or smaller.')

  const storagePath = buildOrgLogoStoragePath(organizationId, ext)
  const { error } = await supabase.storage.from(ORG_BRANDING_BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: true,
  })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(ORG_BRANDING_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
