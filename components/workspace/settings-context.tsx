'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { WorkspaceSettingsPayload } from '@/lib/settings-types'

type SettingsContextValue = {
  data: WorkspaceSettingsPayload | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  patchSection: (section: string, body: Record<string, unknown>) => Promise<WorkspaceSettingsPayload>
  postSection: (section: string, body: Record<string, unknown>) => Promise<WorkspaceSettingsPayload & { createdKey?: string }>
  deleteSection: (section: string, id: string) => Promise<WorkspaceSettingsPayload>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WorkspaceSettingsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/settings')
      const payload = (await response.json()) as WorkspaceSettingsPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not load settings.')
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const patchSection = useCallback(async (section: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/settings/${section}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await response.json()) as WorkspaceSettingsPayload & { error?: string }
    if (!response.ok) throw new Error(payload.error ?? 'Save failed.')
    setData(payload)
    return payload
  }, [])

  const postSection = useCallback(async (section: string, body: Record<string, unknown>) => {
    const response = await fetch(`/api/settings/${section}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = (await response.json()) as WorkspaceSettingsPayload & { createdKey?: string; error?: string }
    if (!response.ok) throw new Error(payload.error ?? 'Create failed.')
    setData(payload)
    return payload
  }, [])

  const deleteSection = useCallback(async (section: string, id: string) => {
    const response = await fetch(`/api/settings/${section}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const payload = (await response.json()) as WorkspaceSettingsPayload & { error?: string }
    if (!response.ok) throw new Error(payload.error ?? 'Delete failed.')
    setData(payload)
    return payload
  }, [])

  const value = useMemo(
    () => ({ data, loading, error, refresh, patchSection, postSection, deleteSection }),
    [data, loading, error, refresh, patchSection, postSection, deleteSection],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useWorkspaceSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useWorkspaceSettings must be used within SettingsProvider')
  return context
}
