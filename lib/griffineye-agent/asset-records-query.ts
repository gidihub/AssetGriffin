import type { SupabaseClient } from '@supabase/supabase-js'

type ToolContext = {
  supabase: SupabaseClient
  organizationId: string
}

export type AssetRow = {
  id: string
  asset_tag: string
  name: string
  category: string
  assigned_to: string
  location: string
  status: string
  purchase_date: string | null
  serial: string
  warranty_expiration: string | null
  purchase_value: number | string | null
  depreciation_value: string
  lifecycle_stage: string
  notes: string
  created_at: string
  updated_at: string
}

type DbRecordRow = {
  id: string
  data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

/** PostgREST builder; head/count selects change the inferred chain shape. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AssetQuery = any

const RECORD_SELECT = 'id, data, created_at, updated_at'
const ASSET_PAGE_SIZE = 1000

const assetsGroupCache = new Map<string, string>()

export async function resolveAssetsGroupId(ctx: ToolContext): Promise<string> {
  const cached = assetsGroupCache.get(ctx.organizationId)
  if (cached) return cached

  const { data, error } = await ctx.supabase
    .from('groups')
    .select('id')
    .eq('organization_id', ctx.organizationId)
    .eq('slug', 'assets')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Assets group is not configured for this organization.')

  assetsGroupCache.set(ctx.organizationId, data.id)
  return data.id
}

export function recordToAssetRow(record: DbRecordRow): AssetRow {
  const data = record.data ?? {}
  return {
    id: record.id,
    asset_tag: String(data.asset_tag ?? ''),
    name: String(data.name ?? ''),
    category: String(data.category ?? ''),
    assigned_to: String(data.assigned_to ?? ''),
    location: String(data.location ?? ''),
    status: String(data.status ?? ''),
    purchase_date: (data.purchase_date as string | null) ?? null,
    serial: String(data.serial ?? ''),
    warranty_expiration: (data.warranty_expiration as string | null) ?? null,
    purchase_value: (data.purchase_value as number | string | null) ?? null,
    depreciation_value: String(data.depreciation_value ?? ''),
    lifecycle_stage: String(data.lifecycle_stage ?? ''),
    notes: String(data.notes ?? ''),
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

function jsonKey(key: string): string {
  return `data->>${key}`
}

/** Numeric cast for jsonb text values (avoids lexicographic comparisons). */
function jsonNumericKey(key: string): string {
  return `(data->>${key})::numeric`
}

export function recordSortColumn(sortBy: string): string {
  if (sortBy === 'created_at' || sortBy === 'updated_at') return sortBy
  if (sortBy === 'purchase_value') return jsonNumericKey('purchase_value')
  return jsonKey(sortBy)
}

/**
 * Base query against the Assets group in public.records.
 * Sync so callers can chain filters before a single final `await`.
 * Await resolveAssetsGroupId(ctx) first — the async wrapper below does both.
 */
export function assetRecordsQuery(
  ctx: ToolContext,
  select = RECORD_SELECT,
  options?: { count?: 'exact'; head?: boolean },
): AssetQuery {
  const groupId = assetsGroupCache.get(ctx.organizationId)
  if (!groupId) {
    throw new Error('Assets group id is not cached. Call resolveAssetsGroupId(ctx) before querying records.')
  }

  return ctx.supabase
    .from('records')
    .select(select, options)
    .eq('organization_id', ctx.organizationId)
    .eq('group_id', groupId) as unknown as AssetQuery
}


export type AssetFilters = {
  category?: string[]
  location?: string[]
  status?: string[]
  assigned_to?: string[]
  lifecycle_stage?: string[]
  purchase_date_from?: string
  purchase_date_to?: string
  warranty_expiration_from?: string
  warranty_expiration_to?: string
  min_value?: number
  max_value?: number
  text_search?: string
  unassigned_only?: boolean
}

const ASSET_STATUSES = ['In use', 'In maintenance', 'Retired', 'Available'] as const
const LIFECYCLE_STAGES = ['Procurement', 'Deployed', 'In Maintenance', 'Retired/Disposed'] as const

function sanitizeFilterValue(value: string): string {
  return value.replace(/[,(){}"\\*]/g, ' ').trim()
}

function ilikePatterns(values: string[]): string[] {
  return values
    .map((value) => sanitizeFilterValue(value))
    .filter(Boolean)
    .map((value) => `%${value}%`)
}

function normalizeToKnown<T extends string>(values: string[], known: readonly T[]): T[] {
  const matched = new Set<T>()
  for (const value of values) {
    const hit = known.find((option) => option.toLowerCase() === value.trim().toLowerCase())
    if (hit) matched.add(hit)
  }
  return Array.from(matched)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function applyAssetRecordFilters(query: AssetQuery, filters: AssetFilters = {}): AssetQuery {
  let next = query

  if (filters.category?.length) {
    const patterns = ilikePatterns(filters.category)
    if (patterns.length) next = next.ilikeAnyOf(jsonKey('category'), patterns)
  }
  if (filters.location?.length) {
    const patterns = ilikePatterns(filters.location)
    if (patterns.length) next = next.ilikeAnyOf(jsonKey('location'), patterns)
  }
  if (filters.assigned_to?.length) {
    const patterns = ilikePatterns(filters.assigned_to)
    if (patterns.length) next = next.ilikeAnyOf(jsonKey('assigned_to'), patterns)
  }
  if (filters.status?.length) {
    const statuses = normalizeToKnown(filters.status, ASSET_STATUSES)
    if (!statuses.length) throw new Error('No supported status filter values were provided.')
    next = next.in(jsonKey('status'), statuses)
  }
  if (filters.lifecycle_stage?.length) {
    const stages = normalizeToKnown(filters.lifecycle_stage, LIFECYCLE_STAGES)
    if (!stages.length) throw new Error('No supported lifecycle-stage filter values were provided.')
    next = next.in(jsonKey('lifecycle_stage'), stages)
  }

  if (isIsoDate(filters.purchase_date_from)) next = next.gte(jsonKey('purchase_date'), filters.purchase_date_from)
  if (isIsoDate(filters.purchase_date_to)) next = next.lte(jsonKey('purchase_date'), filters.purchase_date_to)
  if (isIsoDate(filters.warranty_expiration_from)) {
    next = next.gte(jsonKey('warranty_expiration'), filters.warranty_expiration_from)
  }
  if (isIsoDate(filters.warranty_expiration_to)) {
    next = next.lte(jsonKey('warranty_expiration'), filters.warranty_expiration_to)
  }

  if (Number.isFinite(Number(filters.min_value))) {
    next = next.gte(jsonNumericKey('purchase_value'), Number(filters.min_value))
  }
  if (Number.isFinite(Number(filters.max_value))) {
    next = next.lte(jsonNumericKey('purchase_value'), Number(filters.max_value))
  }

  if (filters.unassigned_only) {
    next = next.in(jsonKey('assigned_to'), ['Unassigned', ''])
  }

  if (filters.text_search?.trim()) {
    const term = sanitizeFilterValue(filters.text_search)
    if (term) {
      next = next.or(
        [
          `${jsonKey('name')}.ilike.%${term}%`,
          `${jsonKey('asset_tag')}.ilike.%${term}%`,
          `${jsonKey('serial')}.ilike.%${term}%`,
          `${jsonKey('notes')}.ilike.%${term}%`,
          `${jsonKey('category')}.ilike.%${term}%`,
          `${jsonKey('assigned_to')}.ilike.%${term}%`,
          `${jsonKey('location')}.ilike.%${term}%`,
        ].join(','),
      )
    }
  }

  return next
}

export async function fetchAllAssetRecords(
  ctx: ToolContext,
  buildQuery: (base: AssetQuery) => AssetQuery = (base) => base,
): Promise<AssetRow[]> {
  await resolveAssetsGroupId(ctx)
  const rows: AssetRow[] = []
  let from = 0

  while (true) {
    const built = buildQuery(assetRecordsQuery(ctx))
    const { data, error } = await built
      .order('id', { ascending: true })
      .range(from, from + ASSET_PAGE_SIZE - 1)
    if (error) throw new Error(error.message)

    const batch = ((data ?? []) as DbRecordRow[]).map(recordToAssetRow)
    rows.push(...batch)
    if (batch.length < ASSET_PAGE_SIZE) break
    from += ASSET_PAGE_SIZE
  }

  return rows
}

export async function mapQueryRows(query: AssetQuery): Promise<AssetRow[]> {
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return ((data ?? []) as DbRecordRow[]).map(recordToAssetRow)
}
