import { applySpecBackfillReview, buildSpecBackfillProposals } from '@/lib/asset-spec-backfill'
import type { SpecReviewFields } from '@/lib/asset-spec-review'
import {
  getGroupBySlug,
  getRecordForGroup,
  listFieldsForGroup,
  listRecordsForGroup,
  updateRecordForGroup,
} from '@/lib/groups-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    if (slug !== 'assets') {
      return Response.json({ error: 'Spec backfill is only available for the assets group.' }, { status: 400 })
    }

    await requireUserProfile()
    const group = await getGroupBySlug(slug)
    if (!group) {
      return Response.json({ error: 'Group not found.' }, { status: 404 })
    }

    const [fields, records] = await Promise.all([
      listFieldsForGroup(group.id),
      listRecordsForGroup(group.id),
    ])

    const proposals = buildSpecBackfillProposals(records, fields)
    return Response.json({ count: proposals.length, proposals })
  } catch (error) {
    console.error('[spec-backfill GET]', error)
    const message = error instanceof Error ? error.message : 'Could not load spec backfill proposals.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}

const SPEC_REVIEW_STRING_KEYS = [
  'originalName',
  'cleanName',
  'categoryHint',
  'brand',
  'device_type',
  'model',
  'operating_system',
  'processor',
  'ram',
  'storage',
  'color',
  'mdm_enrollment_status',
] as const satisfies readonly (keyof SpecReviewFields)[]

function isSpecReview(value: unknown): value is SpecReviewFields {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const review = value as Record<string, unknown>
  for (const key of SPEC_REVIEW_STRING_KEYS) {
    if (typeof review[key] !== 'string') return false
  }
  const securitySoftware = review.security_monitoring_software
  if (!Array.isArray(securitySoftware)) return false
  if (!securitySoftware.every((entry) => typeof entry === 'string')) return false
  return true
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params
    if (slug !== 'assets') {
      return Response.json({ error: 'Spec backfill is only available for the assets group.' }, { status: 400 })
    }

    await requireUserProfile()
    const group = await getGroupBySlug(slug)
    if (!group) {
      return Response.json({ error: 'Group not found.' }, { status: 404 })
    }

    const body = (await request.json()) as {
      recordId?: string
      review?: SpecReviewFields
      skip?: boolean
    }

    if (!body.recordId || typeof body.recordId !== 'string') {
      return Response.json({ error: 'recordId is required.' }, { status: 400 })
    }

    if (body.skip) {
      return Response.json({ skipped: true, recordId: body.recordId })
    }

    if (!isSpecReview(body.review)) {
      return Response.json({ error: 'review is required when applying a proposal.' }, { status: 400 })
    }

    const [fields, record] = await Promise.all([
      listFieldsForGroup(group.id),
      getRecordForGroup(group.id, body.recordId),
    ])
    if (!record) {
      return Response.json({ error: 'Record not found.' }, { status: 404 })
    }

    const data = applySpecBackfillReview(
      {
        currentData: (record.data ?? {}) as Record<string, unknown>,
        review: body.review,
      },
      fields,
    )

    const updated = await updateRecordForGroup(group.id, body.recordId, data)
    return Response.json({ record: updated })
  } catch (error) {
    console.error('[spec-backfill POST]', error)
    const message = error instanceof Error ? error.message : 'Could not apply spec backfill.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
