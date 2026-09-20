import type { GriffinExtractTargetGroup } from '@/lib/group-import'

export const IMPORT_TEMPLATE_PATHS: Record<GriffinExtractTargetGroup, string> = {
  assets: '/templates/asset-import-template.csv',
  people: '/templates/people-import-template.csv',
}

export const IMPORT_TEMPLATE_FILENAMES: Record<GriffinExtractTargetGroup, string> = {
  assets: 'assetgriffin-asset-import-template.csv',
  people: 'assetgriffin-people-import-template.csv',
}
