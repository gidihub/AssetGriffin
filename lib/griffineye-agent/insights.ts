import { assetRecordsQuery, resolveAssetsGroupId } from '@/lib/griffineye-agent/asset-records-query'
import { computeDataGaps, type ToolContext } from '@/lib/griffineye-agent/tools'

/**
 * Proactive observations computed from live org data. These run the same query
 * layer as the assistant but deliberately skip the LLM, so the dashboard costs
 * nothing against the org's AI allowance.
 */
export type LiveObservation = {
  id: string
  message: string
  /** Natural-language query to hand to the assistant when clicked through. */
  query: string
  kind: 'gap' | 'warranty' | 'stale' | 'maintenance'
}

const STALE_DAYS = 180
const WARRANTY_WINDOW_DAYS = 30

function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return count === 1 ? singular : pluralForm
}

export async function buildLiveObservations(ctx: ToolContext): Promise<LiveObservation[]> {
  const observations: LiveObservation[] = []
  await resolveAssetsGroupId(ctx)

  const gaps = await computeDataGaps(ctx)
  for (const gap of gaps.filter((entry) => entry.missing > 0).slice(0, 2)) {
    observations.push({
      id: `gap-${gap.field}`,
      message: `${gap.missing} ${plural(gap.missing, 'asset')} ${gap.missing === 1 ? 'has' : 'have'} ${gap.blankPhrase}`,
      query: `Which assets have ${gap.blankPhrase}?`,
      kind: 'gap',
    })
  }

  const { count: expiringCount } = await assetRecordsQuery(ctx, 'id', { count: 'exact', head: true })
    .gte('data->>warranty_expiration', isoDaysFromNow(0))
    .lte('data->>warranty_expiration', isoDaysFromNow(WARRANTY_WINDOW_DAYS))

  if (expiringCount) {
    observations.push({
      id: 'warranty-expiring',
      message: `Warranty expires within ${WARRANTY_WINDOW_DAYS} days on ${expiringCount} ${plural(expiringCount, 'asset')}`,
      query: `Which assets have a warranty expiring in the next ${WARRANTY_WINDOW_DAYS} days?`,
      kind: 'warranty',
    })
  }

  const { count: staleCount } = await assetRecordsQuery(ctx, 'id', { count: 'exact', head: true }).lt(
    'updated_at',
    isoDaysAgo(STALE_DAYS),
  )

  if (staleCount) {
    observations.push({
      id: 'stale-records',
      message: `${staleCount} ${plural(staleCount, 'record')} ${staleCount === 1 ? "hasn't" : "haven't"} been touched in ${STALE_DAYS / 30} months`,
      query: `Which assets have not been updated in the last ${STALE_DAYS} days?`,
      kind: 'stale',
    })
  }

  const { count: maintenanceCount } = await assetRecordsQuery(ctx, 'id', { count: 'exact', head: true }).in(
    'data->>status',
    ['In maintenance'],
  )

  if (maintenanceCount) {
    observations.push({
      id: 'in-maintenance',
      message: `${maintenanceCount} ${plural(maintenanceCount, 'asset')} ${maintenanceCount === 1 ? 'is' : 'are'} currently in maintenance`,
      query: 'Which assets are in maintenance?',
      kind: 'maintenance',
    })
  }

  return observations.slice(0, 4)
}
