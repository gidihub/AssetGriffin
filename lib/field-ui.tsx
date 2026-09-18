import type { DbField } from '@/lib/supabase/database.types'
import { StatusBadge } from '@/components/workspace/primitives'

const TABLE_TYPES = new Set(['text', 'number', 'date', 'select', 'status', 'checkbox'])
const FILTER_TYPES = new Set(['select', 'status'])

export function isTableField(field: DbField): boolean {
  return TABLE_TYPES.has(field.type)
}

export function isFilterField(field: DbField): boolean {
  return FILTER_TYPES.has(field.type)
}

export function fieldChoices(field: DbField): string[] {
  const choices = field.options?.choices
  return Array.isArray(choices) ? choices.filter((c): c is string => typeof c === 'string') : []
}

export function hasFieldValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/** Value alone, or em dash when empty — never prefixes a field label. */
export function formatOptionalValue(value: unknown): string {
  return hasFieldValue(value) ? String(value).trim() : '—'
}

export function formatFieldValue(field: DbField, value: unknown): string {
  if (!hasFieldValue(value)) return '—'
  if (field.type === 'checkbox') return value ? 'Yes' : 'No'
  if (field.type === 'date' && typeof value === 'string') {
    const parsed = new Date(`${value}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
  if (field.type === 'number' && typeof value === 'number') return value.toLocaleString()
  if (field.type === 'json') return 'Structured data'
  return String(value)
}

export function renderFieldValue(field: DbField, value: unknown): React.ReactNode {
  if (field.type === 'status' && typeof value === 'string' && value) {
    return <StatusBadge status={value} />
  }
  if (field.type === 'checkbox') {
    return value ? 'Yes' : 'No'
  }
  return formatFieldValue(field, value)
}

export function recordDisplayLabel(
  fields: DbField[],
  data: Record<string, unknown>,
  fallbackId: string,
): string {
  for (const key of ['name', 'asset_tag', 'title']) {
    const value = data[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  for (const field of fields) {
    const value = data[field.key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallbackId.slice(0, 8)
}

export type AssetDetailMetaPart = { kind: 'tag' | 'serial' | 'category'; text: string }

/** Inline metadata for asset headers (tag · serial · category). Omits serial when empty. */
export function assetDetailMetaParts(data: Record<string, unknown>, recordId: string): AssetDetailMetaPart[] {
  const parts: AssetDetailMetaPart[] = []
  const tag = String(data.asset_tag ?? '').trim()
  parts.push({ kind: 'tag', text: tag || recordId })

  const serial = String(data.serial ?? '').trim()
  if (serial) parts.push({ kind: 'serial', text: serial })

  const category = String(data.category ?? '').trim()
  parts.push({ kind: 'category', text: category || '—' })

  return parts
}

export function recordDisplaySubtitle(fields: DbField[], data: Record<string, unknown>, id: string): string {
  const tag = data.asset_tag
  const category = data.category ?? data.type ?? data.team
  const parts: string[] = []
  if (typeof tag === 'string' && tag) parts.push(tag)
  else parts.push(id.slice(0, 8))
  if (typeof category === 'string' && category) parts.push(String(category))
  return parts.join(' · ')
}

export function getPrimaryStatusField(fields: DbField[]): DbField | undefined {
  return fields.find((f) => f.key === 'status' && f.type === 'status')
}

export function getSearchableText(data: Record<string, unknown>, fields: DbField[]): string {
  return fields
    .filter((f) => f.type !== 'json')
    .map((f) => formatFieldValue(f, data[f.key]))
    .join(' ')
    .toLowerCase()
}
