/**
 * Cell formatting shared by the on-screen result table and generated PDF
 * reports, so a printed report reads exactly like the answer it came from.
 *
 * CSV is deliberately excluded: it keeps raw numbers and ISO dates so the file
 * stays sortable and summable in a spreadsheet.
 */

/** Columns emitted as money by the asset and rank_by tools. */
const CURRENCY_COLUMNS = new Set(['value', 'total_value', 'average_value'])

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/

export function isCurrencyColumn(key: string): boolean {
  return CURRENCY_COLUMNS.has(key)
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatTableCell(
  key: string,
  value: unknown,
  { emptyText = '—' }: { emptyText?: string } = {},
): string {
  if (value === null || value === undefined || value === '') return emptyText

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (typeof value === 'number') {
    if (CURRENCY_COLUMNS.has(key)) return formatCurrency(value)
    if (key === 'percent') return `${value}%`
    return String(value)
  }

  if (typeof value === 'string' && ISO_DATE_PREFIX.test(value)) {
    const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  return String(value)
}
