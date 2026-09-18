import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import {
  hydrateImportRecordPhotos,
  type ImportPhotoHydrationResult,
} from '@/lib/import-photo-url.server'
import {
  createLegacyAssetForCurrentOrg,
  importAssetRecordsForCurrentOrg,
  importLegacyAssetsForCurrentOrg,
  listLegacyAssetsForCurrentOrg,
  recordToLegacyAssetShape,
} from '@/lib/groups-db'
import { importRecordToAssetData } from '@/lib/record-mappers'
import { requireUserProfile } from '@/lib/supabase/session'

export type ImportAssetsResult = {
  assets: ReturnType<typeof recordToLegacyAssetShape>[]
  photos: ImportPhotoHydrationResult
}

export {
  dbRecordToAssetRecord,
  intakeDraftToRecordData,
  importRecordToAssetData,
} from '@/lib/record-mappers'

/** @deprecated Use intakeDraftToRecordData — kept for import sites during cutover. */
export { intakeDraftToRecordData as intakeDraftToDbInsert } from '@/lib/record-mappers'

/** @deprecated Use dbRecordToAssetRecord */
export { dbRecordToAssetRecord as dbAssetToAssetRecord } from '@/lib/record-mappers'

/** @deprecated Use importRecordToAssetData */
export function toDbAssetInsert(record: ImportAssetRecord, _organizationId: string) {
  void _organizationId
  return importRecordToAssetData(record)
}

export async function createAssetForCurrentOrg(draft: AssetIntakeDraft) {
  return createLegacyAssetForCurrentOrg(draft)
}

export async function importAssetsForCurrentOrg(records: ImportAssetRecord[]) {
  return importLegacyAssetsForCurrentOrg(records)
}

export async function importAssetsWithPhotosForCurrentOrg(
  records: ImportAssetRecord[],
): Promise<ImportAssetsResult> {
  const { supabase, profile } = await requireUserProfile()
  const inserted = await importAssetRecordsForCurrentOrg(records)
  const assets = inserted.map(recordToLegacyAssetShape)

  const photoItems = inserted
    .map((record, index) => ({
      recordId: record.id,
      photoUrl: typeof records[index]?.photo_url === 'string' ? records[index].photo_url.trim() : '',
      assetTag: String(records[index]?.asset_tag ?? record.id),
    }))
    .filter((item) => item.photoUrl)

  const photos =
    photoItems.length > 0
      ? await hydrateImportRecordPhotos(supabase, profile.organization_id, photoItems)
      : { attached: 0, skipped: 0, failed: [] as ImportPhotoHydrationResult['failed'] }

  return { assets, photos }
}

export async function listAssetsForCurrentOrg() {
  return listLegacyAssetsForCurrentOrg()
}
