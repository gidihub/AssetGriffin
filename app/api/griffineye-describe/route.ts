import { extractAssetFromDescription } from '@/lib/griffineye-describe'
import { recordAuditEvent } from '@/lib/griffineye-audit'
import {
  buildVisionCapMessage,
  getVisionUsageSnapshot,
  releaseVisionUsage,
  reserveVisionUsage,
  type GriffinVisionUsageSnapshot,
} from '@/lib/griffin-vision-usage'
import { assertGriffinEyeAccess } from '@/lib/griffineye-security/access-guard'
import { GriffinEyeValidationError, parseGriffinEyeDescribeBody } from '@/lib/griffineye-security/validate-input'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type CapError = Error & { code: 'VISION_CAP_EXCEEDED'; snapshot: GriffinVisionUsageSnapshot }

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const access = await assertGriffinEyeAccess(supabase, profile, { endpoint: 'griffineye-describe' })
    if (!access.ok) {
      return Response.json({ error: access.error, code: access.code }, { status: access.status })
    }

    const body = await request.json().catch(() => null)
    const { description } = parseGriffinEyeDescribeBody(body)

    const { usageLogId, billingSource } = await reserveVisionUsage(
      supabase,
      profile.organization_id,
      'griffineye_text_extract',
    )

    let extraction
    try {
      extraction = await extractAssetFromDescription(description)
    } catch (extractError) {
      await releaseVisionUsage(supabase, usageLogId)
      throw extractError
    }

    await recordAuditEvent(supabase, profile.organization_id, {
      category: 'ai',
      action: 'GriffinEye text extraction',
      source: 'griffineye',
      actorId: profile.id,
      actorLabel: profile.full_name || profile.email,
      entityType: 'Description',
      entityLabel: description.slice(0, 120),
      summary: extraction.summary.slice(0, 280),
      metadata: {
        billing_source: billingSource,
        confidence: extraction.confidence,
        suggested_fields: extraction.suggestedFields,
        uncertain_fields: extraction.uncertainFields,
      },
    })

    const usage = await getVisionUsageSnapshot(supabase, profile.organization_id)

    return Response.json({ ...extraction, usage, billingSource })
  } catch (error) {
    console.error('[griffineye-describe]', error)

    if (error instanceof GriffinEyeValidationError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (error instanceof Error && (error as CapError).code === 'VISION_CAP_EXCEEDED') {
      const snapshot = (error as CapError).snapshot
      return Response.json(
        {
          error: buildVisionCapMessage(
            snapshot,
            'AI actions',
            'Buy more credits or upgrade your plan, or add this asset manually.',
          ),
          code: 'VISION_CAP_EXCEEDED',
          used: snapshot.used,
          cap: snapshot.cap,
          tier: snapshot.tier,
          creditBalance: snapshot.creditBalance,
        },
        { status: 429 },
      )
    }

    const message = error instanceof Error ? error.message : 'GriffinEye could not read that description.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
