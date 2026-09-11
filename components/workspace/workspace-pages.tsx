'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Filter,
  Home,
  Package,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import {
  BulkActionBar,
  DataTable,
  DetailDrawer,
  DrawerSection,
  EmptyState,
  FieldGrid,
  HistoryList,
  LifecycleStepper,
  MetricStrip,
  Panel,
  QRCodePlaceholder,
  StatusBadge,
} from './primitives'
import {
  type AssetRecord,
  type AuditRecord,
  type InspectionRecord,
  type LocationRecord,
  type MaintenanceRecord,
  type PersonRecord,
  type ReportRecord,
  assets,
  audits,
  checklistTemplates,
  getLifecycleHistory,
  inspections,
  itCategories,
  lifecycleStageOrder,
  locations,
  maintenance,
  people,
  reports,
} from '@/lib/workspace-data'

type Announce = (message: string) => void

function PageHeader({ icon: Icon, eyebrow, title, description, onAdd, addLabel, onExport, extraActions }: { icon: React.ComponentType<{ size?: number }>; eyebrow: string; title: string; description: string; onAdd: () => void; addLabel: string; onExport: () => void; extraActions?: React.ReactNode }) {
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

function ScanAssetModal({ onFound }: { onFound: (asset: AssetRecord) => void }) {
  const [phase, setPhase] = useState<'scanning' | 'found'>('scanning')
  const [foundAsset, setFoundAsset] = useState<AssetRecord | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const asset = assets[Math.floor(Math.random() * assets.length)]
      setFoundAsset(asset)
      setPhase('found')
      window.setTimeout(() => onFound(asset), 700)
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [onFound])

  return (
    <div className="scan-modal-body">
      <div className="scan-viewfinder">
        <span className="scan-corner tl" /><span className="scan-corner tr" /><span className="scan-corner bl" /><span className="scan-corner br" />
        {phase === 'scanning' ? <ScanLine size={44} strokeWidth={1.3} /> : <CheckCircle2 size={44} color="#1E7B34" strokeWidth={1.3} />}
      </div>
      <div className="scan-status">
        {phase === 'scanning' ? (
          <>
            <strong><span className="scan-pulse" />Scanning for barcode or QR code...</strong>
            Point any phone camera at the asset label.
          </>
        ) : (
          <>
            <strong>Match found</strong>
            {foundAsset?.name} · {foundAsset?.id}
          </>
        )}
      </div>
    </div>
  )
}

