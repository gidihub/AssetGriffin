'use client'

import type { GriffinEyeResultTable } from '@/lib/griffineye-ask'
import { formatTableCell } from '@/lib/griffineye-format'

function rowRecordRef(row: Record<string, string | number | null>): string | null {
  const tag = row.asset_tag ?? row.assetTag ?? row.id
  if (tag == null || tag === '') return null
  return String(tag)
}

export function GriffinEyeResultTable({
  table,
  maxRows = 25,
  onOpenRecord,
}: {
  table: GriffinEyeResultTable
  maxRows?: number
  /** When set, rows with an asset tag become clickable to open record detail. */
  onOpenRecord?: (recordRef: string) => void
}) {
  if (!table.rows.length) return null

  const visible = table.rows.slice(0, maxRows)
  const hidden = table.rows.length - visible.length

  return (
    <div className="griffineye-result-table-wrap">
      <table className="griffineye-result-table">
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => {
            const recordRef = onOpenRecord ? rowRecordRef(row) : null
            return (
            <tr
              key={index}
              className={recordRef ? 'clickable-row' : undefined}
              tabIndex={recordRef ? 0 : undefined}
              role={recordRef ? 'button' : undefined}
              aria-label={recordRef ? `View asset ${recordRef}` : undefined}
              onClick={recordRef ? () => onOpenRecord(recordRef) : undefined}
              onKeyDown={
                recordRef
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onOpenRecord(recordRef)
                      }
                    }
                  : undefined
              }
            >
              {table.columns.map((column) => (
                <td key={column.key}>{formatTableCell(column.key, row[column.key] ?? null)}</td>
              ))}
            </tr>
            )
          })}
        </tbody>
      </table>
      {hidden > 0 && (
        <p className="griffineye-result-more">
          {hidden} more row{hidden === 1 ? '' : 's'} not shown.
        </p>
      )}
    </div>
  )
}
