import type { SupabaseClient } from '@supabase/supabase-js'
import type { DbAuditLogRow } from '@/lib/griffineye-audit'
import { AUDIT_CATEGORIES, AUDIT_SOURCES } from '@/lib/griffineye-audit'
import {
  applyAssetRecordFilters,
  assetRecordsQuery,
  fetchAllAssetRecords,
  mapQueryRows,
  recordSortColumn,
  resolveAssetsGroupId,
  type AssetFilters,
  type AssetQuery,
  type AssetRow,
} from '@/lib/griffineye-agent/asset-records-query'
import { available, toModelToolPayload } from '@/lib/griffineye-security/availability'
import { sanitizeToolArguments } from '@/lib/griffineye-security/sanitize-asset-filters'

export type { AssetFilters }

function makeOutcome(data: Record<string, unknown>, table?: ToolTable): ToolOutcome {
  return { modelPayload: toModelToolPayload(available(data)), table }
}

/**
 * Every tool runs through this context. `supabase` is the request-scoped SSR
 * client, so RLS already confines reads to the caller's organization;
 * `organizationId` is applied as an explicit second filter on every query so
 * scoping never depends on the model behaving well.
 */
export type ToolContext = {
  supabase: SupabaseClient
  organizationId: string
  /** Shown in generated report headers when available. */
  organizationName?: string
}

export type ToolTable = {
  columns: { key: string; header: string }[]
  rows: Record<string, string | number | null>[]
}

