import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { ImportAssetRecord } from '@/lib/griffineye-import'
import {
  createLegacyAssetForCurrentOrg,
  importLegacyAssetsForCurrentOrg,
  listLegacyAssetsForCurrentOrg,
} from '@/lib/groups-db'
import { importRecordToAssetData } from '@/lib/record-mappers'

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

export async function listAssetsForCurrentOrg() {
  return listLegacyAssetsForCurrentOrg()
}
