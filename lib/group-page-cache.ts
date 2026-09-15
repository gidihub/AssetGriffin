import type { DbField, DbGroup } from '@/lib/supabase/database.types'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

export type GroupPageCacheEntry = {
  group: DbGroup
  fields: DbField[]
  records: WorkspaceRecordRow[]
  fetchedAt: number
}

const cache = new Map<string, GroupPageCacheEntry>()

export function getCachedGroupPage(slug: string): GroupPageCacheEntry | undefined {
  return cache.get(slug)
}

export function setCachedGroupPage(
  slug: string,
  data: Pick<GroupPageCacheEntry, 'group' | 'fields' | 'records'>,
) {
  cache.set(slug, { ...data, fetchedAt: Date.now() })
}

export function invalidateGroupPage(slug: string) {
  cache.delete(slug)
}

export function invalidateAllGroupPages() {
  cache.clear()
}