export type ToolOutcome = {
  /** Compact result handed back to the model. */
  modelPayload: unknown
  /** Tabular data for the UI to render, when the result is row-shaped. */
  table?: ToolTable
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200
const PAGE_SIZE = 1000

function applyAssetFilters(query: AssetQuery, filters: AssetFilters = {}): AssetQuery {
  return applyAssetRecordFilters(query, filters)
}

/** PostgREST filter lists are comma/brace/paren delimited, so those chars must go. */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[,(){}"\\*]/g, ' ').trim()
}

function clampLimit(limit: unknown, cap = MAX_LIMIT): number {
  const parsed = Number(limit)
  if (!Number.isFinite(parsed) || parsed <= 0) return Math.min(DEFAULT_LIMIT, cap)
  return Math.min(cap, Math.floor(parsed))
}

function describeFilters(filters: AssetFilters = {}): string {
  const parts: string[] = []
  if (filters.category?.length) parts.push(`category ${filters.category.join(' or ')}`)
  if (filters.location?.length) parts.push(`location ${filters.location.join(' or ')}`)
  if (filters.status?.length) parts.push(`status ${filters.status.join(' or ')}`)
  if (filters.assigned_to?.length) parts.push(`assigned to ${filters.assigned_to.join(' or ')}`)
  if (filters.lifecycle_stage?.length) parts.push(`lifecycle ${filters.lifecycle_stage.join(' or ')}`)
  if (filters.unassigned_only) parts.push('unassigned only')
  if (filters.purchase_date_from) parts.push(`purchased on/after ${filters.purchase_date_from}`)
  if (filters.purchase_date_to) parts.push(`purchased on/before ${filters.purchase_date_to}`)
  if (filters.warranty_expiration_from) parts.push(`warranty on/after ${filters.warranty_expiration_from}`)
  if (filters.warranty_expiration_to) parts.push(`warranty on/before ${filters.warranty_expiration_to}`)
  if (filters.min_value != null) parts.push(`value >= ${filters.min_value}`)
  if (filters.max_value != null) parts.push(`value <= ${filters.max_value}`)
  if (filters.text_search) parts.push(`text matching "${filters.text_search}"`)
  return parts.length ? parts.join(', ') : 'no filters'
}

// ---------------------------------------------------------------------------
// Shared row shaping
// ---------------------------------------------------------------------------

const ASSET_TABLE_COLUMNS: ToolTable['columns'] = [
  { key: 'asset_tag', header: 'Asset tag' },
  { key: 'name', header: 'Name' },
  { key: 'category', header: 'Category' },
  { key: 'assigned_to', header: 'Assigned to' },
  { key: 'location', header: 'Location' },
  { key: 'status', header: 'Status' },
  { key: 'purchase_date', header: 'Purchased' },
  { key: 'serial', header: 'Serial' },
  { key: 'value', header: 'Value' },
]

function toNumber(value: number | string | null): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toAssetTable(rows: AssetRow[]): ToolTable {
  return {
    columns: ASSET_TABLE_COLUMNS,
    rows: rows.map((row) => ({
      asset_tag: row.asset_tag,
      name: row.name,
      category: row.category,
      assigned_to: row.assigned_to,
      location: row.location || '—',
      status: row.status,
      purchase_date: row.purchase_date,
      serial: row.serial || '—',
      value: toNumber(row.purchase_value),
    })),
  }
}

/** Trimmed rows for the model — enough to answer without burning context. */
function toModelRows(rows: AssetRow[]) {
  return rows.map((row) => ({
    asset_tag: row.asset_tag,
    name: row.name,
    category: row.category,
    assigned_to: row.assigned_to,
    location: row.location,
    status: row.status,
    purchase_date: row.purchase_date,
    serial: row.serial,
    value: toNumber(row.purchase_value),
    warranty_expiration: row.warranty_expiration,
  }))
}

// ---------------------------------------------------------------------------
// Tool: count_assets
// ---------------------------------------------------------------------------

async function countAssets(ctx: ToolContext, args: { filters?: AssetFilters }): Promise<ToolOutcome> {
  await resolveAssetsGroupId(ctx)
  const query = applyAssetFilters(
    assetRecordsQuery(ctx, 'id', { count: 'exact', head: true }),
    args.filters,
  )
  const { count, error } = await query

  if (error) throw new Error(error.message)

  return makeOutcome({
    count: count ?? 0,
    filters_applied: describeFilters(args.filters),
  })
}

// ---------------------------------------------------------------------------
// Tool: search_assets
// ---------------------------------------------------------------------------

async function searchAssets(
  ctx: ToolContext,
  args: { filters?: AssetFilters; limit?: number; sort_by?: string; direction?: 'asc' | 'desc' },
): Promise<ToolOutcome> {
  const limit = clampLimit(args.limit)
  const sortable = new Set([
    'name',
    'category',
    'location',
    'status',
    'assigned_to',
    'purchase_date',
    'purchase_value',
    'warranty_expiration',
    'created_at',
    'updated_at',
  ])
  const sortBy = sortable.has(String(args.sort_by)) ? String(args.sort_by) : 'created_at'
  const ascending = args.direction === 'asc'

  await resolveAssetsGroupId(ctx)
  let query = applyAssetFilters(assetRecordsQuery(ctx), args.filters)
  query = query.order(recordSortColumn(sortBy), { ascending, nullsFirst: false }).limit(limit) as AssetQuery

  const rows = await mapQueryRows(query)

  return makeOutcome(
    {
      returned: rows.length,
      truncated: rows.length === limit,
      filters_applied: describeFilters(args.filters),
      assets: toModelRows(rows),
    },
    toAssetTable(rows),
  )
}

// ---------------------------------------------------------------------------
// Tool: rank_by
// ---------------------------------------------------------------------------

const GROUPABLE = ['assigned_to', 'location', 'category', 'status', 'lifecycle_stage'] as const
type Groupable = (typeof GROUPABLE)[number]

const GROUP_LABELS: Record<Groupable, string> = {
  assigned_to: 'Owner',
  location: 'Location',
  category: 'Category',
  status: 'Status',
  lifecycle_stage: 'Lifecycle stage',
}

async function rankBy(
  ctx: ToolContext,
  args: {
    group_by?: string
    dimension?: 'count' | 'total_value' | 'average_value'
    filters?: AssetFilters
    direction?: 'asc' | 'desc'
    limit?: number
    /** Internal: report exports use REPORT_EXPORT_LIMIT instead of MAX_LIMIT. */
    forExport?: boolean
  },
): Promise<ToolOutcome> {
  const groupBy = (GROUPABLE as readonly string[]).includes(String(args.group_by))
    ? (args.group_by as Groupable)
    : 'assigned_to'
  const dimension = args.dimension ?? 'count'
  const exportCap = args.forExport ? REPORT_EXPORT_LIMIT : MAX_LIMIT
  const defaultLimit = args.forExport ? REPORT_EXPORT_LIMIT : 10
  const limit = clampLimit(args.limit ?? defaultLimit, exportCap)

  const rows = await fetchAllAssetRecords(ctx, (base) => applyAssetFilters(base, args.filters))

  const buckets = new Map<string, { count: number; total: number; valued: number }>()
  for (const row of rows) {
    const rawKey = row[groupBy]
    const key = typeof rawKey === 'string' && rawKey.trim() ? rawKey : 'Unspecified'
    const value = toNumber(row.purchase_value)
    const bucket = buckets.get(key) ?? { count: 0, total: 0, valued: 0 }
    bucket.count += 1
    if (value != null) {
      bucket.total += value
      bucket.valued += 1
    }
    buckets.set(key, bucket)
  }

  const ranked = Array.from(buckets.entries()).map(([key, bucket]) => ({
    group: key,
    count: bucket.count,
    total_value: Math.round(bucket.total * 100) / 100,
    average_value: bucket.valued ? Math.round((bucket.total / bucket.valued) * 100) / 100 : null,
  }))

  const metric = dimension === 'count' ? 'count' : dimension
  ranked.sort((a, b) => {
    const left = (a[metric as keyof typeof a] as number | null) ?? -Infinity
    const right = (b[metric as keyof typeof b] as number | null) ?? -Infinity
    return args.direction === 'asc' ? left - right : right - left
  })

  const top = ranked.slice(0, limit)

  return makeOutcome(
    {
      group_by: groupBy,
      dimension,
      groups_found: ranked.length,
      filters_applied: describeFilters(args.filters),
      ranking: top,
    },
    {
      columns: [
        { key: 'group', header: GROUP_LABELS[groupBy] },
        { key: 'count', header: 'Assets' },
        { key: 'total_value', header: 'Total value' },
        { key: 'average_value', header: 'Avg value' },
      ],
      rows: top,
    },
  )
}

// ---------------------------------------------------------------------------
// Tool: assets_by_recency
// ---------------------------------------------------------------------------

async function assetsByRecency(
  ctx: ToolContext,
  args: {
    field?: 'created_at' | 'updated_at';
    direction?: 'within' | 'not_within'
    days?: number
    limit?: number
    filters?: AssetFilters
  },
): Promise<ToolOutcome> {
  const field = args.field === 'updated_at' ? 'updated_at' : 'created_at'
  const direction = args.direction === 'not_within' ? 'not_within' : 'within'
  const days = Number.isFinite(Number(args.days)) && Number(args.days) > 0 ? Math.floor(Number(args.days)) : 30
  const limit = clampLimit(args.limit)

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  await resolveAssetsGroupId(ctx)
  let query = applyAssetFilters(assetRecordsQuery(ctx), args.filters)
  query = (direction === 'within' ? query.gte(field, cutoff) : query.lt(field, cutoff)) as AssetQuery
  query = query
    .order(field, { ascending: direction === 'not_within', nullsFirst: false })
    .limit(limit) as AssetQuery

  const rows = await mapQueryRows(query)

  // Total ignores the row limit so counts stay accurate for large results.
  let countQuery = applyAssetFilters(
    assetRecordsQuery(ctx, 'id', { count: 'exact', head: true }),
    args.filters,
  )
  countQuery = (direction === 'within'
    ? countQuery.gte(field, cutoff)
    : countQuery.lt(field, cutoff)) as AssetQuery
  const { count } = await countQuery

  const columns = [...ASSET_TABLE_COLUMNS, { key: 'timestamp', header: field === 'created_at' ? 'Added' : 'Last updated' }]
  const table = toAssetTable(rows)

  return makeOutcome(
    {
      field,
      direction,
      days,
      total_matching: count ?? rows.length,
      returned: rows.length,
      cutoff,
      assets: toModelRows(rows).map((row, index) => ({ ...row, timestamp: rows[index][field] })),
    },
    {
      columns,
      rows: table.rows.map((row, index) => ({ ...row, timestamp: rows[index][field] })),
    },
  )
}

// ---------------------------------------------------------------------------
// Tool: find_data_gaps
// ---------------------------------------------------------------------------

/**
 * Fields worth checking for hygiene, with what "blank" means for each. The
 * assets table defaults most text columns to '' rather than null, and
 * assigned_to to the literal 'Unassigned', so emptiness is per-field.
 */
const GAP_FIELDS = {
  serial: {
    label: 'Serial number',
    blankPhrase: 'no serial number',
    isBlank: (row: AssetRow) => !row.serial?.trim(),
  },
  location: {
    label: 'Location',
    blankPhrase: 'no location set',
    isBlank: (row: AssetRow) => !row.location?.trim(),
  },
  assigned_to: {
    label: 'Assigned owner',
    blankPhrase: 'no assigned owner',
    isBlank: (row: AssetRow) => !row.assigned_to?.trim() || row.assigned_to === 'Unassigned',
  },
  purchase_date: {
    label: 'Purchase date',
    blankPhrase: 'no purchase date',
    isBlank: (row: AssetRow) => !row.purchase_date,
  },
  warranty_expiration: {
    label: 'Warranty expiration',
    blankPhrase: 'no warranty expiration date',
    isBlank: (row: AssetRow) => !row.warranty_expiration,
  },
  purchase_value: {
    label: 'Purchase value',
    blankPhrase: 'no purchase value recorded',
    isBlank: (row: AssetRow) => toNumber(row.purchase_value) == null,
  },
  notes: { label: 'Notes', blankPhrase: 'no notes', isBlank: (row: AssetRow) => !row.notes?.trim() },
  category: { label: 'Category', blankPhrase: 'no category', isBlank: (row: AssetRow) => !row.category?.trim() },
} as const

export type GapField = keyof typeof GAP_FIELDS

export type DataGapSummary = {
  field: GapField
  label: string
  /** Reads naturally mid-sentence, e.g. "8 assets have no notes". */
  blankPhrase: string
  missing: number
  total: number
  percent: number
}

/** Shared by the tool and the dashboard data-health panel. */
export async function computeDataGaps(ctx: ToolContext): Promise<DataGapSummary[]> {
  await resolveAssetsGroupId(ctx)
  const { count, error: countError } = await assetRecordsQuery(ctx, 'id', { count: 'exact', head: true })
  if (countError) throw new Error(countError.message)

  const rows = await fetchAllAssetRecords(ctx)
  const total = count ?? rows.length

  return (Object.keys(GAP_FIELDS) as GapField[])
    .map((field) => {
      const missing = rows.filter((row) => GAP_FIELDS[field].isBlank(row)).length
      return {
        field,
        label: GAP_FIELDS[field].label,
        blankPhrase: GAP_FIELDS[field].blankPhrase,
        missing,
        total,
        percent: total ? Math.round((missing / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.missing - a.missing)
}

async function findDataGaps(
  ctx: ToolContext,
  args: { field?: string; limit?: number },
): Promise<ToolOutcome> {
  const requested = args.field && args.field in GAP_FIELDS ? (args.field as GapField) : null

  if (!requested) {
    const allGaps = await computeDataGaps(ctx)
    const totalAssets = allGaps[0]?.total ?? 0
    const gaps = allGaps.filter((gap) => gap.missing > 0)
    return makeOutcome(
      {
        mode: 'summary',
        total_assets: totalAssets,
        gaps,
      },
      {
        columns: [
          { key: 'label', header: 'Field' },
          { key: 'missing', header: 'Missing' },
          { key: 'total', header: 'Total assets' },
          { key: 'percent', header: '% blank' },
        ],
        rows: gaps.map((gap) => ({ label: gap.label, missing: gap.missing, total: gap.total, percent: gap.percent })),
      },
    )
  }

  const limit = clampLimit(args.limit)
  const rows = await fetchAllAssetRecords(ctx)
  const affected = rows.filter((row) => GAP_FIELDS[requested].isBlank(row))
  const shown = affected.slice(0, limit)

  return makeOutcome(
    {
      mode: 'field_detail',
      field: requested,
      label: GAP_FIELDS[requested].label,
      missing: affected.length,
      total: rows.length,
      returned: shown.length,
      assets: toModelRows(shown),
    },
    toAssetTable(shown),
  )
}

// ---------------------------------------------------------------------------
// Tool: get_schema_info
// ---------------------------------------------------------------------------

type SchemaRow = {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: boolean
  column_default: string | null
}

const RECORD_FIELDS_SUFFIX = ' (record fields)'

/** User-facing field definitions only — not Postgres column metadata for internal tables. */
function isRecordFieldRow(row: SchemaRow): boolean {
  return row.table_name.includes(RECORD_FIELDS_SUFFIX)
}

function normalizeSchemaTableFilter(requested: string): string {
  const lower = requested.trim().toLowerCase()
  if (lower === 'assets' || lower === 'records') return `assets${RECORD_FIELDS_SUFFIX}`
  if (!lower.includes(RECORD_FIELDS_SUFFIX)) return `${lower}${RECORD_FIELDS_SUFFIX}`
  return requested.trim()
}

function filterSchemaRows(all: SchemaRow[], table?: string): SchemaRow[] {
  const recordFields = all.filter(isRecordFieldRow)
  const requested = table?.trim()
  if (!requested) return recordFields
  const tableKey = normalizeSchemaTableFilter(requested).toLowerCase()
  return recordFields.filter((row) => row.table_name.toLowerCase() === tableKey)
}

function schemaGroupLabel(tableName: string): string {
  return tableName.replace(RECORD_FIELDS_SUFFIX, '').replace(/^\w/, (c) => c.toUpperCase())
}

function schemaInfoExportTable(rows: SchemaRow[]): ToolTable {
  return {
    columns: [
      { key: 'group', header: 'Group' },
      { key: 'field', header: 'Field' },
      { key: 'type', header: 'Type' },
      { key: 'optional', header: 'Optional' },
    ],
    rows: rows.map((row) => ({
      group: schemaGroupLabel(row.table_name),
      field: row.column_name,
      type: row.data_type,
      optional: row.is_nullable ? 'Yes' : 'No',
    })),
  }
}

async function getSchemaInfo(ctx: ToolContext, args: { table?: string }): Promise<ToolOutcome> {
  const { data, error } = await ctx.supabase.rpc('griffineye_schema_info')
  if (error) throw new Error(error.message)

  const rows = filterSchemaRows((data ?? []) as SchemaRow[], args.table)

  const byTable = new Map<string, SchemaRow[]>()
  for (const row of rows) {
    byTable.set(row.table_name, [...(byTable.get(row.table_name) ?? []), row])
  }

  return makeOutcome({
    tables: Array.from(byTable.entries()).map(([table, columns]) => ({
      group: schemaGroupLabel(table),
      fields: columns.map((column) => ({
        name: column.column_name,
        type: column.data_type,
        optional: column.is_nullable,
      })),
    })),
  })
}

// ---------------------------------------------------------------------------
// Tool: get_change_history
// ---------------------------------------------------------------------------

async function getChangeHistory(
  ctx: ToolContext,
  args: {
    category?: string
    source?: string
    actor?: string
    entity_label?: string
    days?: number
    limit?: number
  },
): Promise<ToolOutcome> {
  const limit = clampLimit(args.limit)

  let query = ctx.supabase
    .from('audit_log')
    .select('id, category, action, source, actor_label, entity_type, entity_label, summary, created_at')
    .eq('organization_id', ctx.organizationId)

  if (args.category && (AUDIT_CATEGORIES as readonly string[]).includes(args.category)) {
    query = query.eq('category', args.category)
  }
  if (args.source && (AUDIT_SOURCES as readonly string[]).includes(args.source)) {
    query = query.eq('source', args.source)
  }
  if (args.actor?.trim()) {
    query = query.ilike('actor_label', `%${sanitizeFilterValue(args.actor)}%`)
  }
  if (args.entity_label?.trim()) {
    query = query.ilike('entity_label', `%${sanitizeFilterValue(args.entity_label)}%`)
  }
  if (Number.isFinite(Number(args.days)) && Number(args.days) > 0) {
    const cutoff = new Date(Date.now() - Math.floor(Number(args.days)) * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', cutoff)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Array<Pick<
    DbAuditLogRow,
    'id' | 'category' | 'action' | 'source' | 'actor_label' | 'entity_type' | 'entity_label' | 'summary' | 'created_at'
  >>

  // An empty result is usually an over-narrow filter (category and source are
  // easy to conflate). Hand back what the log actually contains so the model can
  // correct itself instead of reporting "nothing happened".
  if (!rows.length) {
    const { data: available } = await ctx.supabase
      .from('audit_log')
      .select('category, source')
      .eq('organization_id', ctx.organizationId)
      .limit(1000)

    const combos = new Map<string, number>()
    for (const row of (available ?? []) as Array<{ category: string; source: string }>) {
      const key = `${row.category}/${row.source}`
      combos.set(key, (combos.get(key) ?? 0) + 1)
    }

    return makeOutcome({
      returned: 0,
      note:
        'No events matched those filters. category is the sub-log, source is how the change was made — they are independent, so avoid combining them unless the user asked for both.',
      available_category_source_combinations: Array.from(combos.entries()).map(([combo, count]) => ({
        combination: combo,
        events: count,
      })),
      events: [],
    })
  }

  return makeOutcome(
    {
      returned: rows.length,
      events: rows.map((row) => ({
        when: row.created_at,
        category: row.category,
        source: row.source,
        actor: row.actor_label,
        action: row.action,
        entity: row.entity_label,
        summary: row.summary,
      })),
    },
    {
      columns: [
        { key: 'created_at', header: 'When' },
        { key: 'actor_label', header: 'Actor' },
        { key: 'action', header: 'Action' },
        { key: 'entity_label', header: 'Record' },
        { key: 'source', header: 'Source' },
      ],
      rows: rows.map((row) => ({
        created_at: row.created_at,
        actor_label: row.actor_label,
        action: row.action,
        entity_label: row.entity_label || '—',
        source: row.source,
      })),
    },
  )
}

// ---------------------------------------------------------------------------
// Report export — uncapped re-fetch of the latest query
// ---------------------------------------------------------------------------

export const REPORT_EXPORT_LIMIT = 10_000

export type ReportQuerySource = {
  tool: ToolName
  args: Record<string, unknown>
}

const SEARCH_SORTABLE = new Set([
  'name',
  'category',
  'location',
  'status',
  'assigned_to',
  'purchase_date',
  'purchase_value',
  'warranty_expiration',
  'created_at',
  'updated_at',
])

async function fetchSearchAssetsReportTable(
  ctx: ToolContext,
  args: { filters?: AssetFilters; sort_by?: string; direction?: 'asc' | 'desc' },
): Promise<ToolTable> {
  const sortBy = SEARCH_SORTABLE.has(String(args.sort_by)) ? String(args.sort_by) : 'created_at'
  const ascending = args.direction === 'asc'
  const rows = await fetchAllAssetRecords(ctx, (base) => {
    const query = applyAssetFilters(base, args.filters)
    return query.order(recordSortColumn(sortBy), { ascending, nullsFirst: false }) as AssetQuery
  })
  return toAssetTable(rows)
}

async function fetchRecencyReportTable(
  ctx: ToolContext,
  args: {
    field?: 'created_at' | 'updated_at'
    direction?: 'within' | 'not_within'
    days?: number
    filters?: AssetFilters
  },
): Promise<ToolTable> {
  const field = args.field === 'updated_at' ? 'updated_at' : 'created_at'
  const direction = args.direction === 'not_within' ? 'not_within' : 'within'
  const days = Number.isFinite(Number(args.days)) && Number(args.days) > 0 ? Math.floor(Number(args.days)) : 30
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const rows = await fetchAllAssetRecords(ctx, (base) => {
    let query = applyAssetFilters(base, args.filters)
    query = (direction === 'within' ? query.gte(field, cutoff) : query.lt(field, cutoff)) as AssetQuery
    return query.order(field, { ascending: direction === 'not_within', nullsFirst: false }) as AssetQuery
  })

  const columns = [...ASSET_TABLE_COLUMNS, { key: 'timestamp', header: field === 'created_at' ? 'Added' : 'Last updated' }]
  const table = toAssetTable(rows)
  return {
    columns,
    rows: table.rows.map((row, index) => ({ ...row, timestamp: rows[index][field] })),
  }
}

async function fetchDataGapsReportTable(
  ctx: ToolContext,
  args: { field?: string; limit?: number },
): Promise<ToolTable | undefined> {
  const requested = args.field && args.field in GAP_FIELDS ? (args.field as GapField) : null
  if (!requested) {
    return (await findDataGaps(ctx, args)).table
  }

  const rows = await fetchAllAssetRecords(ctx)
  return toAssetTable(rows.filter((row) => GAP_FIELDS[requested].isBlank(row)))
}

async function fetchChangeHistoryReportTable(
  ctx: ToolContext,
  args: {
    category?: string
    source?: string
    actor?: string
    entity_label?: string
    days?: number
  },
): Promise<ToolTable | undefined> {
  const rows: Array<
    Pick<
      DbAuditLogRow,
      'id' | 'category' | 'action' | 'source' | 'actor_label' | 'entity_type' | 'entity_label' | 'summary' | 'created_at'
    >
  > = []
  let from = 0

  while (true) {
    let query = ctx.supabase
      .from('audit_log')
      .select('id, category, action, source, actor_label, entity_type, entity_label, summary, created_at')
      .eq('organization_id', ctx.organizationId)

    if (args.category && (AUDIT_CATEGORIES as readonly string[]).includes(args.category)) {
      query = query.eq('category', args.category)
    }
    if (args.source && (AUDIT_SOURCES as readonly string[]).includes(args.source)) {
      query = query.eq('source', args.source)
    }
    if (args.actor?.trim()) {
      query = query.ilike('actor_label', `%${sanitizeFilterValue(args.actor)}%`)
    }
    if (args.entity_label?.trim()) {
      query = query.ilike('entity_label', `%${sanitizeFilterValue(args.entity_label)}%`)
    }
    if (Number.isFinite(Number(args.days)) && Number(args.days) > 0) {
      const cutoff = new Date(Date.now() - Math.floor(Number(args.days)) * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('created_at', cutoff)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(error.message)

    const batch = (data ?? []) as typeof rows
    rows.push(...batch)
    if (batch.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  if (!rows.length) return undefined

  return {
    columns: [
      { key: 'created_at', header: 'When' },
      { key: 'actor_label', header: 'Actor' },
      { key: 'action', header: 'Action' },
      { key: 'entity_label', header: 'Record' },
      { key: 'source', header: 'Source' },
    ],
    rows: rows.map((row) => ({
      created_at: row.created_at,
      actor_label: row.actor_label,
      action: row.action,
      entity_label: row.entity_label || '—',
      source: row.source,
    })),
  }
}

/** Re-run the latest row-shaped query without UI row caps for file export. */
export async function fetchFullReportTable(
  ctx: ToolContext,
  source: ReportQuerySource,
): Promise<ToolTable | undefined> {
  switch (source.tool) {
    case 'search_assets':
      return fetchSearchAssetsReportTable(
        ctx,
        source.args as { filters?: AssetFilters; sort_by?: string; direction?: 'asc' | 'desc' },
      )
    case 'rank_by':
      return (
        await rankBy(ctx, {
          ...(source.args as Parameters<typeof rankBy>[1]),
          limit: REPORT_EXPORT_LIMIT,
          forExport: true,
        })
      ).table
    case 'assets_by_recency':
      return fetchRecencyReportTable(ctx, source.args as Parameters<typeof fetchRecencyReportTable>[1])
    case 'find_data_gaps':
      return fetchDataGapsReportTable(ctx, source.args as { field?: string; limit?: number })
    case 'get_schema_info': {
      const { data, error } = await ctx.supabase.rpc('griffineye_schema_info')
      if (error) throw new Error(error.message)
      const rows = filterSchemaRows((data ?? []) as SchemaRow[], (source.args as { table?: string }).table)
      return schemaInfoExportTable(rows)
    }
    case 'get_change_history':
      return fetchChangeHistoryReportTable(ctx, source.args as Parameters<typeof fetchChangeHistoryReportTable>[1])
    default:
      return undefined
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export type ToolName =
  | 'count_assets'
  | 'search_assets'
  | 'rank_by'
  | 'assets_by_recency'
  | 'find_data_gaps'
  | 'get_schema_info'
  | 'get_change_history'

type ToolExecutor = (ctx: ToolContext, args: Record<string, unknown>) => Promise<ToolOutcome>

function bindToolExecutor<T extends Record<string, unknown>>(
  toolName: ToolName,
  run: (ctx: ToolContext, args: T) => Promise<ToolOutcome>,
): ToolExecutor {
  return (ctx, raw) => run(ctx, sanitizeToolArguments(toolName, raw) as T)
}

export const TOOL_EXECUTORS: Record<ToolName, ToolExecutor> = {
  count_assets: bindToolExecutor('count_assets', (ctx, args) => countAssets(ctx, args as { filters?: AssetFilters })),
  search_assets: bindToolExecutor('search_assets', (ctx, args) =>
    searchAssets(ctx, args as Parameters<typeof searchAssets>[1]),
  ),
  rank_by: bindToolExecutor('rank_by', (ctx, args) => rankBy(ctx, args as Parameters<typeof rankBy>[1])),
  assets_by_recency: bindToolExecutor('assets_by_recency', (ctx, args) =>
    assetsByRecency(ctx, args as Parameters<typeof assetsByRecency>[1]),
  ),
  find_data_gaps: bindToolExecutor('find_data_gaps', (ctx, args) =>
    findDataGaps(ctx, args as { field?: string; limit?: number }),
  ),
  get_schema_info: bindToolExecutor('get_schema_info', (ctx, args) =>
    getSchemaInfo(ctx, args as { table?: string }),
  ),
  get_change_history: bindToolExecutor('get_change_history', (ctx, args) =>
    getChangeHistory(ctx, args as Parameters<typeof getChangeHistory>[1]),
  ),
}

export function isToolName(value: string): value is ToolName {
  return value in TOOL_EXECUTORS
}

// ---------------------------------------------------------------------------
// Data dictionary — grounds the model in the values this org actually uses
// ---------------------------------------------------------------------------

export type OrgDataDictionary = {
  totalAssets: number
  categories: string[]
  locations: string[]
  statuses: string[]
  owners: string[]
}

export async function getOrgDataDictionary(ctx: ToolContext): Promise<OrgDataDictionary> {
  await resolveAssetsGroupId(ctx)
  const { count, error: countError } = await assetRecordsQuery(ctx, 'id', { count: 'exact', head: true })
  if (countError) throw new Error(countError.message)

  const rows = await fetchAllAssetRecords(ctx)
  const distinct = (key: keyof Pick<AssetRow, 'category' | 'location' | 'status' | 'assigned_to'>) =>
    Array.from(
      new Set(rows.map((row) => row[key]).filter((value): value is string => Boolean(value?.trim()))),
    ).sort()

  return {
    totalAssets: count ?? rows.length,
    categories: distinct('category'),
    locations: distinct('location'),
    statuses: distinct('status'),
    owners: distinct('assigned_to'),
  }
}
