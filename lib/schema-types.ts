/**
 * Groups → Fields → Records schema types (Phase 1).
 *
 * Deferred future scope (not v1):
 * - bidirectional/backlink fields
 * - field-level formulas / rollups
 * - cross-group polymorphic relations
 * - real-time sync views over legacy assets
 */

export const FIELD_TYPES = [
  'text',
  'number',
  'date',
  'select',
  'status',
  'checkbox',
  'relation',
  'json',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

/** json is reserved for structured sub-objects only — not a general query/filter fallback. */
export const JSON_FIELD_KEYS = ['lifecycle_dates', 'it_details'] as const

export type RelationFieldOptions = {
  target_group_id: string
  cardinality: 'one' | 'many'
  display_field_key: string
}

export type SelectFieldOptions = {
  choices: string[]
}

export type DbGroup = {
  id: string
  organization_id: string
  name: string
  icon: string
  slug: string
  sort_order: number
  created_at: string
}

export type DbField = {
  id: string
  group_id: string
  key: string
  label: string
  type: FieldType
  options: Record<string, unknown>
  sort_order: number
  required: boolean
  created_at: string
}

export type DbRecord = {
  id: string
  group_id: string
  organization_id: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
}

/** Asset group data keys migrated from public.assets (Phase 1). */
export const ASSET_RECORD_KEYS = [
  'asset_tag',
  'name',
  'category',
  'assigned_to',
  'location',
  'status',
  'purchase_date',
  'serial',
  'warranty_expiration',
  'depreciation_value',
  'purchase_value',
  'notes',
  'lifecycle_stage',
  'lifecycle_dates',
  'it_details',
] as const

export type DbActionType = {
  id: string
  organization_id: string
  group_id: string
  name: string
  kind: 'standard' | 'date_driven'
  open_field: string | null
  change_field: string | null
  config: Record<string, unknown>
  sort_order: number
  created_at: string
}

export type DbActionEvent = {
  id: string
  organization_id: string
  record_id: string
  action_type_id: string
  performed_by: string | null
  performed_at: string
  data: Record<string, unknown>
}

export type AssetRecordData = {
  asset_tag: string
  name: string
  category: string
  assigned_to: string
  location: string
  status: string
  purchase_date: string | null
  serial: string
  warranty_expiration: string | null
  depreciation_value: string
  purchase_value: number | null
  notes: string
  lifecycle_stage: string
  lifecycle_dates: Record<string, string>
  it_details: Record<string, unknown> | null
}
