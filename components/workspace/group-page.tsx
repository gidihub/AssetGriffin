'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  Boxes,
  Filter,
  Package,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react'
import {
  BulkActionBar,
  DataTable,
  DetailDrawer,
  DrawerSection,
  EmptyState,
  FieldGrid,
  MetricStrip,
  Panel,
  StatusBadge,
} from './primitives'
import { AssetCaptureModal } from '@/components/workspace/asset-capture-modal'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeSearchBar } from '@/components/griffineye/griffineye-search-bar'
import { GriffinEyeResultTable } from '@/components/griffineye/griffineye-result-table'
import { groupIcon } from '@/lib/group-icons'
import {
  fieldChoices,
  formatFieldValue,
  getPrimaryStatusField,
  getSearchableText,
  isFilterField,
  isTableField,
  recordDisplayLabel,
  recordDisplaySubtitle,
  renderFieldValue,
} from '@/lib/field-ui'
import { dbRecordToAssetRecord } from '@/lib/record-mappers'
import { askGriffinEye, type GriffinEyeResultTable as GriffinEyeResultTableData } from '@/lib/griffineye-ask'
import { saveIntakeAsset } from '@/lib/save-intake-asset'
import type { DbField, DbGroup } from '@/lib/supabase/database.types'
import type { AssetRecord } from '@/lib/workspace-data'
import { findRecordByRef, recordOpenRef, type WorkspaceRecordRow } from '@/lib/record-mappers'
import { getCachedGroupPage, setCachedGroupPage, invalidateGroupPage } from '@/lib/group-page-cache'
import { AssetDetailView } from '@/components/workspace/asset-detail-view'
import { RecordFormDrawer } from '@/components/workspace/record-form-drawer'
import { RecordActionsPanel } from '@/components/workspace/record-actions-panel'
import type { DbActionType } from '@/lib/schema-types'

type Announce = (message: string) => void

function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  onAdd,
  addLabel,
  onExport,
  extraActions,
}: {
  icon: React.ComponentType<{ size?: number }>
  eyebrow: string
  title: string
  description: string
  onAdd: () => void
  addLabel: string
  onExport: () => void
  extraActions?: React.ReactNode
}) {
  return (
    <div className="screen-heading">
      <div className="heading-icon-row">
        <div className="heading-icon-badge"><Icon size={22} /></div>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="heading-actions">
        {extraActions}
        <button className="button secondary" onClick={onExport}><ArrowDownToLine size={16} /> Export</button>
        <button className="button primary" onClick={onAdd}><Plus size={16} /> {addLabel}</button>
      </div>
    </div>
  )
}

function Toolbar({
  query,
  onQuery,
  placeholder,
  filters,
  onAnnounce,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder: string
  filters: { label: string; options: string[]; value: string; onChange: (value: string) => void }[]
  onAnnounce: Announce
}) {
  return (
    <div className="table-toolbar list-toolbar">
      <div className="search-wrap">
        <Search size={16} />
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} />
      </div>
      {filters.map((filter) => (
        <select key={filter.label} className="filter-select" value={filter.value} onChange={(e) => filter.onChange(e.target.value)} aria-label={filter.label}>
          <option value="">{filter.label}</option>
          {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ))}
      <button className="filter-button" onClick={() => onAnnounce('Export prepared.')}><Filter size={15} /> More filters</button>
    </div>
  )
}

const GROUP_DESCRIPTIONS: Record<string, string> = {
  assets: 'Everything your company owns, in one accountable view.',
  people: 'People, teams, and who holds what across your organization.',
  locations: 'Sites, offices, and warehouses where your inventory lives.',
  maintenance: 'Open work orders and service history across your fleet.',
  audits: 'Physical audits, reconciliation, and discrepancy tracking.',
  inspections: 'Scheduled inspections, checklists, and pass/fail history.',
  reports: 'Saved reports and scheduled exports for your workspace.',
}

