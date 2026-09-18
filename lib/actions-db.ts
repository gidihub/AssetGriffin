import { sanitizeRecordData } from '@/lib/field-value-validation'
import { recordAuditEvent } from '@/lib/griffineye-audit'
import { getGroupBySlug, listFieldsForGroup } from '@/lib/groups-db'
import type { DbActionEvent, DbActionType, DbRecord } from '@/lib/schema-types'
import { requireUserProfile } from '@/lib/supabase/session'

export type ChecklistItemConfig = {
  id: string
  label: string
  required?: boolean
}

export type ActionTypeConfig = {
  prompt?: string
  value?: string
  due_date_field?: string
  status_on_open?: string
  status_on_complete?: string
  checklist_items?: ChecklistItemConfig[]
  pass_status?: string
  fail_status?: string
}

export type PerformActionInput = {
  slug: string
  recordId: string
  actionTypeId: string
  values?: Record<string, unknown>
  notes?: string
}

export type ActionEventRow = {
  id: string
  actionTypeId: string
  actionName: string
  performedAt: string
  performedBy: string | null
  data: Record<string, unknown>
}

function asConfig(raw: Record<string, unknown>): ActionTypeConfig {
  return raw as ActionTypeConfig
}

export async function listActionTypesForGroup(groupId: string): Promise<DbActionType[]> {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase
    .from('action_types')
    .select('*')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as DbActionType[]
}

export async function listActionEventsForRecord(recordId: string, limit = 20): Promise<ActionEventRow[]> {
  const { supabase } = await requireUserProfile()
  const { data, error } = await supabase
    .from('action_events')
    .select('id, action_type_id, performed_at, performed_by, data, action_types(name)')
    .eq('record_id', recordId)
    .order('performed_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const rows = data ?? []
  const performerIds = [
    ...new Set(
      rows
        .map((row) => (row as { performed_by: string | null }).performed_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const performerLabels = new Map<string, string>()
  if (performerIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', performerIds)
    if (profilesError) throw new Error(profilesError.message)
    for (const profile of profiles ?? []) {
      const label = profile.full_name?.trim() || profile.email?.trim() || null
      if (label) performerLabels.set(profile.id, label)
    }
  }

  return rows.map((row) => {
    const joined = row as unknown as {
      id: string
      action_type_id: string
      performed_at: string
      performed_by: string | null
      data: Record<string, unknown> | null
      action_types: { name: string } | null
    }
    return {
      id: joined.id,
      actionTypeId: joined.action_type_id,
      actionName: joined.action_types?.name ?? 'Action',
      performedAt: joined.performed_at,
      performedBy: joined.performed_by ? performerLabels.get(joined.performed_by) ?? null : null,
      data: joined.data ?? {},
    }
  })
}

function checklistResultsFromValues(
  items: ChecklistItemConfig[],
  values: Record<string, unknown>,
): Array<{ item: string; pass: boolean }> {
  return items.map((item) => ({
    item: item.label,
    pass: Boolean(values[item.id]),
  }))
}

function applyActionToRecordData(
  actionType: DbActionType,
  current: Record<string, unknown>,
  values: Record<string, unknown>,
  groupFieldKeys: ReadonlySet<string>,
): Record<string, unknown> {
  const config = asConfig(actionType.config ?? {})
  const next = { ...current }

  if (
    !config.value &&
    actionType.open_field &&
    values[actionType.open_field] !== undefined
  ) {
    next[actionType.open_field] = values[actionType.open_field]
  }

  if (config.checklist_items?.length) {
    const results = checklistResultsFromValues(config.checklist_items, values)
    next[actionType.open_field ?? 'results'] = results
    const requiredFailed = config.checklist_items.some(
      (item) => item.required && !values[item.id],
    )
    if (!requiredFailed && config.pass_status) {
      const today = new Date().toISOString().slice(0, 10)
      if ('last_completed' in next) {
        next.last_completed = today
      }
      if (actionType.change_field) {
        next[actionType.change_field] = config.pass_status
      }
    } else if (requiredFailed && config.fail_status && actionType.change_field) {
      next[actionType.change_field] = config.fail_status
    }
  } else if (config.due_date_field && values[config.due_date_field]) {
    next[config.due_date_field] = values[config.due_date_field]
    if (actionType.change_field && config.status_on_open) {
      next[actionType.change_field] = config.status_on_open
    }
  } else if (actionType.change_field) {
    if (config.value) next[actionType.change_field] = config.value
    else if (values[actionType.change_field] !== undefined) {
      next[actionType.change_field] = values[actionType.change_field]
    } else if (config.status_on_complete) {
      next[actionType.change_field] = config.status_on_complete
    }
  }

  return next
}

export async function performRecordAction(input: PerformActionInput) {
  const { supabase, profile } = await requireUserProfile()
  const group = await getGroupBySlug(input.slug)
  if (!group) throw new Error('Group not found.')

  const { data: actionType, error: typeError } = await supabase
    .from('action_types')
    .select('*')
    .eq('id', input.actionTypeId)
    .eq('group_id', group.id)
    .maybeSingle()

  if (typeError) throw new Error(typeError.message)
  if (!actionType) throw new Error('Action type not found.')

  const { data: record, error: recordError } = await supabase
    .from('records')
    .select('*')
    .eq('id', input.recordId)
    .eq('group_id', group.id)
    .eq('organization_id', profile.organization_id)
    .maybeSingle()

  if (recordError) throw new Error(recordError.message)
  if (!record) throw new Error('Record not found.')

  const fields = await listFieldsForGroup(group.id)
  const groupFieldKeys = new Set(fields.map((field) => field.key))
  const values = input.values ?? {}
  const previousData = (record.data ?? {}) as Record<string, unknown>
  const nextData = sanitizeRecordData(
    applyActionToRecordData(
      actionType as DbActionType,
      previousData,
      values,
      groupFieldKeys,
    ),
    fields,
  ).data

  const eventPayload = {
    values,
    notes: input.notes?.trim() || null,
    previous: previousData,
    next: nextData,
  }

  const { data: atomicResult, error: atomicError } = await supabase.rpc('perform_record_action_atomic', {
    p_group_id: group.id,
    p_record_id: input.recordId,
    p_action_type_id: input.actionTypeId,
    p_next_data: nextData,
    p_event_data: eventPayload,
  })

  if (atomicError) throw new Error(atomicError.message)

  const payload = (atomicResult ?? {}) as {
    record?: Record<string, unknown>
    event?: { id: string; performed_at: string }
  }
  const updated = payload.record as DbRecord | undefined
  const event = payload.event
  if (!updated || !event) throw new Error('Action could not be saved.')

  const actorLabel = profile.full_name?.trim() || profile.email || 'Workspace member'
  const recordLabel = String(nextData.name ?? nextData.asset_tag ?? input.recordId)

  await recordAuditEvent(supabase, profile.organization_id, {
    category: 'record',
    action: `action:${(actionType as DbActionType).name}`,
    source: 'manual',
    actorId: profile.id,
    actorLabel,
    entityType: 'record',
    entityId: input.recordId,
    entityLabel: recordLabel,
    summary: `${(actionType as DbActionType).name} on ${recordLabel}`,
    metadata: { action_type_id: input.actionTypeId, action_event_id: event.id },
  })

  return {
    record: updated,
    event: {
      id: event.id,
      organization_id: profile.organization_id,
      record_id: input.recordId,
      action_type_id: input.actionTypeId,
      performed_by: profile.id,
      performed_at: event.performed_at,
      data: eventPayload,
    } satisfies DbActionEvent,
    actionName: (actionType as DbActionType).name,
  }
}
