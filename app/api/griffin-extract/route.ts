import { extractAssetsFromSpreadsheet } from '@/lib/griffineye-import'
import { requireUser } from '@/lib/supabase/session'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/csv'])

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

    const isCsvName = file.name.toLowerCase().endsWith('.csv')
    if (!isCsvName && file.type && !ALLOWED_TYPES.has(file.type)) {
      return Response.json({ error: 'Upload a CSV export for now.' }, { status: 400 })
    }

    const csvText = await file.text()
    const extraction = await extractAssetsFromSpreadsheet(csvText)

    return Response.json(extraction)
  } catch (error) {
    console.error('[griffin-extract]', error)
    const message = error instanceof Error ? error.message : 'GriffinEye import extraction failed.'
    const status = message === 'Unauthorized' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
