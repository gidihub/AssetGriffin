'use client'

import { useEffect, useState } from 'react'
import { Check, XCircle } from 'lucide-react'
import { DrawerSection, HistoryList } from './primitives'
import type { ActionEventRow } from '@/lib/actions-db'
import type { DbActionType, DbField } from '@/lib/schema-types'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

type Announce = (message: string) => void

type ChecklistItem = { id: string; label: string; required?: boolean }

function fieldLabel(fields: DbField[], key: string | null): string {
  if (!key) return 'Value'
  return fields.find((field) => field.key === key)?.label ?? key.replace(/_/g, ' ')
}

function ActionRunModal({
  actionType,
  fields,
  onClose,
  onSubmit,
  submitting,
}: {
  actionType: DbActionType
  fields: DbField[]
  onClose: () => void
  onSubmit: (values: Record<string, unknown>, notes?: string) => void
  submitting: boolean
}) {
  const config = actionType.config ?? {}
  const checklistItems = (config.checklist_items ?? []) as ChecklistItem[]
  const [value, setValue] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  const isChecklist = checklistItems.length > 0
  const isDateDriven = actionType.kind === 'date_driven' && config.due_date_field
  const isFixedValue = Boolean(config.value)
  const promptField = isFixedValue ? null : actionType.open_field

  function handleSubmit() {
    if (isChecklist) {
      onSubmit(checklist, notes)
      return
    }
    if (isDateDriven) {
      onSubmit({ [String(config.due_date_field)]: dueDate }, notes)
      return
    }
    if (isFixedValue) {
      onSubmit({}, notes)
      return
    }
    if (promptField) {
      onSubmit({ [promptField]: value }, notes)
      return
    }
    onSubmit({}, notes)
  }

  const checklistComplete = checklistItems.every(
    (item) => !item.required || checklist[item.id] !== undefined,
  )

  const canSubmit =
    !submitting &&
    (isChecklist
      ? checklistComplete
      : isFixedValue ||
        (isDateDriven && dueDate.trim()) ||
        (promptField && value.trim()) ||
        (!promptField && !isDateDriven))

  return (
    <div className="action-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="action-modal" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
        <h3 id="action-modal-title">{actionType.name}</h3>
        <p className="action-modal-sub">
          {isChecklist
            ? 'Mark each checklist item pass or fail.'
            : isDateDriven
              ? `Set ${fieldLabel(fields, String(config.due_date_field))} for this record.`
              : isFixedValue
                ? `This will update the record (${String(config.value)}).`
                : String(config.prompt ?? `Enter ${fieldLabel(fields, promptField)}`)}
        </p>

        {isChecklist ? (
          <ul className="action-checklist">
            {checklistItems.map((item) => (
              <li key={item.id}>
                <span>{item.label}{item.required ? ' *' : ''}</span>
                <div className="action-checklist-toggles">
                  <button
                    type="button"
                    className={`action-pass-toggle ${checklist[item.id] ? 'on' : ''}`}
                    onClick={() => setChecklist((current) => ({ ...current, [item.id]: true }))}
                    aria-pressed={checklist[item.id] === true}
                  >
                    <Check size={13} /> Pass
                  </button>
                  <button
                    type="button"
                    className={`action-fail-toggle ${checklist[item.id] === false ? 'on' : ''}`}
                    onClick={() => setChecklist((current) => ({ ...current, [item.id]: false }))}
                    aria-pressed={checklist[item.id] === false}
                  >
                    <XCircle size={13} /> Fail
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : isDateDriven ? (
          <label className="action-field">
            <span>{fieldLabel(fields, String(config.due_date_field))}</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        ) : !isFixedValue && promptField ? (
          <label className="action-field">
            <span>{fieldLabel(fields, promptField)}</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={String(config.prompt ?? '')}
              autoFocus
            />
          </label>
        ) : null}

        <label className="action-field">
          <span>Notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        <div className="action-modal-actions">
          <button type="button" className="button secondary small" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="button primary small" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? 'Saving…' : `Confirm ${actionType.name}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function eventActorLabel(performedBy: string | null, currentUserId: string | null): string {
  if (performedBy && currentUserId && performedBy === currentUserId) return 'You'
  return 'Workspace member'
}

function formatEventWhen(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RecordActionsPanel({
  slug,
  record,
  fields,
  actionTypes,
  onPerformed,
  onAnnounce,
}: {
  slug: string
  record: WorkspaceRecordRow
  fields: DbField[]
  actionTypes: DbActionType[]
  onPerformed: (updated: WorkspaceRecordRow) => void
  onAnnounce: Announce
}) {
  const [activeAction, setActiveAction] = useState<DbActionType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [events, setEvents] = useState<ActionEventRow[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch('/api/workspace')
        if (!response.ok) return
        const payload = (await response.json()) as { profile?: { id?: string } }
        if (!cancelled) setCurrentUserId(payload.profile?.id ?? null)
      } catch {
        if (!cancelled) setCurrentUserId(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingEvents(true)
    void (async () => {
      try {
        const response = await fetch(`/api/groups/${slug}/records/${record.id}/actions`)
        const payload = (await response.json()) as { events?: ActionEventRow[]; error?: string }
        if (cancelled) return
        if (!response.ok) throw new Error(payload.error ?? 'Could not load action history.')
        setEvents(payload.events ?? [])
      } catch {
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug, record.id])

  async function runAction(values: Record<string, unknown>, notes?: string) {
    if (!activeAction) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/groups/${slug}/records/${record.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionTypeId: activeAction.id,
          values,
          notes,
        }),
      })
      const payload = (await response.json()) as {
        record?: WorkspaceRecordRow
        actionName?: string
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? 'Could not perform action.')
      if (payload.record) onPerformed(payload.record)
      onAnnounce(`${payload.actionName ?? activeAction.name} recorded.`)
      setActiveAction(null)

      const historyRes = await fetch(`/api/groups/${slug}/records/${record.id}/actions`)
      const historyPayload = (await historyRes.json()) as { events?: ActionEventRow[] }
      if (historyRes.ok) setEvents(historyPayload.events ?? [])
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not perform action.')
    } finally {
      setSubmitting(false)
    }
  }

  const historyItems = [
    ...events.map((event) => ({
      who: eventActorLabel(event.performedBy, currentUserId),
      what: event.actionName,
      when: formatEventWhen(event.performedAt),
    })),
    {
      who: 'Workspace',
      what: 'Record created',
      when: new Date(record.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
  ]

  return (
    <>
      {actionTypes.length > 0 ? (
        <DrawerSection title="Actions">
          <div className="record-action-buttons">
            {actionTypes.map((actionType) => (
              <button
                key={actionType.id}
                type="button"
                className="button secondary small"
                onClick={() => setActiveAction(actionType)}
              >
                {actionType.name}
              </button>
            ))}
          </div>
        </DrawerSection>
      ) : null}

      <DrawerSection title="Activity history">
        {loadingEvents ? (
          <p className="drawer-text">Loading history…</p>
        ) : (
          <HistoryList items={historyItems} />
        )}
      </DrawerSection>

      {activeAction ? (
        <ActionRunModal
          actionType={activeAction}
          fields={fields}
          onClose={() => !submitting && setActiveAction(null)}
          onSubmit={(values, notes) => void runAction(values, notes)}
          submitting={submitting}
        />
      ) : null}
    </>
  )
}
