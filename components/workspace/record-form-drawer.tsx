'use client'

import { useEffect, useState } from 'react'
import { DetailDrawer, DrawerSection } from './primitives'
import { RecordFieldInput } from './record-field-input'
import type { DbField } from '@/lib/supabase/database.types'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

type Announce = (message: string) => void

function emptyDataFromFields(fields: DbField[]): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.type === 'checkbox') data[field.key] = false
    else if (field.type === 'number') data[field.key] = null
    else if (field.type === 'json' && field.key === 'lifecycle_dates') data[field.key] = {}
    else if (field.type === 'json' && field.key === 'it_details') data[field.key] = null
    else if (field.type === 'json') data[field.key] = null
    else data[field.key] = ''
  }
  return data
}

export function RecordFormDrawer({
  slug,
  fields,
  record,
  initialData,
  onClose,
  onSaved,
  onAnnounce,
}: {
  slug: string
  fields: DbField[]
  record?: WorkspaceRecordRow | null
  initialData?: Record<string, unknown>
  onClose: () => void
  onSaved: (row: WorkspaceRecordRow) => void
  onAnnounce: Announce
}) {
  const [data, setData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(record?.id)

  useEffect(() => {
    if (isEdit && record) setData({ ...record.data })
    else setData({ ...emptyDataFromFields(fields), ...initialData })
  }, [record, fields, initialData, isEdit])

  async function save() {
    setSaving(true)
    try {
      const url = isEdit && record
        ? `/api/groups/${slug}/records/${record.id}`
        : `/api/groups/${slug}/records`
      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const payload = (await response.json()) as { record?: WorkspaceRecordRow; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not save record.')
      if (payload.record) onSaved(payload.record)
      onAnnounce(isEdit ? 'Record updated.' : 'Record created.')
      onClose()
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailDrawer
      title={isEdit ? 'Edit record' : 'Add record'}
      subtitle="Changes are saved to your workspace."
      onClose={onClose}
      actions={
        <>
          <button className="button secondary small" onClick={onClose}>Cancel</button>
          <button className="button primary small" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save record'}
          </button>
        </>
      }
    >
      <DrawerSection title="Fields">
        <div className="form-grid">
          {fields.map((field) =>
            field.type === 'json' ? (
              <div key={field.id} className="form-grid-span-all">
                <span className="form-section-label">{field.label}</span>
                <RecordFieldInput field={field} data={data} onChange={setData} />
              </div>
            ) : (
              <label key={field.id}>
                {field.label}
                <RecordFieldInput field={field} data={data} onChange={setData} />
              </label>
            ),
          )}
        </div>
      </DrawerSection>
    </DetailDrawer>
  )
}