function CompassBar({ onSubmit }: { onSubmit: (query: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <form
      className="compass-bar"
      onSubmit={(e) => {
        e.preventDefault()
        if (value.trim()) onSubmit(value.trim())
      }}
    >
      <Compass size={16} strokeWidth={2} />
      <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ask Compass… e.g. laptops checked out to Marketing over 2 years old" />
      <button type="submit" className="button dark small">Ask</button>
    </form>
  )
}

function Toolbar({ query, onQuery, placeholder, filters, onAnnounce }: { query: string; onQuery: (value: string) => void; placeholder: string; filters: { label: string; options: string[]; value: string; onChange: (value: string) => void }[]; onAnnounce: Announce }) {
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

// ---------- Assets ----------
export function AssetsPage({ onAnnounce, scanTrigger }: { onAnnounce: Announce; scanTrigger?: number }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [lifecycleFilter, setLifecycleFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<AssetRecord | null>(null)
  const [showScan, setShowScan] = useState(false)
  const [compassResults, setCompassResults] = useState<AssetRecord[] | null>(null)
  const [compassLabel, setCompassLabel] = useState('')

  useEffect(() => {
    if (scanTrigger) setShowScan(true)
  }, [scanTrigger])

  const filtered = useMemo(() => {
    if (compassResults) return compassResults
    return assets.filter((asset) => {
      const matchesQuery = `${asset.name} ${asset.id} ${asset.assignedTo}`.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = !category || asset.category === category
      const matchesLocation = !locationFilter || asset.location === locationFilter
      const matchesStatus = !statusFilter || asset.status === statusFilter
      const matchesLifecycle = !lifecycleFilter || asset.lifecycleStage === lifecycleFilter
      return matchesQuery && matchesCategory && matchesLocation && matchesStatus && matchesLifecycle
    })
  }, [query, category, locationFilter, statusFilter, lifecycleFilter, compassResults])

  const nearingEndOfLife = assets.filter((a) => a.warrantyExpiration < 'Jan 1, 2025' || a.status === 'In maintenance')

  const metrics = [
    { id: 'total', label: 'Total assets', value: String(assets.length), icon: Boxes, tone: 'coral-icon' },
    { id: 'In use', label: 'In use', value: String(assets.filter((a) => a.status === 'In use').length), icon: Package, tone: 'blue-icon' },
    { id: 'In maintenance', label: 'In maintenance', value: String(assets.filter((a) => a.status === 'In maintenance').length), icon: Wrench, tone: 'amber-icon' },
    { id: 'Retired', label: 'Retired', value: String(assets.filter((a) => a.status === 'Retired').length), icon: ShieldCheck, tone: 'green-icon' },
  ]

  function toggleMetric(id: string) {
    setStatusFilter((current) => (current === id ? '' : ['total', 'total'].includes(id) ? '' : id === 'total' ? '' : id))
  }

  function runCompassQuery(question: string) {
    const results = assets.filter((a) => a.category === 'Computers' && a.purchaseDate < 'Jan 1, 2024')
    setCompassResults(results)
    setCompassLabel(question)
    onAnnounce(`Compass found ${results.length} assets matching “${question}.”`)
  }

  return (
    <div className="workspace-screen">
      <PageHeader
        icon={Boxes}
        eyebrow="ASSET DIRECTORY"
        title="Assets"
        description="Everything your company owns, in one accountable view."
        addLabel="Add asset"
        onAdd={() => onAnnounce('Asset creation form opened.')}
        onExport={() => onAnnounce(`Exported ${filtered.length} assets.`)}
        extraActions={<button className="button secondary" onClick={() => setShowScan(true)}><QrCode size={16} /> Scan asset</button>}
      />
      <span className="scan-info-line"><Smartphone size={14} /> Assets can be scanned from any phone camera — no dedicated mobile app required.</span>
      <CompassBar onSubmit={runCompassQuery} />
      <MetricStrip metrics={metrics} activeId={statusFilter || 'total'} onSelect={toggleMetric} />
      <Panel title="Assets nearing end of life" description={`${nearingEndOfLife.length} assets are out of warranty or currently in maintenance`}>
        <div className="mini-insight-list">
          {nearingEndOfLife.slice(0, 3).map((asset) => (
            <div key={asset.id} className="mini-insight-row">
              <span className="mono">{asset.id}</span>
              <strong>{asset.name}</strong>
              <span>Warranty expired {asset.warrantyExpiration}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="Asset directory"
        description="Search, filter, and take action on every asset."
        action={<div className="list-tools"><span className="filter-button" style={{ pointerEvents: 'none' }}>{filtered.length} results</span></div>}
      >
        {compassResults && (
          <div className="compass-result-banner">
            <span><Compass size={12} style={{ verticalAlign: '-2px', marginRight: 6 }} />Showing Compass results for “{compassLabel}”</span>
            <button className="compass-clear" onClick={() => { setCompassResults(null); setCompassLabel('') }}>Clear Compass filter</button>
          </div>
        )}
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search assets, tags, or people..."
          filters={[
            { label: 'Category', options: Array.from(new Set(assets.map((a) => a.category))), value: category, onChange: setCategory },
            { label: 'Location', options: Array.from(new Set(assets.map((a) => a.location))), value: locationFilter, onChange: setLocationFilter },
            { label: 'Status', options: Array.from(new Set(assets.map((a) => a.status))), value: statusFilter, onChange: setStatusFilter },
            { label: 'Lifecycle stage', options: lifecycleStageOrder, value: lifecycleFilter, onChange: setLifecycleFilter },
          ]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} assets.`) },
            { label: 'Reassign', onClick: () => onAnnounce(`Reassign flow opened for ${selected.size} assets.`) },
            { label: 'Mark for maintenance', onClick: () => onAnnounce(`${selected.size} assets flagged for maintenance.`) },
          ]}
        />
        <DataTable<AssetRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((a) => a.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No assets match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setCategory(''); setLocationFilter(''); setStatusFilter(''); setLifecycleFilter(''); setCompassResults(null) }} />}
          columns={[
            { key: 'id', header: 'Asset ID', mono: true, render: (a) => a.id, sortValue: (a) => a.id },
            { key: 'name', header: 'Name', render: (a) => <strong>{a.name}</strong>, sortValue: (a) => a.name },
            { key: 'category', header: 'Category', render: (a) => a.category, sortValue: (a) => a.category },
            { key: 'assignedTo', header: 'Assigned to', render: (a) => a.assignedTo, sortValue: (a) => a.assignedTo },
            { key: 'location', header: 'Location', render: (a) => a.location, sortValue: (a) => a.location },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} />, sortValue: (a) => a.status },
            { key: 'purchaseDate', header: 'Purchase date', render: (a) => a.purchaseDate, sortValue: (a) => a.purchaseDate },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.name} subtitle={`${detail.id} · ${detail.category}`} badge={<StatusBadge status={detail.status} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Identification">
            <div className="identification-row">
              <QRCodePlaceholder seed={detail.id} size={68} />
              <div className="identification-copy">
                <div className="field-item"><span>Asset ID</span><strong className="mono">{detail.id}</strong></div>
                <div className="field-item"><span>Serial number</span><strong className="mono">{detail.serial}</strong></div>
              </div>
              <button className="button secondary small" onClick={() => onAnnounce(`Label queued for printing · ${detail.id}`)}><Printer size={14} /> Print label</button>
            </div>
          </DrawerSection>
          <DrawerSection title="Lifecycle stage">
            <LifecycleStepper stages={lifecycleStageOrder} current={detail.lifecycleStage} dates={detail.lifecycleDates} />
          </DrawerSection>
          <DrawerSection title="Record details">
            <FieldGrid fields={[
              { label: 'Assigned to', value: detail.assignedTo },
              { label: 'Location', value: detail.location },
              { label: 'Purchase date', value: detail.purchaseDate },
              { label: 'Warranty expiration', value: detail.warrantyExpiration },
              { label: 'Depreciation value', value: detail.depreciationValue },
            ]} />
          </DrawerSection>
          {detail.itDetails && (
            <DrawerSection title="IT details">
              <FieldGrid fields={[
                { label: 'Operating system', value: detail.itDetails.os },
                { label: 'MDM enrollment', value: <StatusBadge status={detail.itDetails.mdmStatus} /> },
                { label: 'Warranty / support plan', value: detail.itDetails.warrantyPlan },
                { label: 'Plan expiration', value: detail.itDetails.warrantyPlanExpiration },
                { label: 'Software licenses', value: detail.itDetails.licenses.length ? detail.itDetails.licenses.join(', ') : 'None assigned' },
              ]} />
            </DrawerSection>
          )}
          <DrawerSection title="Custom fields">
            <FieldGrid fields={[
              { label: 'Cost center', value: 'CC-4021 · Operations' },
              { label: 'Insured', value: 'Yes' },
            ]} />
          </DrawerSection>
          <DrawerSection title="Activity history">
            <HistoryList items={[
              { who: 'Jamie Smith', what: 'Status updated', when: 'Sep 5, 2026' },
              { who: detail.assignedTo, what: 'Checked out', when: detail.purchaseDate },
              { who: 'Compass', what: 'Record created', when: detail.purchaseDate },
            ]} />
          </DrawerSection>
          <DrawerSection title="Attachments">
            <EmptyState title="No attachments yet" description="Photos, receipts, and warranty documents will appear here." />
          </DrawerSection>
        </DetailDrawer>
      )}
      {showScan && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setShowScan(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="scan-modal-title">
            <div className="modal-header">
              <div><span className="eyebrow">SCAN ASSET</span><h2 id="scan-modal-title">Point your camera at a label</h2></div>
              <button className="close-button" onClick={() => setShowScan(false)} aria-label="Close scan dialog"><X size={18} /></button>
            </div>
            <ScanAssetModal onFound={(asset) => { setShowScan(false); setDetail(asset); onAnnounce(`Scanned ${asset.name} · ${asset.id}`) }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- People & teams ----------
export function PeoplePage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [team, setTeam] = useState('')
  const [role, setRole] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<PersonRecord | null>(null)

  const filtered = useMemo(() => people.filter((person) => {
    const matchesQuery = `${person.name} ${person.team} ${person.role}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!team || person.team === team) && (!role || person.role === role)
  }), [query, team, role])

  const overdue = people.filter((p) => p.status === 'Overdue')

  const metrics = [
    { id: 'total', label: 'Total people', value: String(people.length), icon: Users, tone: 'coral-icon' },
    { id: 'assignments', label: 'Active assignments', value: String(people.reduce((sum, p) => sum + p.assetsAssigned.length, 0)), icon: Package, tone: 'blue-icon' },
    { id: 'teams', label: 'Teams', value: String(new Set(people.map((p) => p.team)).size), icon: Building2, tone: 'green-icon' },
    { id: 'Overdue', label: 'Pending returns', value: String(overdue.length), icon: CalendarClock, tone: 'amber-icon' },
  ]

  return (
    <div className="workspace-screen">
      <PageHeader icon={Users} eyebrow="PEOPLE DIRECTORY" title="People & teams" description="See who has what, where they work, and what needs to come back." addLabel="Add person" onAdd={() => onAnnounce('Add person form opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} people.`)} />
      <MetricStrip metrics={metrics} />
      <Panel title="People with overdue check-ins" description={`${overdue.length} people have assets past their expected return window`}>
        <div className="mini-insight-list">
          {overdue.map((person) => (
            <div key={person.id} className="mini-insight-row">
              <strong>{person.name}</strong>
              <span>{person.assetsAssigned.length} assets · Last activity {person.lastCheckOut}</span>
            </div>
          ))}
          {overdue.length === 0 && <span className="table-muted">No overdue check-ins right now.</span>}
        </div>
      </Panel>
      <Panel title="People directory" description="Search, filter, and manage every person in your workspace.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search people, teams, roles..."
          filters={[
            { label: 'Team', options: Array.from(new Set(people.map((p) => p.team))), value: team, onChange: setTeam },
            { label: 'Role', options: Array.from(new Set(people.map((p) => p.role))), value: role, onChange: setRole },
          ]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          actions={[
            { label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} people.`) },
            { label: 'Send reminder', onClick: () => onAnnounce(`Reminder sent to ${selected.size} people.`) },
          ]}
        />
        <DataTable<PersonRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((p) => p.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No people match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setTeam(''); setRole('') }} />}
          columns={[
            { key: 'name', header: 'Name', render: (p) => <strong>{p.name}</strong>, sortValue: (p) => p.name },
            { key: 'team', header: 'Team', render: (p) => p.team, sortValue: (p) => p.team },
            { key: 'role', header: 'Role', render: (p) => p.role, sortValue: (p) => p.role },
            { key: 'assets', header: 'Assets assigned', render: (p) => p.assetsAssigned.length, sortValue: (p) => p.assetsAssigned.length },
            { key: 'lastCheckOut', header: 'Last check-out', render: (p) => p.lastCheckOut, sortValue: (p) => p.lastCheckOut },
            { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} />, sortValue: (p) => p.status },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.name} subtitle={`${detail.role} · ${detail.department}`} badge={<StatusBadge status={detail.status} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Contact">
            <FieldGrid fields={[
              { label: 'Email', value: detail.email },
              { label: 'Phone', value: detail.phone },
              { label: 'Team', value: detail.team },
              { label: 'Department', value: detail.department },
            ]} />
          </DrawerSection>
          <DrawerSection title="Assigned assets">
            {detail.assetsAssigned.length === 0 ? (
              <EmptyState title="No assets assigned" description="This person doesn't currently have any checked-out assets." />
            ) : (
              <div className="mini-insight-list">
                {detail.assetsAssigned.map((assetId) => {
                  const asset = assets.find((a) => a.id === assetId)
                  return asset ? (
                    <div key={assetId} className="mini-insight-row">
                      <span className="mono">{asset.id}</span>
                      <strong>{asset.name}</strong>
                      <span>{asset.location}</span>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </DrawerSection>
          <DrawerSection title="Activity history">
            <HistoryList items={[
              { who: detail.name, what: 'Checked out asset', when: detail.lastCheckOut },
              { who: 'Jamie Smith', what: 'Added to workspace', when: 'Jan 2024' },
            ]} />
          </DrawerSection>
        </DetailDrawer>
      )}
    </div>
  )
}

// ---------- Locations ----------
export function LocationsPage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<LocationRecord | null>(null)

  const countFor = (locationName: string) => assets.filter((a) => a.location === locationName).length
  const filtered = useMemo(() => locations.filter((loc) => `${loc.name} ${loc.type}`.toLowerCase().includes(query.toLowerCase()) && (!type || loc.type === type)), [query, type])
  const overdueAudit = locations.filter((loc) => loc.lastAudit < 'Jul 1, 2026')
  const topLocation = [...locations].sort((a, b) => countFor(b.name) - countFor(a.name))[0]

  const metrics = [
    { id: 'total', label: 'Total locations', value: String(locations.length), icon: Home, tone: 'coral-icon' },
    { id: 'top', label: 'Top by asset count', value: topLocation.name, icon: TrendingUp, tone: 'blue-icon' },
    { id: 'audit', label: 'Sites needing audit', value: String(overdueAudit.length), icon: AlertTriangle, tone: 'amber-icon' },
  ]

  return (
    <div className="workspace-screen">
      <PageHeader icon={Home} eyebrow="LOCATIONS" title="Locations" description="Keep every office, site, vehicle, and storage room accounted for." addLabel="Add location" onAdd={() => onAnnounce('Add location form opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} locations.`)} />
      <MetricStrip metrics={metrics} />
      <Panel title="Locations overdue for audit" description={`${overdueAudit.length} locations haven't been audited in over 60 days`}>
        <div className="mini-insight-list">
          {overdueAudit.map((loc) => (
            <div key={loc.id} className="mini-insight-row">
              <strong>{loc.name}</strong>
              <span>Last audited {loc.lastAudit}</span>
            </div>
          ))}
          {overdueAudit.length === 0 && <span className="table-muted">All locations are current on audits.</span>}
        </div>
      </Panel>
      <Panel title="Location directory" description="Search, filter, and manage every location in your workspace.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search locations..."
          filters={[{ label: 'Type', options: Array.from(new Set(locations.map((l) => l.type))), value: type, onChange: setType }]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={[{ label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} locations.`) }]} />
        <DataTable<LocationRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((l) => l.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No locations match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setType('') }} />}
          columns={[
            { key: 'name', header: 'Location name', render: (l) => <strong>{l.name}</strong>, sortValue: (l) => l.name },
            { key: 'type', header: 'Type', render: (l) => l.type, sortValue: (l) => l.type },
            { key: 'assetCount', header: 'Asset count', render: (l) => countFor(l.name), sortValue: (l) => countFor(l.name) },
            { key: 'manager', header: 'Manager', render: (l) => l.manager, sortValue: (l) => l.manager },
            { key: 'lastAudit', header: 'Last audit date', render: (l) => l.lastAudit, sortValue: (l) => l.lastAudit },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.name} subtitle={detail.address} badge={<StatusBadge status={countFor(detail.name) > 0 ? 'In use' : 'Available'} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Overview">
            <FieldGrid fields={[
              { label: 'Type', value: detail.type },
              { label: 'Manager', value: detail.manager },
              { label: 'Address', value: detail.address },
              { label: 'Last audit', value: detail.lastAudit },
            ]} />
          </DrawerSection>
          <DrawerSection title="Asset breakdown by category">
            <div className="mini-insight-list">
              {Array.from(new Set(assets.filter((a) => a.location === detail.name).map((a) => a.category))).map((cat) => (
                <div key={cat} className="mini-insight-row">
                  <strong>{cat}</strong>
                  <span>{assets.filter((a) => a.location === detail.name && a.category === cat).length} assets</span>
                </div>
              ))}
              {assets.filter((a) => a.location === detail.name).length === 0 && <span className="table-muted">No assets currently assigned here.</span>}
            </div>
          </DrawerSection>
          <DrawerSection title="Audit history">
            <HistoryList items={[{ who: detail.manager, what: 'Completed physical audit', when: detail.lastAudit }]} />
          </DrawerSection>
        </DetailDrawer>
      )}
    </div>
  )
}

// ---------- Maintenance ----------
export function MaintenancePage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('')
  const [status, setStatus] = useState('')
  const [technician, setTechnician] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<MaintenanceRecord | null>(null)

  const filtered = useMemo(() => maintenance.filter((wo) => {
    const matchesQuery = `${wo.asset} ${wo.issueType} ${wo.technician}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!priority || wo.priority === priority) && (!status || wo.status === status) && (!technician || wo.technician === technician)
  }), [query, priority, status, technician])

  const overdue = maintenance.filter((wo) => wo.status === 'Overdue')
  const scheduledThisWeek = maintenance.filter((wo) => wo.status === 'Scheduled')
  const resolved = maintenance.filter((wo) => wo.status === 'Resolved')

  const metrics = [
    { id: 'open', label: 'Open work orders', value: String(maintenance.filter((w) => w.status === 'Open').length), icon: Wrench, tone: 'blue-icon' },
    { id: 'Overdue', label: 'Overdue', value: String(overdue.length), icon: AlertTriangle, tone: 'amber-icon' },
    { id: 'Scheduled', label: 'Scheduled this week', value: String(scheduledThisWeek.length), icon: CalendarClock, tone: 'green-icon' },
    { id: 'resolution', label: 'Avg resolution time', value: '3.4 days', icon: CheckCircle2, tone: 'coral-icon' },
  ]

  return (
    <div className="workspace-screen">
      <PageHeader icon={Wrench} eyebrow="MAINTENANCE QUEUE" title="Maintenance" description="Schedule service before small issues become expensive downtime." addLabel="Create work order" onAdd={() => onAnnounce('Work order form opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} work orders.`)} />
      <MetricStrip metrics={metrics} activeId={status} onSelect={(id) => setStatus((current) => (current === id ? '' : ['open', 'resolution'].includes(id) ? '' : id))} />
      <Panel title="Upcoming preventive maintenance" description={`${scheduledThisWeek.length} scheduled work orders in the next 7 days`}>
        <div className="mini-insight-list">
          {scheduledThisWeek.map((wo) => (
            <div key={wo.id} className="mini-insight-row">
              <strong>{wo.asset}</strong>
              <span>{wo.issueType} · Due {wo.dueDate}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Maintenance directory" description="Search, filter, and manage every work order.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search work orders..."
          filters={[
            { label: 'Priority', options: Array.from(new Set(maintenance.map((m) => m.priority))), value: priority, onChange: setPriority },
            { label: 'Status', options: Array.from(new Set(maintenance.map((m) => m.status))), value: status, onChange: setStatus },
            { label: 'Technician', options: Array.from(new Set(maintenance.map((m) => m.technician))), value: technician, onChange: setTechnician },
          ]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={[{ label: 'Mark resolved', onClick: () => onAnnounce(`${selected.size} work orders marked resolved.`) }, { label: 'Reassign technician', onClick: () => onAnnounce(`Reassign flow opened for ${selected.size} work orders.`) }]} />
        <DataTable<MaintenanceRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((m) => m.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No work orders match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setPriority(''); setStatus(''); setTechnician('') }} />}
          columns={[
            { key: 'asset', header: 'Asset', render: (m) => <strong>{m.asset}</strong>, sortValue: (m) => m.asset },
            { key: 'issueType', header: 'Issue type', render: (m) => m.issueType, sortValue: (m) => m.issueType },
            { key: 'priority', header: 'Priority', render: (m) => <StatusBadge status={m.priority} />, sortValue: (m) => m.priority },
            { key: 'technician', header: 'Technician', render: (m) => m.technician, sortValue: (m) => m.technician },
            { key: 'dueDate', header: 'Due date', render: (m) => m.dueDate, sortValue: (m) => m.dueDate },
            { key: 'status', header: 'Status', render: (m) => <StatusBadge status={m.status} />, sortValue: (m) => m.status },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.asset} subtitle={`${detail.issueType} · ${detail.id}`} badge={<StatusBadge status={detail.status} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Work order details">
            <FieldGrid fields={[
              { label: 'Priority', value: <StatusBadge status={detail.priority} /> },
              { label: 'Technician', value: detail.technician },
              { label: 'Due date', value: detail.dueDate },
              { label: 'Parts used', value: detail.partsUsed },
              { label: 'Cost', value: detail.cost },
            ]} />
          </DrawerSection>
          <DrawerSection title="Issue description">
            <p className="drawer-text">{detail.description}</p>
          </DrawerSection>
          {detail.resolutionNotes && (
            <DrawerSection title="Resolution notes">
              <p className="drawer-text">{detail.resolutionNotes}</p>
            </DrawerSection>
          )}
          <DrawerSection title="Activity history">
            <HistoryList items={[{ who: detail.technician, what: 'Work order created', when: detail.dueDate }]} />
          </DrawerSection>
        </DetailDrawer>
      )}
    </div>
  )
}

// ---------- Audits ----------
export function AuditsPage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [scope, setScope] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<AuditRecord | null>(null)

  const filtered = useMemo(() => audits.filter((a) => `${a.name} ${a.scope} ${a.auditor}`.toLowerCase().includes(query.toLowerCase()) && (!status || a.status === status) && (!scope || a.scope === scope)), [query, status, scope])
  const inProgress = audits.filter((a) => a.status === 'In progress' || a.status === 'Needs attention')
  const totalDiscrepancies = audits.reduce((sum, a) => sum + a.discrepancies.length, 0)
  const completedAudit = audits.find((a) => a.status === 'Complete')
  const avgCompletion = Math.round(audits.reduce((sum, a) => sum + (a.expected ? a.scanned / a.expected : 0), 0) / audits.length * 100)

  const metrics = [
    { id: 'progress', label: 'Audits in progress', value: String(inProgress.length), icon: ClipboardCheck, tone: 'blue-icon' },
    { id: 'completion', label: 'Completion %', value: `${avgCompletion}%`, icon: TrendingUp, tone: 'green-icon' },
    { id: 'discrepancies', label: 'Discrepancies found', value: String(totalDiscrepancies), icon: AlertTriangle, tone: 'amber-icon' },
    { id: 'lastCompleted', label: 'Last completed', value: completedAudit?.startDate ?? '—', icon: CheckCircle2, tone: 'coral-icon' },
  ]

  const allDiscrepancies = audits.flatMap((a) => a.discrepancies.map((d) => ({ ...d, audit: a.name })))

  return (
    <div className="workspace-screen">
      <PageHeader icon={ClipboardCheck} eyebrow="AUDIT PROGRAM" title="Audits" description="Verify what you own actually matches what's on the ground." addLabel="Start audit" onAdd={() => onAnnounce('New audit form opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} audits.`)} />
      <MetricStrip metrics={metrics} />
      <Panel title="Recent discrepancies" description={`${totalDiscrepancies} discrepancies flagged across active audits`}>
        <div className="mini-insight-list">
          {allDiscrepancies.slice(0, 4).map((d, i) => (
            <div key={i} className="mini-insight-row">
              <strong>{d.asset}</strong>
              <span>{d.issue} · {d.audit}</span>
            </div>
          ))}
          {allDiscrepancies.length === 0 && <span className="table-muted">No discrepancies found.</span>}
        </div>
      </Panel>
      <Panel title="Audit directory" description="Search, filter, and manage every audit campaign.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search audits..."
          filters={[
            { label: 'Status', options: Array.from(new Set(audits.map((a) => a.status))), value: status, onChange: setStatus },
            { label: 'Location', options: Array.from(new Set(audits.map((a) => a.scope))), value: scope, onChange: setScope },
          ]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={[{ label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} audits.`) }]} />
        <DataTable<AuditRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((a) => a.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No audits match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setStatus(''); setScope('') }} />}
          columns={[
            { key: 'name', header: 'Audit name', render: (a) => <strong>{a.name}</strong>, sortValue: (a) => a.name },
            { key: 'scope', header: 'Location / scope', render: (a) => a.scope, sortValue: (a) => a.scope },
            { key: 'auditor', header: 'Auditor', render: (a) => a.auditor, sortValue: (a) => a.auditor },
            { key: 'startDate', header: 'Start date', render: (a) => a.startDate, sortValue: (a) => a.startDate },
            { key: 'status', header: 'Status', render: (a) => <StatusBadge status={a.status} />, sortValue: (a) => a.status },
            { key: 'discrepancyCount', header: 'Discrepancies', render: (a) => a.discrepancies.length, sortValue: (a) => a.discrepancies.length },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.name} subtitle={`${detail.scope} · ${detail.auditor}`} badge={<StatusBadge status={detail.status} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Progress">
            <FieldGrid fields={[
              { label: 'Scanned', value: String(detail.scanned) },
              { label: 'Expected', value: String(detail.expected) },
              { label: 'Completion', value: `${detail.expected ? Math.round((detail.scanned / detail.expected) * 100) : 0}%` },
              { label: 'Start date', value: detail.startDate },
            ]} />
          </DrawerSection>
          <DrawerSection title="Discrepancy list">
            {detail.discrepancies.length === 0 ? (
              <EmptyState title="No discrepancies" description="Scanned counts match expected records exactly." />
            ) : (
              <div className="mini-insight-list">
                {detail.discrepancies.map((d, i) => (
                  <div key={i} className="mini-insight-row">
                    <strong>{d.asset}</strong>
                    <span>{d.issue}</span>
                  </div>
                ))}
              </div>
            )}
          </DrawerSection>
          <DrawerSection title="Auditor notes">
            <p className="drawer-text">{detail.notes}</p>
          </DrawerSection>
        </DetailDrawer>
      )}
    </div>
  )
}

// ---------- Reports ----------
export function ReportsPage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')
  const [preview, setPreview] = useState<ReportRecord | null>(null)

  const filtered = useMemo(() => reports.filter((r) => `${r.name} ${r.type}`.toLowerCase().includes(query.toLowerCase()) && (!type || r.type === type)), [query, type])
  const scheduled = reports.filter((r) => r.frequency !== 'On demand')

  const metrics = [
    { id: 'generated', label: 'Reports generated', value: '48', icon: ClipboardCheck, tone: 'coral-icon' },
    { id: 'scheduled', label: 'Scheduled reports', value: String(scheduled.length), icon: CalendarClock, tone: 'blue-icon' },
    { id: 'mostViewed', label: 'Most viewed', value: reports[0].name, icon: TrendingUp, tone: 'green-icon' },
  ]

  const suggested = ['Underutilized assets', 'Assets missing serial numbers', 'Upcoming warranty expirations']

  return (
    <div className="workspace-screen">
      <PageHeader icon={Activity} eyebrow="REPORTING" title="Reports" description="Turn your asset data into answers for finance, ops, and compliance." addLabel="New report" onAdd={() => onAnnounce('Report builder opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} reports.`)} />
      <MetricStrip metrics={metrics} />
      <Panel title="Suggested reports" description="Based on gaps we noticed in your current data">
        <div className="mini-insight-list">
          {suggested.map((label) => (
            <div key={label} className="mini-insight-row">
              <strong>{label}</strong>
              <button className="text-button" onClick={() => onAnnounce(`${label} report queued.`)}>Generate</button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Report library" description="Search and manage every saved and scheduled report.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search reports..."
          filters={[{ label: 'Type', options: Array.from(new Set(reports.map((r) => r.type))), value: type, onChange: setType }]}
          onAnnounce={onAnnounce}
        />
        <DataTable<ReportRecord>
          rows={filtered}
          onRowClick={setPreview}
          emptyState={<EmptyState title="No reports match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setType('') }} />}
          columns={[
            { key: 'name', header: 'Report name', render: (r) => <strong>{r.name}</strong>, sortValue: (r) => r.name },
            { key: 'type', header: 'Type', render: (r) => r.type, sortValue: (r) => r.type },
            { key: 'lastRun', header: 'Last run', render: (r) => r.lastRun, sortValue: (r) => r.lastRun },
            { key: 'frequency', header: 'Frequency', render: (r) => r.frequency, sortValue: (r) => r.frequency },
            { key: 'owner', header: 'Owner', render: (r) => r.owner, sortValue: (r) => r.owner },
          ]}
        />
      </Panel>
      {preview && (
        <DetailDrawer title={preview.name} subtitle={`${preview.type} · Owned by ${preview.owner}`} onClose={() => setPreview(null)}>
          <DrawerSection title="Summary">
            <p className="drawer-text">{preview.summary}</p>
          </DrawerSection>
          <DrawerSection title="Schedule">
            <FieldGrid fields={[
              { label: 'Frequency', value: preview.frequency },
              { label: 'Last run', value: preview.lastRun },
              { label: 'Owner', value: preview.owner },
            ]} />
          </DrawerSection>
          <button className="button primary full-width" onClick={() => onAnnounce(`${preview.name} export started.`)}><ArrowDownToLine size={16} /> Download latest run</button>
        </DetailDrawer>
      )}
    </div>
  )
}

// ---------- Inspections ----------
export function InspectionsPage({ onAnnounce }: { onAnnounce: Announce }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [templateFilter, setTemplateFilter] = useState('')
  const [inspectorFilter, setInspectorFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<InspectionRecord | null>(null)

  const templateName = (id: string) => checklistTemplates.find((t) => t.id === id)?.name ?? 'Unknown checklist'

  const filtered = useMemo(() => inspections.filter((i) => {
    const matchesQuery = `${i.asset} ${templateName(i.checklistTemplateId)} ${i.assignedInspector}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (!status || i.status === status) && (!templateFilter || templateName(i.checklistTemplateId) === templateFilter) && (!inspectorFilter || i.assignedInspector === inspectorFilter)
  }), [query, status, templateFilter, inspectorFilter])

  const dueThisWeek = inspections.filter((i) => ['Sep 9, 2026', 'Sep 10, 2026', 'Sep 12, 2026'].includes(i.dueDate))
  const overdue = inspections.filter((i) => i.status === 'Overdue')
  const failedOpen = inspections.filter((i) => i.status === 'Failed')
  const completedHistory = inspections.flatMap((i) => i.history)
  const passedCount = completedHistory.filter((h) => h.status === 'Passed').length
  const passRate = completedHistory.length ? Math.round((passedCount / completedHistory.length) * 100) : 0

  const metrics = [
    { id: 'dueWeek', label: 'Due this week', value: String(dueThisWeek.length), icon: CalendarClock, tone: 'blue-icon' },
    { id: 'Overdue', label: 'Overdue', value: String(overdue.length), icon: AlertTriangle, tone: 'amber-icon' },
    { id: 'passRate', label: 'Pass rate', value: `${passRate}%`, icon: TrendingUp, tone: 'green-icon' },
    { id: 'Failed', label: 'Failed inspections (open)', value: String(failedOpen.length), icon: XCircle, tone: 'coral-icon' },
  ]

  return (
    <div className="workspace-screen">
      <PageHeader icon={ClipboardList} eyebrow="INSPECTION PROGRAM" title="Inspections" description="Checklist-driven inspections that catch problems before they become work orders." addLabel="Schedule inspection" onAdd={() => onAnnounce('Inspection scheduling form opened.')} onExport={() => onAnnounce(`Exported ${filtered.length} inspections.`)} />
      <MetricStrip metrics={metrics} activeId={status} onSelect={(id) => setStatus((current) => (current === id ? '' : ['dueWeek', 'passRate'].includes(id) ? '' : id))} />
      <Panel title="Recently failed inspections" description={`${failedOpen.length} inspections need follow-up`}>
        <div className="mini-insight-list">
          {failedOpen.map((i) => {
            const failedItem = i.results.find((r) => !r.pass)
            return (
              <div key={i.id} className="mini-insight-row failed-inspection-row">
                <strong>{i.asset}</strong>
                <span>{failedItem?.item ?? 'Checklist item'} failed · {i.lastCompleted}</span>
                <button className="text-button mini-action" onClick={() => onAnnounce(`Maintenance ticket created for ${i.asset}.`)}>Create maintenance ticket</button>
              </div>
            )
          })}
          {failedOpen.length === 0 && <span className="table-muted">No failed inspections right now.</span>}
        </div>
      </Panel>
      <Panel title="Inspection directory" description="Search, filter, and review every scheduled and completed inspection.">
        <Toolbar
          query={query}
          onQuery={setQuery}
          placeholder="Search inspections, assets, inspectors..."
          filters={[
            { label: 'Status', options: Array.from(new Set(inspections.map((i) => i.status))), value: status, onChange: setStatus },
            { label: 'Checklist template', options: checklistTemplates.map((t) => t.name), value: templateFilter, onChange: setTemplateFilter },
            { label: 'Assigned inspector', options: Array.from(new Set(inspections.map((i) => i.assignedInspector))), value: inspectorFilter, onChange: setInspectorFilter },
          ]}
          onAnnounce={onAnnounce}
        />
        <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())} actions={[{ label: 'Export selected', onClick: () => onAnnounce(`Exported ${selected.size} inspections.`) }]} />
        <DataTable<InspectionRecord>
          rows={filtered}
          selectable
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next })}
          onToggleSelectAll={(checked) => setSelected(checked ? new Set(filtered.map((i) => i.id)) : new Set())}
          onRowClick={setDetail}
          emptyState={<EmptyState title="No inspections match your filters" description="Try adjusting your search or clearing filters." ctaLabel="Clear filters" onCta={() => { setQuery(''); setStatus(''); setTemplateFilter(''); setInspectorFilter('') }} />}
          columns={[
            { key: 'asset', header: 'Asset', render: (i) => <strong>{i.asset}</strong>, sortValue: (i) => i.asset },
            { key: 'template', header: 'Checklist template', render: (i) => templateName(i.checklistTemplateId), sortValue: (i) => templateName(i.checklistTemplateId) },
            { key: 'assignedInspector', header: 'Assigned inspector', render: (i) => i.assignedInspector, sortValue: (i) => i.assignedInspector },
            { key: 'dueDate', header: 'Due date', render: (i) => i.dueDate, sortValue: (i) => i.dueDate },
            { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} />, sortValue: (i) => i.status },
            { key: 'lastCompleted', header: 'Last completed', render: (i) => i.lastCompleted, sortValue: (i) => i.lastCompleted },
          ]}
        />
      </Panel>
      {detail && (
        <DetailDrawer title={detail.asset} subtitle={`${templateName(detail.checklistTemplateId)} · ${detail.id}`} badge={<StatusBadge status={detail.status} />} onClose={() => setDetail(null)}>
          <DrawerSection title="Checklist results">
            <ul className="history-list">
              {detail.results.map((r) => (
                <li key={r.item} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <span style={{ color: '#1F2328', fontSize: 11 }}>{r.item}</span>
                  {r.pass ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#1E7B34', fontSize: 10, fontWeight: 700 }}><Check size={13} /> Pass</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#B23B3B', fontSize: 10, fontWeight: 700 }}><XCircle size={13} /> Fail</span>}
                </li>
              ))}
            </ul>
          </DrawerSection>
          <DrawerSection title="Inspector notes">
            <p className="drawer-text">{detail.inspectorNotes}</p>
          </DrawerSection>
          <DrawerSection title="Photos">
            <EmptyState title="No photos attached" description="Inspection photos captured on-site will appear here." />
          </DrawerSection>
          <DrawerSection title="Past inspection results">
            <HistoryList items={detail.history.map((h) => ({ who: h.status, what: h.notes, when: h.date }))} />
          </DrawerSection>
        </DetailDrawer>
      )}
    </div>
  )
}
