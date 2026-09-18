import { answerGriffinEyeQuestion } from '@/lib/griffineye-agent/agent'
import { recordAuditEvent } from '@/lib/griffineye-audit'
import {
  getVisionUsageSnapshot,
  releaseVisionUsage,
  reserveVisionUsage,
  visionCapExceededPayload,
  type GriffinVisionUsageSnapshot,
} from '@/lib/griffin-vision-usage'
import { assertGriffinEyeAccess } from '@/lib/griffineye-security/access-guard'
import { GriffinEyeValidationError, parseGriffinEyeQueryBody } from '@/lib/griffineye-security/validate-input'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

type CapError = Error & {
  code: 'VISION_CAP_EXCEEDED' | 'ABUSE_CAP_EXCEEDED'
  snapshot: GriffinVisionUsageSnapshot
}

export async function POST(request: Request) {
  try {
    const { supabase, profile } = await requireUserProfile()

    const access = await assertGriffinEyeAccess(supabase, profile, { endpoint: 'griffineye-query' })
    if (!access.ok) {
      return Response.json({ error: access.error, code: access.code }, { status: access.status })
    }

    const body = await request.json().catch(() => null)
    const { question } = parseGriffinEyeQueryBody(body)

    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', profile.organization_id)
      .single()
    const organizationName = organization?.name ?? undefined

    const { usageLogId, billingSource } = await reserveVisionUsage(
      supabase,
      profile.organization_id,
      'griffineye_query',
    )

    let result
    try {
      result = await answerGriffinEyeQuestion(
        { supabase, organizationId: profile.organization_id, organizationName },
        question,
      )
    } catch (queryError) {
      await releaseVisionUsage(supabase, usageLogId)
      throw queryError
    }

    try {
      await recordAuditEvent(supabase, profile.organization_id, {
        category: 'ai',
        action: 'GriffinEye query',
        source: 'griffineye',
        actorId: profile.id,
        actorLabel: profile.full_name || profile.email,
        entityType: 'Query',
        entityLabel: question.slice(0, 120),
        summary: result.answer.slice(0, 280),
        metadata: {
          tools: result.trace.map((entry) => entry.tool),
          tool_calls: result.trace.map((entry) => ({
            tool: entry.tool,
            arguments: entry.arguments,
            ...(entry.error ? { error: entry.error } : {}),
          })),
          billing_source: billingSource,
          result_rows: result.table?.rows.length ?? 0,
          ...(result.report
            ? { report: { format: result.report.format, filename: result.report.filename } }
            : {}),
        },
      })
    } catch (auditError) {
      console.error('[griffineye-query/audit]', auditError)
    }

    let usage: GriffinVisionUsageSnapshot | null = null
    try {
      usage = await getVisionUsageSnapshot(supabase, profile.organization_id)
    } catch (usageError) {
      console.error('[griffineye-query/usage-snapshot]', usageError)
    }

    return Response.json({
      answer: result.answer,
      table: result.table ?? null,
      assetTags: result.assetTags,
      tools: result.trace.map((entry) => entry.tool),
      trace: result.trace.map((entry) => ({
        tool: entry.tool,
        label: entry.label,
        durationMs: entry.durationMs,
        ...(entry.error ? { error: entry.error } : {}),
      })),
      report: result.report ?? null,
      usage,
      billingSource,
    })
  } catch (error) {
    console.error('[griffineye-query]', error)

    if (error instanceof GriffinEyeValidationError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    if (
      error instanceof Error &&
      ((error as CapError).code === 'VISION_CAP_EXCEEDED' ||
        (error as CapError).code === 'ABUSE_CAP_EXCEEDED')
    ) {
      const capError = error as CapError
      return Response.json(visionCapExceededPayload(capError.snapshot, capError.code), { status: 429 })
    }

    const message = error instanceof Error ? error.message : 'GriffinEye could not answer that question.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
