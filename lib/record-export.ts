import { parseAssetPhotos } from '@/lib/asset-detail-data'
import type { DbField } from '@/lib/supabase/database.types'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

export const RECORD_EXPORT_FORMATS = ['xls', 'xlsx', 'csv', 'tsv'] as const
export type RecordExportFormat = (typeof RECORD_EXPORT_FORMATS)[number]

export type RecordExportOptions = {
  format: RecordExportFormat
  includeTabular: boolean
  includeFiles?: boolean
}

export type ExportColumn = {
  key: string
  header: string
}

const MIME_TYPES: Record<RecordExportFormat, string> = {
  csv: 'text/csv;charset=utf-8',
  tsv: 'text/tab-separated-values;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** RFC 4180 quoting with formula-injection guard. */
function delimitedCell(value: unknown, delimiter: ',' | '\t'): string {
  const text = cellToText(value)
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text
  const needsQuotes = delimiter === ','
    ? /[",\n\r]/.test(guarded)
    : /[\t"\n\r]/.test(guarded)
  return needsQuotes ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

function flattenJsonObject(prefix: string, value: Record<string, unknown>): ExportColumn[] {
  return Object.entries(value).flatMap(([key, nested]) => {
    const columnKey = `${prefix}.${key}`
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return flattenJsonObject(columnKey, nested as Record<string, unknown>)
    }
    return [{ key: columnKey, header: columnKey.replace(/_/g, ' ') }]
  })
}

function buildExportColumns(fields: DbField[], records: WorkspaceRecordRow[], includeTabular: boolean): ExportColumn[] {
  const columns: ExportColumn[] = [{ key: 'record_id', header: 'Record ID' }]

  for (const field of fields) {
    if (field.type === 'json') {
      if (!includeTabular) continue

      const nestedKeys = new Set<string>()
      for (const record of records) {
        const value = record.data[field.key]
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          for (const nested of flattenJsonObject(field.key, value as Record<string, unknown>)) {
            nestedKeys.add(nested.key)
          }
        }
      }

      const nestedColumns = [...nestedKeys]
        .sort()
        .map((key) => ({ key, header: key.replace(/_/g, ' ') }))

      if (nestedColumns.length) {
        columns.push(...nestedColumns)
      } else {
        columns.push({ key: field.key, header: field.label })
      }
      continue
    }

    if (field.type === 'relation') continue
    columns.push({ key: field.key, header: field.label })
  }

  columns.push(
    { key: 'created_at', header: 'Created' },
    { key: 'updated_at', header: 'Updated' },
  )

  return columns
}

function readNestedValue(data: Record<string, unknown>, key: string): unknown {
  if (!key.includes('.')) return data[key]

  const [root, ...rest] = key.split('.')
  let current: unknown = data[root]
  for (const segment of rest) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return ''
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function buildExportRow(
  record: WorkspaceRecordRow,
  columns: ExportColumn[],
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    record_id: record.id,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  }

  for (const column of columns) {
    if (column.key === 'record_id' || column.key === 'created_at' || column.key === 'updated_at') continue
    row[column.key] = readNestedValue(record.data, column.key)
  }

  return row
}

export function buildExportFilename(groupSlug: string, format: RecordExportFormat): string {
  const slug = groupSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'records'
  return `${slug}-export-${new Date().toISOString().slice(0, 10)}.${format}`
}

function buildExportZipFilename(groupSlug: string): string {
  const slug = groupSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'records'
  return `${slug}-export-${new Date().toISOString().slice(0, 10)}.zip`
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'record'
}

function buildDelimitedText(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  delimiter: ',' | '\t',
): string {
  const header = columns.map((column) => delimitedCell(column.header, delimiter)).join(delimiter)
  const body = rows.map((row) =>
    columns.map((column) => delimitedCell(row[column.key], delimiter)).join(delimiter),
  )
  return [header, ...body].join('\r\n')
}

async function buildSpreadsheetBuffer(
  format: 'xlsx' | 'xls',
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx')
  const matrix = [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => row[column.key] ?? '')),
  ]
  const sheet = XLSX.utils.aoa_to_sheet(matrix)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Export')
  return XLSX.write(workbook, { bookType: format, type: 'array' }) as ArrayBuffer
}

