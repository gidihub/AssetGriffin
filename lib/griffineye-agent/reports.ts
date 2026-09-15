import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import type { ToolTable } from '@/lib/griffineye-agent/tools'
import { formatTableCell, isCurrencyColumn } from '@/lib/griffineye-format'

export const REPORT_FORMATS = ['csv', 'pdf'] as const
export type ReportFormat = (typeof REPORT_FORMATS)[number]

export type GeneratedReport = {
  format: ReportFormat
  filename: string
  mimeType: string
  /** Base64 so the JSON response can carry either format through one code path. */
  base64: string
  rowCount: number
  columnCount: number
  byteSize: number
}

/** AssetGriffin palette, kept in step with globals.css. */
const BRAND = {
  teal: rgb(0.184, 0.639, 0.569),
  ink: rgb(0.122, 0.137, 0.157),
  muted: rgb(0.42, 0.447, 0.502),
  rule: rgb(0.891, 0.882, 0.855),
  zebra: rgb(0.98, 0.98, 0.972),
}

function cellToText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'griffineye-report'
  )
}

export function buildReportFilename(title: string, format: ReportFormat): string {
  return `${slugify(title)}-${new Date().toISOString().slice(0, 10)}.${format}`
}

/**
 * RFC 4180 quoting. A leading =, +, - or @ is prefixed with a quote so
 * spreadsheet apps treat the value as text instead of a formula.
 */
function csvCell(value: unknown): string {
  const text = cellToText(value)
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded
}

/**
 * CSV keeps machine values — a raw 2980 and an ISO date — so the file can be
 * summed, sorted and pivoted. Only the PDF, which is read rather than
 * calculated on, gets display formatting.
 */
export function buildCsv(table: ToolTable): string {
  const header = table.columns.map((column) => csvCell(column.header)).join(',')
  const rows = table.rows.map((row) =>
    table.columns.map((column) => csvCell(row[column.key])).join(','),
  )
  return [header, ...rows].join('\r\n')
}

const PAGE = { width: 792, height: 612, margin: 40 } // Landscape Letter.
const FONT_SIZE = 8.5
const HEADER_SIZE = 9
const ROW_HEIGHT = 18

/**
 * StandardFonts Helvetica is WinAnsi-only. Asset names, locations, and titles
 * may contain smart quotes or other Unicode from user data — normalize those to
 * ASCII equivalents and replace anything still unsupported with '?'.
 */
function toPdfText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
}

