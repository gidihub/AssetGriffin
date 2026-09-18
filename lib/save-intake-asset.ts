import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import { dbRecordToAssetRecord } from '@/lib/record-mappers'
import type { DbRecord } from '@/lib/supabase/database.types'
import type { AssetRecord } from '@/lib/workspace-data'

function recordFromApiPayload(record: unknown): AssetRecord {
  if (record && typeof record === 'object' && 'id' in record && 'name' in record) {
    return record as AssetRecord
  }

  if (!record || typeof record !== 'object') {
    throw new Error('Asset save returned an unexpected response.')
  }

  const payload = record as Record<string, unknown>
  const row: DbRecord = {
    id: String(payload.id ?? ''),
    group_id: String(payload.group_id ?? ''),
    organization_id: String(payload.organization_id ?? ''),
    data: (payload.data as Record<string, unknown> | undefined) ?? payload,
    created_at: String(payload.created_at ?? new Date().toISOString()),
    updated_at: String(payload.updated_at ?? new Date().toISOString()),
    created_by: null,
  }
  return dbRecordToAssetRecord(row)
}

/** Persist a reviewed intake draft to Supabase. */
export async function saveIntakeAsset(draft: AssetIntakeDraft): Promise<AssetRecord> {
  const response = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })

  if (!response.ok) {
    const raw = await response.text()
    let message = 'Could not save asset.'
    try {
      const payload = JSON.parse(raw) as { error?: string }
      if (payload.error) message = payload.error
    } catch {
      if (raw.trim()) message = raw.trim()
    }
    throw new Error(`${message} (HTTP ${response.status})`)
  }

  const data = (await response.json()) as { record?: unknown; asset?: unknown; error?: string }

  if (data.record) {
    return recordFromApiPayload(data.record)
  }

  if (data.asset) {
    return recordFromApiPayload(data.asset)
  }

  throw new Error('Asset save returned an unexpected response.')
}
