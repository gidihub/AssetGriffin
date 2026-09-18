import type { AssetFilters } from '@/lib/griffineye-agent/asset-records-query'

const ALLOWED_FILTER_KEYS = new Set([
  'category',
  'location',
  'status',
  'assigned_to',
  'lifecycle_stage',
  'purchase_date_from',
  'purchase_date_to',
  'warranty_expiration_from',
  'warranty_expiration_to',
  'min_value',
  'max_value',
  'text_search',
  'unassigned_only',
])

/** Keys the model must never control — org scope is server-side only. */
const STRIPPED_SCOPE_KEYS = new Set([
  'organization_id',
  'organizationId',
  'org_id',
  'orgId',
  'group_id',
  'groupId',
  'tenant_id',
  'tenantId',
])

const MAX_FILTER_ARRAY = 20
const MAX_STRING_FILTER = 200
const MAX_TEXT_SEARCH = 500

function clampString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed || undefined
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().slice(0, MAX_STRING_FILTER))
    .filter(Boolean)
    .slice(0, MAX_FILTER_ARRAY)
  return items.length ? items : undefined
}

function numberField(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'boolean' || Array.isArray(value)) return undefined
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Strip scope injection and unknown keys from model-supplied tool arguments. */
export function sanitizeAssetFilters(raw: unknown): AssetFilters {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const input = raw as Record<string, unknown>
  const out: AssetFilters = {}

  for (const key of Object.keys(input)) {
    if (STRIPPED_SCOPE_KEYS.has(key)) continue
    if (!ALLOWED_FILTER_KEYS.has(key)) continue

    switch (key) {
      case 'category':
      case 'location':
      case 'status':
      case 'assigned_to':
      case 'lifecycle_stage': {
        const values = stringArray(input[key])
        if (values) out[key] = values
        break
      }
      case 'purchase_date_from':
      case 'purchase_date_to':
      case 'warranty_expiration_from':
      case 'warranty_expiration_to': {
        const date = clampString(input[key], 10)
        if (date) out[key] = date
        break
      }
      case 'min_value':
      case 'max_value': {
        const num = numberField(input[key])
        if (num != null) out[key] = num
        break
      }
      case 'text_search': {
        const text = clampString(input[key], MAX_TEXT_SEARCH)
        if (text) out.text_search = text
        break
      }
      case 'unassigned_only':
        if (input[key] === true) out.unassigned_only = true
        break
      default:
        break
    }
  }

  return out
}

/** Per-tool public parameter allowlists — internal keys like forExport are never passed through. */
const TOOL_PARAM_ALLOWLIST: Record<string, ReadonlySet<string>> = {
  count_assets: new Set(['filters']),
  search_assets: new Set(['filters', 'sort_by', 'direction', 'limit']),
  rank_by: new Set(['group_by', 'dimension', 'direction', 'limit', 'filters']),
  assets_by_recency: new Set(['field', 'direction', 'days', 'limit', 'filters']),
  find_data_gaps: new Set(['field', 'limit']),
  get_schema_info: new Set(['table']),
  get_change_history: new Set(['category', 'source', 'actor', 'entity_label', 'days', 'limit']),
  generate_report: new Set(['format', 'title']),
}

const MAX_TOOL_LIMIT = 200
const MAX_DAYS_WINDOW = 3660

function clampLimit(value: unknown, max: number): number | undefined {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return undefined
  const int = Math.floor(parsed)
  if (int <= 0) return undefined
  return Math.min(max, int)
}

function clampDirection(value: unknown): 'asc' | 'desc' | undefined {
  if (value === 'asc' || value === 'desc') return value
  return undefined
}

/** Sanitize full tool argument object — only allowlisted keys for the tool. */
export function sanitizeToolArguments(toolName: string, raw: Record<string, unknown>): Record<string, unknown> {
  const allowed = TOOL_PARAM_ALLOWLIST[toolName]
  if (!allowed) return {}

  const cleaned: Record<string, unknown> = {}

  for (const key of allowed) {
    if (STRIPPED_SCOPE_KEYS.has(key)) continue
    if (!(key in raw)) continue
    cleaned[key] = raw[key]
  }

  if ('filters' in cleaned) {
    cleaned.filters = sanitizeAssetFilters(cleaned.filters)
  }

  if ('limit' in cleaned) {
    cleaned.limit = clampLimit(cleaned.limit, MAX_TOOL_LIMIT)
  }

  if ('days' in cleaned) {
    cleaned.days = clampLimit(cleaned.days, MAX_DAYS_WINDOW)
  }

  if (typeof cleaned.field === 'string') {
    cleaned.field = cleaned.field.trim().slice(0, 64)
  }

  if (typeof cleaned.table === 'string') {
    cleaned.table = cleaned.table.trim().slice(0, 64)
  }

  if (typeof cleaned.sort_by === 'string') {
    cleaned.sort_by = cleaned.sort_by.trim().slice(0, 64)
  }

  if (typeof cleaned.group_by === 'string') {
    cleaned.group_by = cleaned.group_by.trim().slice(0, 64)
  }

  if ('direction' in cleaned) {
    cleaned.direction = clampDirection(cleaned.direction)
  }

  if (toolName === 'get_change_history') {
    for (const key of ['category', 'source', 'actor', 'entity_label'] as const) {
      if (typeof cleaned[key] === 'string') {
        cleaned[key] = (cleaned[key] as string).trim().slice(0, MAX_STRING_FILTER)
      }
    }
  }

  if (toolName === 'generate_report') {
    if (typeof cleaned.title === 'string') {
      cleaned.title = cleaned.title.trim().slice(0, MAX_STRING_FILTER)
    }
    if (cleaned.format !== 'csv' && cleaned.format !== 'pdf') {
      delete cleaned.format
    }
  }

  return cleaned
}
