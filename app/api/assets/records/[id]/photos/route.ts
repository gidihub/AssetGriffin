import { deleteAssetPhotoObject, signAssetPhotoPaths, uploadAssetPhotoObject } from '@/lib/asset-photo-storage'
import { getGroupBySlug } from '@/lib/groups-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

async function loadAssetRecord(supabase: Awaited<ReturnType<typeof requireUserProfile>>['supabase'], profileOrgId: string, recordId: string) {
  const group = await getGroupBySlug('assets')
  if (!group) return null

  const { data, error } = await supabase
    .from('records')
    .select('id, organization_id, group_id')
    .eq('id', recordId)
    .eq('group_id', group.id)
    .eq('organization_id', profileOrgId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

function assertPhotoPath(storagePath: string, organizationId: string, recordId: string) {
  const expectedPrefix = `${organizationId}/${recordId}/`
  if (!storagePath.startsWith(expectedPrefix)) {
    throw new Error('Invalid photo path.')
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { supabase, profile } = await requireUserProfile()
    const { id: recordId } = await context.params
    const storagePath = new URL(request.url).searchParams.get('path')?.trim()
    if (!storagePath) return Response.json({ error: 'Photo path is required.' }, { status: 400 })

    const record = await loadAssetRecord(supabase, profile.organization_id, recordId)
    if (!record) return Response.json({ error: 'Asset not found.' }, { status: 404 })

    assertPhotoPath(storagePath, profile.organization_id, recordId)

    const urls = await signAssetPhotoPaths(supabase, [storagePath])
    const signed = urls[storagePath]
    if (!signed) return Response.json({ error: 'Photo not found.' }, { status: 404 })

    return Response.redirect(signed, 307)
  } catch (error) {
    console.error('[assets/photos/view]', error)
    const message = error instanceof Error ? error.message : 'Could not load photo.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Invalid photo path.'
          ? 400
          : 500
    return Response.json({ error: message }, { status })
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { supabase, profile } = await requireUserProfile()
    const { id: recordId } = await context.params

    const record = await loadAssetRecord(supabase, profile.organization_id, recordId)
    if (!record) return Response.json({ error: 'Asset not found.' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('photo')
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Upload a photo file.' }, { status: 400 })
    }

    const mimeType = file.type.toLowerCase().trim()
    const buffer = Buffer.from(await file.arrayBuffer())
    const photoId = crypto.randomUUID()
    const { storagePath } = await uploadAssetPhotoObject(
      supabase,
      profile.organization_id,
      recordId,
      buffer,
      mimeType,
      photoId,
    )

    return Response.json({
      photo: {
        id: photoId,
        storagePath,
        name: file.name.slice(0, 120) || 'Photo',
        primary: false,
        addedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[assets/photos/upload]', error)
    const message = error instanceof Error ? error.message : 'Could not upload photo.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 400
    return Response.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { supabase, profile } = await requireUserProfile()
    const { id: recordId } = await context.params
    const storagePath = new URL(request.url).searchParams.get('path')?.trim()
    if (!storagePath) return Response.json({ error: 'Photo path is required.' }, { status: 400 })

    const record = await loadAssetRecord(supabase, profile.organization_id, recordId)
    if (!record) return Response.json({ error: 'Asset not found.' }, { status: 404 })

    assertPhotoPath(storagePath, profile.organization_id, recordId)

    await deleteAssetPhotoObject(supabase, storagePath)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('[assets/photos/delete]', error)
    const message = error instanceof Error ? error.message : 'Could not delete photo.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