export function GroupPage({
  slug,
  onAnnounce,
  scanTrigger,
  initialGriffinEyeQuery,
  onInitialGriffinEyeQueryHandled,
  onOpenSpreadsheetImport,
  initialStatusFilter,
  initialQuery,
  onInitialFiltersHandled,
  initialOpenRecordRef,
  onInitialOpenRecordHandled,
  onOpenRecordDetail,
}: {
  slug: string
  onAnnounce: Announce
  scanTrigger?: number
  initialGriffinEyeQuery?: string | null
  onInitialGriffinEyeQueryHandled?: () => void
  onOpenSpreadsheetImport?: () => void
  initialStatusFilter?: string
  initialQuery?: string
  onInitialFiltersHandled?: () => void
  /** Open detail drawer once rows load (asset tag or record UUID). */
  initialOpenRecordRef?: string | null
  onInitialOpenRecordHandled?: () => void
  /** Bubble record opens to parent (e.g. overview deep-link state). */
  onOpenRecordDetail?: (recordRef: string) => void
}) {
  const isAssets = slug === 'assets'
  const Icon = groupIcon('boxes')

  const [group, setGroup] = useState<DbGroup | null>(null)
  const [fields, setFields] = useState<DbField[]>([])
  const [rows, setRows] = useState<WorkspaceRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [query, setQuery] = useState(initialQuery ?? '')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<WorkspaceRecordRow | null>(null)
  const [actionTypes, setActionTypes] = useState<DbActionType[]>([])
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<WorkspaceRecordRow | null>(null)

  const [showCapture, setShowCapture] = useState(false)
  const [captureMode, setCaptureMode] = useState<'choose' | 'scan' | 'photo'>('choose')

  const [griffinEyeSummary, setGriffinEyeSummary] = useState('')
  const [griffinEyeTags, setGriffinEyeTags] = useState<string[] | null>(null)
  const [griffinEyeTable, setGriffinEyeTable] = useState<GriffinEyeResultTableData | null>(null)
  const handledInitialQuery = useRef<string | null>(null)

  const openRecordDetail = useCallback(
    (row: WorkspaceRecordRow) => {
      setDetail(row)
      onOpenRecordDetail?.(recordOpenRef(row))
    },
    [onOpenRecordDetail],
  )

  const GroupIcon = group ? groupIcon(group.icon) : Icon

  useEffect(() => {
    if (!initialQuery && !initialStatusFilter) return
    if (initialQuery) setQuery(initialQuery)
    if (initialStatusFilter) setStatusFilter(initialStatusFilter)
    onInitialFiltersHandled?.()
  }, [initialQuery, initialStatusFilter, onInitialFiltersHandled])

  useEffect(() => {
    if (!initialOpenRecordRef || loading) return
    const row = findRecordByRef(rows, initialOpenRecordRef)
    if (!row) return
    setDetail(row)
    onInitialOpenRecordHandled?.()
  }, [initialOpenRecordRef, loading, rows, onInitialOpenRecordHandled])

  useEffect(() => {
    let cancelled = false
    const cached = getCachedGroupPage(slug)

    if (cached) {
      setGroup(cached.group)
      setFields(cached.fields)
      setRows(cached.records)
      setLoading(false)
      setLoadError('')
    } else {
      setLoading(true)
      setLoadError('')
    }

    async function load() {
      try {
        const [groupRes, actionsRes] = await Promise.all([
          fetch(`/api/groups/${slug}`),
          fetch(`/api/groups/${slug}/actions`),
        ])
        const payload = (await groupRes.json()) as {
          group?: DbGroup
          fields?: DbField[]
          records?: WorkspaceRecordRow[]
          error?: string
        }
        const actionsPayload = (await actionsRes.json()) as {
          actionTypes?: DbActionType[]
        }

        if (cancelled) return
        if (!groupRes.ok || payload.error) throw new Error(payload.error ?? 'Could not load group.')

        const nextGroup = payload.group ?? null
        const nextFields = payload.fields ?? []
        const nextRows = payload.records ?? []

        setGroup(nextGroup)
        setFields(nextFields)
        setRows(nextRows)
        setActionTypes(actionsRes.ok ? (actionsPayload.actionTypes ?? []) : [])
        if (nextGroup) {
          setCachedGroupPage(slug, { group: nextGroup, fields: nextFields, records: nextRows })
        }
      } catch (error) {
        if (cancelled) return
        if (!cached) {
          setLoadError(error instanceof Error ? error.message : 'Could not load group.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  function openCapture(mode: 'choose' | 'scan' | 'photo' = 'choose') {
    setCaptureMode(mode)
    setShowCapture(true)
  }

  useEffect(() => {
    if (scanTrigger && isAssets) openCapture('scan')
  }, [scanTrigger, isAssets])

  const assetRows: AssetRecord[] = useMemo(
    () => (isAssets ? rows.map((row) => dbRecordToAssetRecord({ id: row.id, group_id: group?.id ?? '', organization_id: '', data: row.data, created_at: row.createdAt, updated_at: row.updatedAt, created_by: null })) : []),
    [isAssets, rows, group?.id],
  )

  const tableFields = useMemo(() => fields.filter(isTableField).slice(0, 6), [fields])
  const filterFields = useMemo(() => fields.filter(isFilterField), [fields])
  const statusField = useMemo(() => getPrimaryStatusField(fields), [fields])

  const clearManualFilters = useCallback(() => {
    setSelected(new Set())
    setQuery('')
    setFilterValues({})
    setStatusFilter('')
  }, [])

  const runGriffinEyeQuery = useCallback(
    async (question: string) => {
      if (!isAssets) return
      try {
        const result = await askGriffinEye(question)
        clearManualFilters()
        setGriffinEyeSummary(result.answer)

        if (result.assetTags.length) {
          setGriffinEyeTags(result.assetTags)
          setGriffinEyeTable(null)
          onAnnounce(`GriffinEye found ${result.assetTags.length} matching assets.`)
          return
        }

        setGriffinEyeTags([])
        setGriffinEyeTable(result.table)
        onAnnounce('GriffinEye answered your question.')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'GriffinEye could not answer that question.'
        setGriffinEyeTags(null)
        setGriffinEyeTable(null)
        setGriffinEyeSummary('')
        onAnnounce(message)
      }
    },
    [clearManualFilters, isAssets, onAnnounce],
  )

  function clearGriffinEye() {
    setGriffinEyeTags(null)
    setGriffinEyeTable(null)
    setGriffinEyeSummary('')
  }

  useEffect(() => {
    if (!isAssets || !initialGriffinEyeQuery) return
    if (handledInitialQuery.current === initialGriffinEyeQuery) return
    handledInitialQuery.current = initialGriffinEyeQuery
    void runGriffinEyeQuery(initialGriffinEyeQuery)
    onInitialGriffinEyeQueryHandled?.()
  }, [initialGriffinEyeQuery, isAssets, runGriffinEyeQuery, onInitialGriffinEyeQueryHandled])

  const filtered = useMemo(() => {
    if (griffinEyeTags && isAssets) {
      const tags = new Set(griffinEyeTags)
      return rows.filter((row) => tags.has(String(row.data.asset_tag ?? row.id)))
    }

    return rows.filter((row) => {
      const haystack = getSearchableText(row.data, fields)
      const matchesQuery = !query || haystack.includes(query.toLowerCase())

      const matchesFilters = filterFields.every((field) => {
        const value = filterValues[field.key]
        if (!value) return true
        return String(row.data[field.key] ?? '') === value
      })

      const statusKey = statusField?.key ?? 'status'
      const matchesStatus =
        !statusFilter || statusFilter === 'total' || String(row.data[statusKey] ?? '') === statusFilter

      return matchesQuery && matchesFilters && matchesStatus
    })
  }, [rows, fields, query, filterValues, filterFields, statusFilter, statusField, griffinEyeTags, isAssets])

  const metrics = useMemo(() => {
    if (!statusField) {
      return [
        { id: 'total', label: `Total ${group?.name?.toLowerCase() ?? 'records'}`, value: String(rows.length), icon: GroupIcon, tone: 'coral-icon' },
      ]
    }

    const statusKey = statusField.key
    const choices = fieldChoices(statusField)
    const statusCounts = choices.map((status) => ({
      id: status,
      label: status,
      value: String(rows.filter((r) => String(r.data[statusKey] ?? '') === status).length),
      icon: status === 'In maintenance' || status === 'Overdue' ? Wrench : Package,
      tone: status === 'Retired' || status === 'Complete' ? 'green-icon' : status.includes('maintenance') || status === 'Overdue' ? 'amber-icon' : 'blue-icon',
    }))

    return [
      { id: 'total', label: `Total ${group?.name?.toLowerCase() ?? 'records'}`, value: String(rows.length), icon: GroupIcon, tone: 'coral-icon' },
      ...statusCounts.slice(0, 3),
    ]
  }, [rows, statusField, group?.name, GroupIcon])

  function toggleMetric(id: string) {
    if (id === 'total') {
      setStatusFilter('')
      return
    }
    setStatusFilter((current) => (current === id ? '' : id))
  }

  const drawerFields = fields.filter((f) => f.type !== 'json' || f.key === 'it_details')

  if (loading) {
    return (
      <div className="workspace-screen">
        <EmptyState title="Loading group…" description="Fetching field configuration and records." />
      </div>
    )
  }

  if (loadError || !group) {
    return (
      <div className="workspace-screen">
        <EmptyState title="Couldn’t load this group" description={loadError || 'Group not found.'} />
      </div>
    )
  }

  const title = group.name
  const description = GROUP_DESCRIPTIONS[slug] ?? `Manage ${group.name.toLowerCase()} records in your workspace.`

  return (
    <div className="workspace-screen">
      {detail && isAssets ? (
        <AssetDetailView
          record={detail}
          fields={fields}
          actionTypes={actionTypes}
          onClose={() => setDetail(null)}
          onUpdated={(updated) => {
            setDetail(updated)
            setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)))
            invalidateGroupPage(slug)
          }}
          onDelete={() => void (async () => {
            if (!window.confirm('Delete this record?')) return
            const response = await fetch(`/api/groups/${slug}/records/${detail.id}`, { method: 'DELETE' })
            const payload = (await response.json()) as { error?: string }
            if (!response.ok) { onAnnounce(payload.error ?? 'Could not delete record.'); return }
            setRows((current) => current.filter((row) => row.id !== detail.id))
            invalidateGroupPage(slug)
            setDetail(null)
            onAnnounce('Record deleted.')
          })()}
          onAnnounce={onAnnounce}
        />
      ) : (
      <>
      <PageHeader
        icon={GroupIcon}
        eyebrow={group.name.toUpperCase()}
        title={title}
        description={description}
        addLabel={isAssets ? 'Add asset' : `Add ${group.name.toLowerCase().replace(/s$/, '')}`}
        onAdd={() => (isAssets ? openCapture('choose') : (setEditingRecord(null), setShowRecordForm(true)))}
        onExport={() => onAnnounce(`Exported ${filtered.length} records.`)}
        extraActions={
          isAssets ? (
            <button className="button secondary" onClick={() => openCapture('scan')}><QrCode size={16} /> Scan asset</button>
          ) : undefined
        }
      />

      {isAssets && (
        <span className="scan-info-line"><Smartphone size={14} /> Assets can be scanned from any phone camera — no dedicated mobile app required.</span>
      )}

      {isAssets && <GriffinEyeSearchBar onSubmit={runGriffinEyeQuery} />}

      <MetricStrip metrics={metrics} activeId={statusFilter || 'total'} onSelect={toggleMetric} />

      <Panel
        title={`${group.name} directory`}
        description={`Search, filter, and take action on every record.`}
        action={<div className="list-tools"><span className="filter-button" style={{ pointerEvents: 'none' }}>{filtered.length} results</span></div>}
      >
        {griffinEyeTags && isAssets && (
          <div className="griffin-eye-result-banner">
            <span><GriffinEyeIcon size={12} className="griffin-eye-inline-icon" />{griffinEyeSummary}</span>
            <button className="griffin-eye-clear" onClick={clearGriffinEye}>Clear GriffinEye filter</button>
          </div>
        )}
        {griffinEyeTable && isAssets && (
          <div className="griffin-eye-answer-block">
            <GriffinEyeResultTable
              table={griffinEyeTable}
              onOpenRecord={(ref) => {
                const row = findRecordByRef(rows, ref)
                if (row) openRecordDetail(row)
              }}
            />
          </div>
        )}

        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder={`Search ${group.name.toLowerCase()}…`}
          filters={filterFields.map((field) => ({
            label: field.label,
            options: fieldChoices(field).length
              ? fieldChoices(field)
              : Array.from(new Set(rows.map((r) => String(r.data[field.key] ?? '')).filter(Boolean))),
            value: filterValues[field.key] ?? '',
            onChange: (value) => setFilterValues((current) => ({ ...current, [field.key]: value })),
          }))}
          onAnnounce={onAnnounce}
        />

        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} records.`) },
            { label: 'Reassign', onClick: () => onAnnounce(`Reassign flow opened for ${selected.size} records.`) },
          ]}
        />

        <DataTable<WorkspaceRecordRow>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((r) => r.id)) : new Set())}
          onRowClick={openRecordDetail}
          emptyState={
            griffinEyeTable && isAssets
              ? <EmptyState title="GriffinEye answered above" description="That question returned a summary rather than individual records." ctaLabel="Clear GriffinEye answer" onCta={clearGriffinEye} />
              : <EmptyState title="No records match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { clearManualFilters(); clearGriffinEye() }} />
          }
          columns={[
            ...tableFields.map((field) => ({
              key: field.key,
              header: field.label,
              mono: field.key === 'asset_tag' || field.key === 'serial' || field.key === 'asset_id',
              render: (row: WorkspaceRecordRow) => field.type === 'status'
                ? <StatusBadge status={String(row.data[field.key] ?? '')} />
                : field.key === 'name'
                  ? <strong>{formatFieldValue(field, row.data[field.key])}</strong>
                  : renderFieldValue(field, row.data[field.key]),
              sortValue: (row: WorkspaceRecordRow) => String(row.data[field.key] ?? ''),
            })),
            {
              key: '_view',
              header: '',
              render: (row: WorkspaceRecordRow) => (
                <button
                  type="button"
                  className="text-button row-view-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    openRecordDetail(row)
                  }}
                >
                  View
                </button>
              ),
            },
          ]}
        />
      </Panel>
      </>
      )}

      {detail && !isAssets && (
        <DetailDrawer
          title={recordDisplayLabel(fields, detail.data, detail.id)}
          subtitle={recordDisplaySubtitle(fields, detail.data, detail.id)}
          badge={
            statusField && detail.data[statusField.key]
              ? <StatusBadge status={String(detail.data[statusField.key])} />
              : undefined
          }
          onClose={() => setDetail(null)}
          actions={
            <>
              <button className="button secondary small" onClick={() => { setEditingRecord(detail); setShowRecordForm(true) }}>Edit</button>
              <button className="button secondary small" onClick={() => void (async () => {
                if (!window.confirm('Delete this record?')) return
                const response = await fetch(`/api/groups/${slug}/records/${detail.id}`, { method: 'DELETE' })
                const payload = (await response.json()) as { error?: string }
                if (!response.ok) { onAnnounce(payload.error ?? 'Could not delete record.'); return }
                setRows((current) => current.filter((row) => row.id !== detail.id))
                invalidateGroupPage(slug)
                setDetail(null)
                onAnnounce('Record deleted.')
              })()}>Delete</button>
            </>
          }
        >
          <DrawerSection title="Record details">
            <FieldGrid
              fields={drawerFields
                .filter((f) => f.type !== 'json')
                .map((field) => ({
                  label: field.label,
                  value: renderFieldValue(field, detail.data[field.key]),
                }))}
            />
          </DrawerSection>

          <RecordActionsPanel
            slug={slug}
            record={detail}
            fields={fields}
            actionTypes={actionTypes}
            onPerformed={(updated) => {
              setDetail(updated)
              setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)))
              invalidateGroupPage(slug)
            }}
            onAnnounce={onAnnounce}
          />
        </DetailDrawer>
      )}

      {showRecordForm && group && !isAssets && (
        <RecordFormDrawer
          slug={slug}
          fields={fields}
          record={editingRecord}
          onClose={() => { setShowRecordForm(false); setEditingRecord(null) }}
          onSaved={(saved) => {
            setRows((current) => {
              const index = current.findIndex((row) => row.id === saved.id)
              if (index >= 0) {
                const next = [...current]
                next[index] = saved
                return next
              }
              return [saved, ...current]
            })
            invalidateGroupPage(slug)
            setDetail(saved)
          }}
          onAnnounce={onAnnounce}
        />
      )}

      {isAssets && showCapture && (
        <AssetCaptureModal
          assets={assetRows}
          initialMode={captureMode}
          onClose={() => setShowCapture(false)}
          onScanFound={(asset) => {
            setShowCapture(false)
            const row = rows.find((r) => String(r.data.asset_tag ?? r.id) === asset.id)
            if (row) setDetail(row)
            onAnnounce(`Scanned ${asset.name} · ${asset.id}`)
          }}
          onPhotoComplete={async (draft) => {
            const created = await saveIntakeAsset(draft)
            invalidateGroupPage('assets')
            const recordsRes = await fetch('/api/groups/assets')
            const recordsPayload = (await recordsRes.json()) as {
              group?: DbGroup
              fields?: DbField[]
              records?: WorkspaceRecordRow[]
              error?: string
            }
            if (!recordsRes.ok) {
              onAnnounce(recordsPayload.error ?? 'Asset saved, but the list could not be refreshed.')
              setShowCapture(false)
              return
            }
            const refreshed = recordsPayload.records ?? []
            setRows(refreshed)
            if (recordsPayload.group) {
              setCachedGroupPage('assets', {
                group: recordsPayload.group,
                fields: recordsPayload.fields ?? fields,
                records: refreshed,
              })
            }
            const savedRow =
              refreshed.find((row) => String(row.data.asset_tag ?? '') === created.id) ?? refreshed[0]
            setShowCapture(false)
            if (savedRow) setDetail(savedRow)
            onAnnounce(`GriffinEye saved ${created.name} (${created.id}) — review the record anytime.`)
          }}
          onOpenSpreadsheetImport={() => {
            setShowCapture(false)
            onOpenSpreadsheetImport?.()
          }}
        />
      )}
    </div>
  )
}
