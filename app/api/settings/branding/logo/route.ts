import { MAX_ORG_LOGO_BYTES, resolveOrgLogoMimeType, uploadOrgLogoObject } from '@/lib/org-branding-storage'
import { updateBranding } from '@/lib/settings-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('logo')
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Upload a logo file.' }, { status: 400 })
    }

    if (file.size > MAX_ORG_LOGO_BYTES) {
      return Response.json({ error: 'Logo must be 512 KB or smaller.' }, { status: 400 })
    }

    const mimeType = resolveOrgLogoMimeType(file.type, file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    const logoUrl = await uploadOrgLogoObject(supabase, profile.organization_id, buffer, mimeType)
    await updateBranding({ logoUrl })

    return Response.json({ logoUrl })
  } catch (error) {
    console.error('[settings/branding/logo]', error)
    const message = error instanceof Error ? error.message : 'Could not upload logo.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 400
    return Response.json({ error: message }, { status })
  }
}