export async function generateTabularExport(
  columns: ExportColumn[],
  rows: Record<string, unknown>[],
  filename: string,
  format: RecordExportFormat,
): Promise<{ blob: Blob; filename: string }> {
  if (!rows.length) {
    throw new Error('No rows to export.')
  }

  if (format === 'csv' || format === 'tsv') {
    const delimiter = format === 'csv' ? ',' : '\t'
    const text = buildDelimitedText(columns, rows, delimiter)
    return {
      blob: new Blob([text], { type: MIME_TYPES[format] }),
      filename,
    }
  }

  const buffer = await buildSpreadsheetBuffer(format, columns, rows)
  return {
    blob: new Blob([buffer], { type: MIME_TYPES[format] }),
    filename,
  }
}

type ZipEntry = { path: string; blob: Blob }

async function fetchStoredPhoto(recordId: string, storagePath: string): Promise<Blob | null> {
  try {
    const response = await fetch(
      `/api/assets/records/${recordId}/photos?path=${encodeURIComponent(storagePath)}`,
    )
    if (!response.ok) return null
    return response.blob()
  } catch {
    return null
  }
}

async function fetchLegacyPhoto(previewUrl: string): Promise<Blob | null> {
  if (!previewUrl.startsWith('https://')) return null
  try {
    const response = await fetch(previewUrl)
    if (!response.ok) return null
    return response.blob()
  } catch {
    return null
  }
}

function photoExtension(storagePath: string, previewUrl: string, blob: Blob): string {
  const fromPath = storagePath.match(/(\.[a-z0-9]+)$/i)?.[1]
  if (fromPath) return fromPath.toLowerCase()

  const mime = blob.type.toLowerCase()
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'

  const fromUrl = previewUrl.match(/(\.[a-z0-9]+)(?:\?|$)/i)?.[1]
  return fromUrl?.toLowerCase() ?? '.jpg'
}

async function collectRecordPhotoEntries(records: WorkspaceRecordRow[]): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = []

  for (const record of records) {
    const photos = parseAssetPhotos(record.data)
    if (!photos.length) continue

    const folderLabel = sanitizePathSegment(String(record.data.asset_tag ?? record.data.name ?? 'asset'))
    const folder = `${folderLabel}-${sanitizePathSegment(record.id)}`

    for (const [index, photo] of photos.entries()) {
      const blob = photo.storagePath
        ? await fetchStoredPhoto(record.id, photo.storagePath)
        : await fetchLegacyPhoto(photo.previewUrl)

      if (!blob) continue

      const baseName = sanitizePathSegment(photo.name || `photo-${index + 1}`)
      const ext = photoExtension(photo.storagePath, photo.previewUrl, blob)
      const normalizedName = baseName.toLowerCase().endsWith(ext) ? baseName : `${baseName}${ext}`
      entries.push({ path: `files/${folder}/${index + 1}-${normalizedName}`, blob })
    }
  }

  return entries
}

async function bundleExportZip(spreadsheetBlob: Blob, spreadsheetName: string, files: ZipEntry[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  zip.file(spreadsheetName, spreadsheetBlob)

  for (const file of files) {
    zip.file(file.path, file.blob)
  }

  return zip.generateAsync({ type: 'blob' })
}

export async function generateRecordExport(
  fields: DbField[],
  records: WorkspaceRecordRow[],
  groupSlug: string,
  options: RecordExportOptions,
): Promise<{ blob: Blob; filename: string }> {
  if (!records.length) {
    throw new Error('No records to export.')
  }

  const columns = buildExportColumns(fields, records, options.includeTabular)
  const rows = records.map((record) => buildExportRow(record, columns))
  const spreadsheetFilename = buildExportFilename(groupSlug, options.format)
  const spreadsheet = await generateTabularExport(columns, rows, spreadsheetFilename, options.format)

  if (!options.includeFiles) {
    return spreadsheet
  }

  const photoEntries = await collectRecordPhotoEntries(records)
  if (!photoEntries.length) {
    return spreadsheet
  }

  const zipBlob = await bundleExportZip(spreadsheet.blob, spreadsheet.filename, photoEntries)
  return {
    blob: zipBlob,
    filename: buildExportZipFilename(groupSlug),
  }
}

export function downloadRecordExport(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
