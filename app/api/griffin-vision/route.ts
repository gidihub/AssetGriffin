import { extractAssetFromPhotos } from '@/lib/griffineye-vision'
import {
  buildVisionCapMessage,
  getVisionUsageSnapshot,
  releaseVisionUsage,
  reserveVisionUsage,
} from '@/lib/griffin-vision-usage'
import { assertGriffinEyeAccess } from '@/lib/griffineye-security/access-guard'
import { GriffinEyeValidationError, parseGriffinVisionFormData } from '@/lib/griffineye-security/validate-input'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type VisionCapError = Error & {
  code: 'VISION_CAP_EXCEEDED'
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

    const usage = await getVisionUsageSnapshot(supabase, profile.organization_id)

    return Response.json({ ...extraction, usage, billingSource })
  } catch (error) {
    console.error('[griffin-vision]', error)

    if (error instanceof GriffinEyeValidationError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && (error as VisionCapError).code === 'VISION_CAP_EXCEEDED') {
      const snapshot = (error as VisionCapError).snapshot
      return Response.json(
        {
          error: buildVisionCapMessage(snapshot),
          code: 'VISION_CAP_EXCEEDED',
          used: snapshot.used,
          cap: snapshot.cap,
          tier: snapshot.tier,
          creditBalance: snapshot.creditBalance,
        },
        { status: 429 },
      )
    }

    const message = error instanceof Error ? error.message : 'GriffinEye photo extraction failed.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
