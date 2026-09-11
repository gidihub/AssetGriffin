'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Inbox, X } from 'lucide-react'
import { statusToneMap } from '@/lib/workspace-data'

export function StatusBadge({ status }: { status: string }) {
  const tone = statusToneMap[status] ?? 'neutral'
  return (
    <span className={`status-badge tone-${tone}`}>
      <span className="status-dot" />
      {status}
    </span>
  )
}

export function MetricStrip({
  metrics,
  activeId,
  onSelect,
}: {
  metrics: { id: string; label: string; value: string; foot?: string; icon: React.ComponentType<{ size?: number }>; tone?: string }[]
  activeId?: string
  onSelect?: (id: string) => void
}) {
  return (
    <div className="metric-grid metric-grid-strip">
      {metrics.map(({ id, label, value, foot, icon: Icon, tone }) => (
        <button
          key={id}
          type="button"
          className={`metric-card metric-card-button ${activeId === id ? 'is-active' : ''}`}
          onClick={() => onSelect?.(id)}
          aria-pressed={activeId === id}
        >
          <div className="metric-top">
            <span className="metric-label">{label}</span>
            <span className={`metric-icon ${tone ?? 'blue-icon'}`}><Icon size={16} /></span>
          </div>
          <div className="metric-value">{value}</div>
          {foot && <div className="metric-foot"><span>{foot}</span></div>}
        </button>
      ))}
    </div>
  )
}

export interface DataTableColumn<T> {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  mono?: boolean
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  selectable,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  emptyState,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  selectable?: boolean
  selected?: Set<string>
  onToggleSelect?: (id: string) => void
  onToggleSelectAll?: (checked: boolean) => void
  emptyState?: React.ReactNode
}) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    const column = columns.find((c) => c.key === sortKey)
    if (!column?.sortValue) return rows
    return [...rows].sort((a, b) => {
      const va = column.sortValue!(a)
      const vb = column.sortValue!(b)
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [rows, sortKey, sortDir, columns])

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortValue) return
    if (sortKey === column.key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(column.key)
      setSortDir('asc')
    }
  }

  const allSelected = selectable && rows.length > 0 && rows.every((row) => selected?.has(row.id))

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="asset-table-wrap">
      <table className="asset-table data-table">
        <thead>
          <tr>
            {selectable && (
              <th className="checkbox-col">
                <input type="checkbox" aria-label="Select all rows" checked={allSelected} onChange={(e) => onToggleSelectAll?.(e.target.checked)} />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key}>
                {column.sortValue ? (
                  <button type="button" className="sort-header" onClick={() => handleSort(column)}>
                    {column.header}
                    {sortKey === column.key ? (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} className="sort-idle" />}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id} className={onRowClick ? 'clickable-row' : ''} onClick={() => onRowClick?.(row)}>
              {selectable && (
                <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" aria-label={`Select ${row.id}`} checked={selected?.has(row.id) ?? false} onChange={() => onToggleSelect?.(row.id)} />
                </td>
              )}
              {columns.map((column) => (
                <td key={column.key} className={column.mono ? 'mono' : ''}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BulkActionBar({ count, actions, onClear }: { count: number; actions: { label: string; onClick: () => void }[]; onClear: () => void }) {
  if (count === 0) return null
  return (
    <div className="bulk-action-bar">
      <span>{count} selected</span>
      <div className="bulk-actions">
        {actions.map((action) => (
          <button key={action.label} className="button secondary small" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
      </div>
      <button className="bulk-clear" aria-label="Clear selection" onClick={onClear}><X size={14} /></button>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, ctaLabel, onCta }: { icon?: React.ComponentType<{ size?: number }>; title: string; description: string; ctaLabel?: string; onCta?: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon size={22} /></div>
      <strong>{title}</strong>
      <p>{description}</p>
      {ctaLabel && <button className="button secondary small" onClick={onCta}>{ctaLabel}</button>}
    </div>
  )
}

export function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <button className={`fake-switch ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />
    </div>
  )
}

export function DetailDrawer({ title, subtitle, badge, actions, onClose, children }: { title: string; subtitle?: string; badge?: React.ReactNode; actions?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer-header">
          <div>
            <div className="drawer-title-row">
              <h2 id="drawer-title">{title}</h2>
              {badge}
            </div>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="drawer-header-actions">
            {actions}
            <button className="close-button" onClick={onClose} aria-label="Close detail panel"><X size={18} /></button>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  )
}

export function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="drawer-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export function FieldGrid({ fields }: { fields: { label: string; value: React.ReactNode }[] }) {
  return (
    <div className="field-grid">
      {fields.map((field) => (
        <div key={field.label} className="field-item">
          <span>{field.label}</span>
          <strong>{field.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function HistoryList({ items }: { items: { who: string; what: string; when: string }[] }) {
  return (
    <ul className="history-list">
      {items.map((item, index) => (
        <li key={index}>
          <strong>{item.what}</strong>
          <span>{item.who} · {item.when}</span>
        </li>
      ))}
    </ul>
  )
}

export function LifecycleStepper({
  stages,
  current,
  dates,
}: {
  stages: string[]
  current: string
  dates: Partial<Record<string, string>>
}) {
  const currentIndex = stages.indexOf(current)
  return (
    <div className="lifecycle-stepper">
      {stages.map((stage, index) => {
        const reached = index <= currentIndex
        const isCurrent = index === currentIndex
        return (
          <div key={stage} className={`lifecycle-step ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}`}>
            <div className="lifecycle-step-marker">{reached && !isCurrent ? <Check size={11} /> : <span className="lifecycle-step-dot" />}</div>
            <div className="lifecycle-step-copy">
              <strong>{stage}</strong>
              <span>{dates[stage] ?? (reached ? '—' : 'Not yet reached')}</span>
            </div>
            {index < stages.length - 1 && <div className={`lifecycle-step-line ${index < currentIndex ? 'is-reached' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function QRCodePlaceholder({ seed, size = 64 }: { seed: string; size?: number }) {
  const cells = 7
  const pattern = useMemo(() => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
    const grid: boolean[] = []
    for (let i = 0; i < cells * cells; i++) {
      hash = (hash * 1103515245 + 12345) >>> 0
      grid.push(((hash >> (i % 24)) & 1) === 1)
    }
    return grid
  }, [seed])

  return (
    <div className="qr-placeholder" style={{ width: size, height: size }} role="img" aria-label={`QR code placeholder for ${seed}`}>
      <div className="qr-grid" style={{ gridTemplateColumns: `repeat(${cells}, 1fr)` }}>
        {pattern.map((filled, index) => {
          const isAnchor = (row: number, col: number) => (row < 2 && col < 2) || (row < 2 && col > cells - 3) || (row > cells - 3 && col < 2)
          const row = Math.floor(index / cells)
          const col = index % cells
          return <span key={index} className={filled || isAnchor(row, col) ? 'qr-cell filled' : 'qr-cell'} />
        })}
      </div>
    </div>
  )
}

export function Panel({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel list-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
