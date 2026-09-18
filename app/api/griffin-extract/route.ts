import { parseExtractTargetGroup } from '@/lib/group-import'
import {
  extractAssetsFromSpreadsheet,
  isSupportedSpreadsheetName,
  parseSpreadsheetUpload,
} from '@/lib/griffineye-import'
import { extractPeopleFromSpreadsheet } from '@/lib/griffineye-people-import'
import { requireUser } from '@/lib/supabase/session'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    await requireUser()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return Response.json({ error: 'Missing spreadsheet upload.' }, { status: 400 })
    }

    if (file.size === 0) {
      return Response.json({ error: 'The uploaded file is empty.' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'Spreadsheet must be 5 MB or smaller.' }, { status: 400 })
    }

    if (!isSupportedSpreadsheetName(file.name)) {
      return Response.json({ error: 'Upload a CSV or Excel file (.csv, .xlsx, .xls).' }, { status: 400 })
    }

    const targetGroup = parseExtractTargetGroup(formData.get('targetGroup'))
    const buffer = await file.arrayBuffer()
    const table = parseSpreadsheetUpload(buffer, file.name)
    const extraction =
      targetGroup === 'people'
        ? await extractPeopleFromSpreadsheet(table)
        : await extractAssetsFromSpreadsheet(table)

    return Response.json({ ...extraction, targetGroup })
  } catch (error) {
    console.error('[griffin-extract]', error)
    const message = error instanceof Error ? error.message : 'GriffinEye import extraction failed.'
    const status = message === 'Unauthorized' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
