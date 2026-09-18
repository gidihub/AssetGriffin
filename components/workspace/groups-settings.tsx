'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { groupIcon } from '@/lib/group-icons'
import type { DbGroup } from '@/lib/supabase/database.types'
import { DataTable, EmptyState } from './primitives'

type Announce = (message: string) => void

type GroupRow = DbGroup & { recordCount?: number }

export function GroupsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadGroups() {
    setLoading(true)
    try {
      const response = await fetch('/api/groups')
      const data = (await response.json()) as { groups?: GroupRow[]; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not load groups.')
      setGroups(data.groups ?? [])
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not load groups.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadGroups()
  }, [])

  async function handleDelete(slug: string, name: string) {
    if (!window.confirm(`Delete the ${name} group? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/groups/${slug}`, { method: 'DELETE' })
      const data = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not delete group.')
      onAnnounce(`${name} group deleted.`)
      await loadGroups()
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not delete group.')
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = (await response.json()) as { group?: DbGroup; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Could not create group.')
      setName('')
      onAnnounce(`Created ${data.group?.name ?? trimmed} group.`)
      await loadGroups()
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not create group.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-stack">
      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Create a group</h2>
            <p>Add a new record type to your workspace — for example Vehicles or Contracts.</p>
          </div>
        </div>
        <div className="settings-card-body">
          <form className="settings-inline-form" onSubmit={handleCreate}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Group name"
              aria-label="Group name"
            />
            <button className="button primary small" type="submit" disabled={saving || !name.trim()}>
              <Plus size={14} /> {saving ? 'Creating…' : 'Create group'}
            </button>
          </form>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2>Workspace groups</h2>
            <p>Each group has its own fields and records. Slugs are generated from the name.</p>
          </div>
        </div>
        <div className="settings-card-body settings-card-body--compact">
        {loading ? (
          <EmptyState title="Loading groups…" description="Fetching your workspace configuration." />
        ) : (
          <DataTable<GroupRow>
            rows={groups}
            columns={[
              {
                key: 'name',
                header: 'Group',
                render: (group) => {
                  const Icon = groupIcon(group.icon)
                  return (
                    <span className="group-name-cell">
                      <Icon size={15} /> <strong>{group.name}</strong>
                    </span>
                  )
                },
                sortValue: (group) => group.name,
              },
              { key: 'slug', header: 'Slug', mono: true, render: (group) => group.slug, sortValue: (group) => group.slug },
              {
                key: 'records',
                header: 'Records',
                render: (group) => String(group.recordCount ?? 0),
                sortValue: (group) => group.recordCount ?? 0,
              },
              {
                key: 'actions',
                header: '',
                render: (group) =>
                  group.slug === 'assets' ? null : (
                    <button
                      className="text-button"
                      onClick={() => void handleDelete(group.slug, group.name)}
                      disabled={(group.recordCount ?? 0) > 0}
                      title={(group.recordCount ?? 0) > 0 ? 'Delete all records first' : 'Delete group'}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  ),
              },
            ]}
            emptyState={<EmptyState title="No groups yet" description="Create your first group above." />}
          />
        )}
        </div>
      </div>
    </div>
  )
}
