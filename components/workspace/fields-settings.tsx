'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FIELD_TYPES, type FieldType } from '@/lib/schema-types'
import type { DbField, DbGroup } from '@/lib/supabase/database.types'
import { EmptyState } from './primitives'

type Announce = (message: string) => void

type EditableField = {
  id?: string
  key: string
  label: string
  type: FieldType
  sort_order: number
  required: boolean
  optionsText: string
}

function fieldToEditable(field: DbField): EditableField {
  return {
    id: field.id,
    key: field.key,
    label: field.label,
    type: field.type,
    sort_order: field.sort_order,
    required: field.required,
    optionsText: JSON.stringify(field.options ?? {}),
  }
}

function slugifyKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

export function FieldsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [groups, setGroups] = useState<DbGroup[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [fields, setFields] = useState<EditableField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch('/api/groups')
        const data = (await response.json()) as { groups?: DbGroup[]; error?: string }
        if (!response.ok) throw new Error(data.error ?? 'Could not load groups.')
        const list = data.groups ?? []
        setGroups(list)
        if (list.length) setSelectedSlug((current) => current || list[0].slug)
      } catch (error) {
        onAnnounce(error instanceof Error ? error.message : 'Could not load groups.')
      } finally {
        setLoading(false)
      }
    }
    void loadGroups()
  }, [onAnnounce])

  useEffect(() => {
    if (!selectedSlug) return
    let cancelled = false

    async function loadFields() {
      try {
        const response = await fetch(`/api/groups/${selectedSlug}/fields`)
        const data = (await response.json()) as { fields?: DbField[]; error?: string }
        if (!response.ok) throw new Error(data.error ?? 'Could not load fields.')
        if (cancelled) return
        setFields((data.fields ?? []).map(fieldToEditable))
      } catch (error) {
        if (!cancelled) onAnnounce(error instanceof Error ? error.message : 'Could not load fields.')
      }
    }

    void loadFields()
    return () => {
      cancelled = true
    }
  }, [selectedSlug, onAnnounce])

  function updateField(index: number, patch: Partial<EditableField>) {
    setFields((current) => current.map((field, i) => (i === index ? { ...field, ...patch } : field)))
  }

  function addField() {
    setFields((current) => [
      ...current,
      {
        key: `field_${current.length + 1}`,
        label: 'New field',
        type: 'text',
        sort_order: current.length,
        required: false,
        optionsText: '{}',
      },
    ])
  }

  function removeField(index: number) {
    setFields((current) => current.filter((_, i) => i !== index).map((field, i) => ({ ...field, sort_order: i })))
  }

  async function handleSave() {
    if (!selectedSlug) return
    setSaving(true)
    try {
      const payload = fields.map((field, index) => {
        let options: Record<string, unknown> = {}
        try {
          options = JSON.parse(field.optionsText || '{}') as Record<string, unknown>
        } catch {
          throw new Error(`Invalid JSON options for field "${field.label}".`)
        }

        return {
          id: field.id,
          key: field.key.trim() || slugifyKey(field.label),
          label: field.label.trim(),
          type: field.type,
          sort_order: index,
          required: field.required,
          options,
        }
      })

      const response = await fetch(`/api/groups/${selectedSlug}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: payload }),
      })
      const data = (await response.json()) as { fields?: DbField[]; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not save fields.')

      setFields((data.fields ?? []).map(fieldToEditable))
      onAnnounce('Field configuration saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save fields.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <EmptyState title="Loading fields…" description="Fetching groups for your workspace." />
  }

  return (
    <div className="settings-stack">
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Field configuration</h2>
            <p>Add, edit, remove, and reorder fields for any group. Use JSON options for select/status choices.</p>
          </div>
          <div className="settings-header-actions">
            <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)} aria-label="Select group">
              {groups.map((group) => (
                <option key={group.id} value={group.slug}>{group.name}</option>
              ))}
            </select>
            <button className="button primary small" onClick={handleSave} disabled={saving || !selectedSlug}>
              {saving ? 'Saving…' : 'Save fields'}
            </button>
          </div>
        </div>

        <div className="fields-editor">
          {fields.map((field, index) => (
            <div key={field.id ?? `${field.key}-${index}`} className="fields-editor-row">
              <input
                value={field.label}
                onChange={(event) => updateField(index, { label: event.target.value, key: field.id ? field.key : slugifyKey(event.target.value) })}
                placeholder="Label"
                aria-label={`Field ${index + 1} label`}
              />
              <input
                value={field.key}
                onChange={(event) => updateField(index, { key: event.target.value })}
                placeholder="Key"
                className="mono"
                aria-label={`Field ${index + 1} key`}
              />
              <select value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FieldType })} aria-label={`Field ${index + 1} type`}>
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                value={field.optionsText}
                onChange={(event) => updateField(index, { optionsText: event.target.value })}
                placeholder='Options JSON e.g. {"choices":["A","B"]}'
                aria-label={`Field ${index + 1} options`}
              />
              <label className="fields-required-toggle">
                <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} />
                Required
              </label>
              <button type="button" className="icon-button danger" aria-label="Remove field" onClick={() => removeField(index)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="button secondary small" onClick={addField}>
          <Plus size={14} /> Add field
        </button>
      </div>
    </div>
  )
}
