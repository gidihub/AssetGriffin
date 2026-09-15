import {
  dbRecordToAssetRecord,
  importRecordToAssetData,
  intakeDraftToRecordData,
} from '@/lib/record-mappers'
import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import { slugifyGroupName } from '@/lib/group-icons'
import type { AssetStatus, DbAsset, LifecycleStage } from '@/lib/supabase/database.types'
import type { DbField, DbGroup, DbRecord } from '@/lib/supabase/database.types'
import { requireUserProfile } from '@/lib/supabase/session'

export async function listGroupsForCurrentOrg() {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as DbGroup[]
}

export async function getGroupBySlug(slug: string) {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase.from('groups').select('*').eq('slug', slug).maybeSingle()

  if (error) throw new Error(error.message)
  return (data as DbGroup | null) ?? null
}

export async function listFieldsForGroup(groupId: string) {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as DbField[]
}

export async function listRecordsForGroup(groupId: string) {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('group_id', groupId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as DbRecord[]
}

export async function getAssetsGroupForCurrentOrg() {
  return getGroupBySlug('assets')
}

async function requireAssetsGroup() {
  const group = await getAssetsGroupForCurrentOrg()
  if (!group) throw new Error('Assets group is not configured for this organization.')
  return group
}

export async function listAssetRecordsForCurrentOrg() {
  const group = await requireAssetsGroup()
  return listRecordsForGroup(group.id)
}

export async function updateRecordForGroup(
  groupId: string,
  recordId: string,
  data: Record<string, unknown>,
) {
  const { supabase, profile } = await requireUserProfile()

  const { data: existing, error: fetchError } = await supabase
    .from('records')
    .select('data')
    .eq('id', recordId)
    .eq('group_id', groupId)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!existing) throw new Error('Record not found.')

  const mergedData = {
    ...((existing.data ?? {}) as Record<string, unknown>),
    ...data,
  }

  const { data: row, error } = await supabase
    .from('records')
    .update({ data: mergedData })
    .eq('id', recordId)
    .eq('group_id', groupId)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single()
  if (error) {
    if (error.code === 'PGRST116') throw new Error('Record not found.')
    throw new Error(error.message)
  }
  return row as DbRecord
}

export async function deleteRecordForGroup(groupId: string, recordId: string) {
  const { supabase, profile } = await requireUserProfile()
  const { data, error } = await supabase
    .from('records')
    .delete()
    .eq('id', recordId)
    .eq('group_id', groupId)
    .eq('organization_id', profile.organization_id)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Record not found.')
}

