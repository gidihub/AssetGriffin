import { extractAssetFromPhotos } from '@/lib/griffineye-vision'
import {
  getVisionUsageSnapshot,
  releaseVisionUsage,
  reserveVisionUsage,
  visionCapExceededPayload,
} from '@/lib/griffin-vision-usage'
import { assertGriffinEyeAccess } from '@/lib/griffineye-security/access-guard'
import { GriffinEyeValidationError, parseGriffinVisionFormData } from '@/lib/griffineye-security/validate-input'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type VisionCapError = Error & {
  code: 'VISION_CAP_EXCEEDED' | 'ABUSE_CAP_EXCEEDED'
  snapshot: Awaited<ReturnType<typeof getVisionUsageSnapshot>>
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const access = await assertGriffinEyeAccess(supabase, profile, { endpoint: 'griffin-vision' })
    if (!access.ok) {
      return Response.json({ error: access.error, code: access.code }, { status: access.status })
    }

    const formData = await request.formData()
    const images = await parseGriffinVisionFormData(formData)

    // One reservation for the whole batch — up to 4 images, single model call, one credit.
    const { usageLogId, billingSource } = await reserveVisionUsage(supabase, profile.organization_id)

    let extraction
    try {
      extraction = await extractAssetFromPhotos(images)
    } catch (extractError) {
      await releaseVisionUsage(supabase, usageLogId)
      throw extractError
    }

    let usage: Awaited<ReturnType<typeof getVisionUsageSnapshot>> | null = null
    try {
      usage = await getVisionUsageSnapshot(supabase, profile.organization_id)
    } catch (usageError) {
      console.error('[griffin-vision/usage-snapshot]', usageError)
    }

    return Response.json({ ...extraction, usage, billingSource })
  } catch (error) {
    console.error('[griffin-vision]', error)

    if (error instanceof GriffinEyeValidationError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (
      error instanceof Error &&
      ((error as VisionCapError).code === 'VISION_CAP_EXCEEDED' ||
        (error as VisionCapError).code === 'ABUSE_CAP_EXCEEDED')
    ) {
      const capError = error as VisionCapError
      return Response.json(visionCapExceededPayload(capError.snapshot, capError.code), { status: 429 })
    }

    const message = error instanceof Error ? error.message : 'GriffinEye photo extraction failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
