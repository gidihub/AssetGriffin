'use client'

import { fieldChoices } from '@/lib/field-ui'
import { normalizeDateValue } from '@/lib/records-parity'
import { lifecycleStageOrder } from '@/lib/workspace-data'
import type { DbField } from '@/lib/schema-types'

function parseLifecycleDates(data: Record<string, unknown>): Record<string, string> {
  const raw = data.lifecycle_dates
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, string>) }
  }
  return {}
}

function parseItDetails(data: Record<string, unknown>): Record<string, unknown> {
  const raw = data.it_details
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) }
  }
  return {}
}

function setField(data: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  return { ...data, [key]: value }
}

export function LifecycleDatesEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const dates = parseLifecycleDates(data)

  return (
    <div className="lifecycle-dates-editor">
      {lifecycleStageOrder.map((stage) => (
        <label key={stage} className="editable-field-item">
          <span>{stage} date</span>
          <input
            type="date"
            value={normalizeDateValue(dates[stage]) ?? ''}
            onChange={(event) => {
              const next = { ...dates }
              if (event.target.value) next[stage] = event.target.value
              else delete next[stage]
              onChange(setField(data, 'lifecycle_dates', next))
            }}
          />
        </label>
      ))}
    </div>
  )
}

export function ItDetailsEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const it = parseItDetails(data)
  const licenses = Array.isArray(it.licenses) ? it.licenses.filter((entry): entry is string => typeof entry === 'string') : []

  function patchItDetails(patch: Record<string, unknown>) {
    onChange(setField(data, 'it_details', { ...it, ...patch }))
  }

  return (
    <div className="it-details-editor">
      <label className="editable-field-item">
        <span>Operating system</span>
        <input
          type="text"
          value={String(it.os ?? '')}
          onChange={(event) => patchItDetails({ os: event.target.value })}
        />
      </label>
      <label className="editable-field-item">
        <span>MDM status</span>
        <select
          value={String(it.mdmStatus ?? '')}
          onChange={(event) => patchItDetails({ mdmStatus: event.target.value })}
        >
          <option value="">Select…</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Not enrolled">Not enrolled</option>
        </select>
      </label>
      <label className="editable-field-item">
        <span>Licenses</span>
        <input
          type="text"
          value={licenses.join(', ')}
          onChange={(event) =>
            patchItDetails({
              licenses: event.target.value
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean),
            })
          }
          placeholder="Comma-separated"
        />
      </label>
      <label className="editable-field-item">
        <span>Warranty plan</span>
        <input
          type="text"
          value={String(it.warrantyPlan ?? '')}
          onChange={(event) => patchItDetails({ warrantyPlan: event.target.value })}
        />
      </label>
      <label className="editable-field-item">
        <span>Warranty plan expiration</span>
        <input
          type="date"
          value={normalizeDateValue(it.warrantyPlanExpiration) ?? ''}
          onChange={(event) => patchItDetails({ warrantyPlanExpiration: event.target.value || null })}
        />
      </label>
    </div>
  )
}

export function RecordFieldInput({
  field,
  data,
  onChange,
}: {
  field: DbField
  data: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}) {
  const value = data[field.key]

  if (field.type === 'json') {
    if (field.key === 'lifecycle_dates') {
      return <LifecycleDatesEditor data={data} onChange={onChange} />
    }
    if (field.key === 'it_details') {
      return <ItDetailsEditor data={data} onChange={onChange} />
    }
    return null
  }

  if (field.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(event) => onChange(setField(data, field.key, event.target.checked))}
      />
    )
  }

  if (field.type === 'select' || field.type === 'status') {
    return (
      <select
        value={String(value ?? '')}
        onChange={(event) => onChange(setField(data, field.key, event.target.value))}
      >
        <option value="">Select…</option>
        {fieldChoices(field).map((choice) => (
          <option key={choice} value={choice}>
            {choice}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value === null || value === undefined ? '' : String(value)}
        onChange={(event) =>
          onChange(setField(data, field.key, event.target.value === '' ? null : Number(event.target.value)))
        }
      />
    )
  }

  if (field.type === 'date') {
    return (
      <input
        type="date"
        value={normalizeDateValue(value) ?? ''}
        onChange={(event) => onChange(setField(data, field.key, event.target.value || null))}
      />
    )
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      onChange={(event) => onChange(setField(data, field.key, event.target.value))}
    />
  )
}