export async function buildPdf(
  table: ToolTable,
  meta: { title: string; question: string; organizationName?: string },
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  pdf.setTitle(meta.title)
  pdf.setCreator('AssetGriffin · GriffinEye')

  const usableWidth = PAGE.width - PAGE.margin * 2

  // Money and dates print the way they appear on screen, so a saved report and
  // the answer it came from never disagree.
  const displayCell = (column: ToolTable['columns'][number], row: ToolTable['rows'][number]) =>
    formatTableCell(column.key, row[column.key])

  // Weight each column by its widest value so tables of any shape stay legible.
  const weights = table.columns.map((column) => {
    const widest = table.rows.reduce(
      (max, row) => Math.max(max, displayCell(column, row).length),
      column.header.length,
    )
    return Math.min(Math.max(widest, 6), 40)
  })
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)
  const widths = weights.map((weight) => (weight / weightTotal) * usableWidth)

  const truncate = (text: string, maxWidth: number, size: number, useBold = false) => {
    const safe = toPdfText(text)
    const face = useBold ? bold : font
    if (face.widthOfTextAtSize(safe, size) <= maxWidth) return safe
    let clipped = safe
    while (clipped.length > 1 && face.widthOfTextAtSize(`${clipped}...`, size) > maxWidth) {
      clipped = clipped.slice(0, -1)
    }
    return `${clipped}...`
  }

  let page = pdf.addPage([PAGE.width, PAGE.height])
  let cursorY = 0

  const startPage = (isFirst: boolean) => {
    if (!isFirst) page = pdf.addPage([PAGE.width, PAGE.height])
    cursorY = PAGE.height - PAGE.margin

    if (isFirst) {
      page.drawText('GriffinEye report', {
        x: PAGE.margin,
        y: cursorY - 10,
        size: 8,
        font: bold,
        color: BRAND.teal,
      })
      cursorY -= 26
      page.drawText(truncate(meta.title, usableWidth, 17, true), {
        x: PAGE.margin,
        y: cursorY - 12,
        size: 17,
        font: bold,
        color: BRAND.ink,
      })
      cursorY -= 30

      const subtitle = `${table.rows.length} ${table.rows.length === 1 ? 'record' : 'records'} · generated ${new Date().toLocaleDateString(
        'en-US',
        { month: 'long', day: 'numeric', year: 'numeric' },
      )}${meta.organizationName ? ` · ${meta.organizationName}` : ''}`
      page.drawText(truncate(subtitle, usableWidth, 8.5), {
        x: PAGE.margin,
        y: cursorY - 8,
        size: 8.5,
        font,
        color: BRAND.muted,
      })
      cursorY -= 18

      page.drawText(truncate(`Asked: ${meta.question}`, usableWidth, 8.5), {
        x: PAGE.margin,
        y: cursorY - 8,
        size: 8.5,
        font,
        color: BRAND.muted,
      })
      cursorY -= 24
    }

    // Column headers, repeated at the top of every page.
    let x = PAGE.margin
    table.columns.forEach((column, index) => {
      const header = truncate(column.header, widths[index] - 6, HEADER_SIZE, true)
      const offset = isCurrencyColumn(column.key)
        ? widths[index] - 6 - bold.widthOfTextAtSize(header, HEADER_SIZE)
        : 0

      page.drawText(header, {
        x: x + Math.max(offset, 0),
        y: cursorY - 10,
        size: HEADER_SIZE,
        font: bold,
        color: BRAND.ink,
      })
      x += widths[index]
    })
    cursorY -= 16

    page.drawLine({
      start: { x: PAGE.margin, y: cursorY },
      end: { x: PAGE.width - PAGE.margin, y: cursorY },
      thickness: 1,
      color: BRAND.teal,
    })
    cursorY -= 4
  }

  startPage(true)

  table.rows.forEach((row, rowIndex) => {
    if (cursorY - ROW_HEIGHT < PAGE.margin + 16) startPage(false)

    if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x: PAGE.margin,
        y: cursorY - ROW_HEIGHT + 4,
        width: usableWidth,
        height: ROW_HEIGHT,
        color: BRAND.zebra,
      })
    }

    let x = PAGE.margin
    table.columns.forEach((column, index) => {
      const text = truncate(displayCell(column, row), widths[index] - 6, FONT_SIZE)
      // Right-align money so the digits stack and totals can be scanned.
      const offset = isCurrencyColumn(column.key)
        ? widths[index] - 6 - font.widthOfTextAtSize(text, FONT_SIZE)
        : 0

      page.drawText(text, {
        x: x + Math.max(offset, 0),
        y: cursorY - ROW_HEIGHT + 9,
        size: FONT_SIZE,
        font,
        color: BRAND.ink,
      })
      x += widths[index]
    })

    cursorY -= ROW_HEIGHT
  })

  // Footer on every page, added last so page count is known.
  const pages = pdf.getPages()
  pages.forEach((current, index) => {
    current.drawText(`AssetGriffin · GriffinEye · Page ${index + 1} of ${pages.length}`, {
      x: PAGE.margin,
      y: PAGE.margin - 14,
      size: 7.5,
      font,
      color: BRAND.muted,
    })
  })

  return pdf.save()
}

export async function generateReport(
  table: ToolTable,
  format: ReportFormat,
  meta: { title: string; question: string; organizationName?: string },
): Promise<GeneratedReport> {
  const bytes =
    format === 'csv' ? Buffer.from(buildCsv(table), 'utf8') : Buffer.from(await buildPdf(table, meta))

  return {
    format,
    filename: buildReportFilename(meta.title, format),
    mimeType: format === 'csv' ? 'text/csv' : 'application/pdf',
    base64: bytes.toString('base64'),
    rowCount: table.rows.length,
    columnCount: table.columns.length,
    byteSize: bytes.byteLength,
  }
}