export async function createRecordForGroup(groupId: string, data: Record<string, unknown>, organizationId: string, userId?: string) {
  const { supabase } = await requireUserProfile()
  const { data: row, error } = await supabase
    .from('records')
    .insert({
      group_id: groupId,
      organization_id: organizationId,
      data,
      created_by: userId ?? null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return row as DbRecord
}

export async function createAssetRecordForCurrentOrg(draft: AssetIntakeDraft) {
  const { profile } = await requireUserProfile()
  const group = await requireAssetsGroup()
  const data = intakeDraftToRecordData(draft)
  return createRecordForGroup(group.id, data, profile.organization_id, profile.id)
}

export async function importAssetRecordsForCurrentOrg(records: ImportAssetRecord[]) {
  const { supabase, profile } = await requireUserProfile()
  const group = await requireAssetsGroup()

  const payload = records.map((record) => ({
    group_id: group.id,
    organization_id: profile.organization_id,
    data: importRecordToAssetData(record),
    created_by: profile.id,
  }))

  const { data, error } = await supabase.from('records').insert(payload).select('*')
  if (error) throw new Error(error.message)
  return (data ?? []) as DbRecord[]
}

/** Backward-compatible asset shape for routes that still return DbAsset-like payloads. */
export function recordToLegacyAssetShape(record: DbRecord) {
  const data = record.data ?? {}
  return {
    id: record.id,
    organization_id: record.organization_id,
    asset_tag: String(data.asset_tag ?? ''),
    name: String(data.name ?? ''),
    category: String(data.category ?? ''),
    assigned_to: String(data.assigned_to ?? ''),
    location: String(data.location ?? ''),
    status: String(data.status ?? 'Available') as AssetStatus,
    purchase_date: (data.purchase_date as string | null) ?? null,
    serial: String(data.serial ?? ''),
    warranty_expiration: (data.warranty_expiration as string | null) ?? null,
    depreciation_value: String(data.depreciation_value ?? '$0'),
    purchase_value: typeof data.purchase_value === 'number' ? data.purchase_value : null,
    notes: String(data.notes ?? ''),
    lifecycle_stage: String(data.lifecycle_stage ?? 'Procurement') as LifecycleStage,
    lifecycle_dates: (data.lifecycle_dates as Record<string, string>) ?? {},
    it_details: (data.it_details as Record<string, unknown> | null) ?? null,
    created_at: record.created_at,
    updated_at: record.updated_at,
  } satisfies DbAsset
}

export async function listLegacyAssetsForCurrentOrg() {
  const records = await listAssetRecordsForCurrentOrg()
  return records.map(recordToLegacyAssetShape)
}

export async function createLegacyAssetForCurrentOrg(draft: AssetIntakeDraft) {
  const record = await createAssetRecordForCurrentOrg(draft)
  return recordToLegacyAssetShape(record)
}

export async function importLegacyAssetsForCurrentOrg(records: ImportAssetRecord[]) {
  const inserted = await importAssetRecordsForCurrentOrg(records)
  return inserted.map(recordToLegacyAssetShape)
}

export async function listGroupsWithCounts() {
  const { supabase, profile } = await requireUserProfile()

  const [groupsResult, recordsResult] = await Promise.all([
    supabase.from('groups').select('*').order('sort_order', { ascending: true }),
    supabase.from('records').select('group_id').eq('organization_id', profile.organization_id),
  ])

  if (groupsResult.error) throw new Error(groupsResult.error.message)
  if (recordsResult.error) throw new Error(recordsResult.error.message)

  const counts = new Map<string, number>()
  for (const row of recordsResult.data ?? []) {
    counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1)
  }

  return ((groupsResult.data ?? []) as DbGroup[]).map((group) => ({
    ...group,
    recordCount: counts.get(group.id) ?? 0,
  }))
}

export async function getGroupWithFieldsAndRecords(slug: string) {
  const { supabase } = await requireUserProfile()

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (groupError) throw new Error(groupError.message)
  if (!group) return null

  const [fieldsResult, recordsResult] = await Promise.all([
    supabase
      .from('fields')
      .select('*')
      .eq('group_id', group.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('records')
      .select('*')
      .eq('group_id', group.id)
      .order('updated_at', { ascending: false }),
  ])

  if (fieldsResult.error) throw new Error(fieldsResult.error.message)
  if (recordsResult.error) throw new Error(recordsResult.error.message)

  return {
    group: group as DbGroup,
    fields: (fieldsResult.data ?? []) as DbField[],
    records: (recordsResult.data ?? []) as DbRecord[],
  }
}

export type CreateGroupInput = {
  name: string
  icon?: string
  slug?: string
}

export async function createGroupForCurrentOrg(input: CreateGroupInput) {
  const { supabase, profile } = await requireUserProfile()
  const slug = input.slug?.trim() || slugifyGroupName(input.name)
  if (!slug) throw new Error('Group name must contain at least one letter or number.')

  const { data: existingGroups } = await supabase
    .from('groups')
    .select('sort_order')
    .eq('organization_id', profile.organization_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existingGroups?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('groups')
    .insert({
      organization_id: profile.organization_id,
      name: input.name.trim(),
      icon: input.icon ?? 'boxes',
      slug,
      sort_order: nextOrder,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  const group = data as DbGroup
  const { error: seedError } = await supabase.rpc('seed_new_group_fields', {
    p_group_id: group.id,
    p_slug: group.slug,
  })
  if (seedError) throw new Error(seedError.message)

  return group
}

export async function deleteGroupBySlug(slug: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id')
    .eq('slug', slug)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()
  if (groupError) throw new Error(groupError.message)
  if (!group) throw new Error('Group not found.')

  const { count, error: countError } = await supabase
    .from('records')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', group.id)
  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) throw new Error('Delete all records in this group before removing it.')

  const { error } = await supabase.from('groups').delete().eq('id', group.id)
  if (error) throw new Error(error.message)
}

export type UpsertFieldInput = {
  id?: string
  key: string
  label: string
  type: DbField['type']
  options?: Record<string, unknown>
  sort_order: number
  required?: boolean
}

export async function replaceFieldsForGroup(groupId: string, fields: UpsertFieldInput[]) {
  const { supabase } = await requireUserProfile()

  const { data: existing, error: existingError } = await supabase
    .from('fields')
    .select('id, key')
    .eq('group_id', groupId)
  if (existingError) throw new Error(existingError.message)

  const incomingKeys = new Set(fields.map((f) => f.key))
  const toDelete = (existing ?? []).filter((f) => !incomingKeys.has(f.key)).map((f) => f.id)

  if (toDelete.length) {
    const { error: deleteError } = await supabase.from('fields').delete().in('id', toDelete)
    if (deleteError) throw new Error(deleteError.message)
  }

  for (const field of fields) {
    const payload = {
      group_id: groupId,
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options ?? {},
      sort_order: field.sort_order,
      required: field.required ?? false,
    }

    if (field.id) {
      const { data: updated, error } = await supabase
        .from('fields')
        .update(payload)
        .eq('id', field.id)
        .eq('group_id', groupId)
        .select('id')
      if (error) throw new Error(error.message)
      if (!updated?.length) {
        throw new Error(`Field "${field.key}" was not found in this group.`)
      }
    } else {
      const { error } = await supabase.from('fields').insert(payload)
      if (error) throw new Error(error.message)
    }
  }

  return listFieldsForGroup(groupId)
}

export { dbRecordToAssetRecord }
