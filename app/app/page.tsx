'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownToLine,
  BadgeDollarSign,
  Code2,
  Compass,
  CreditCard,
  KeyRound,
  Palette,
  Plug,
  SlidersHorizontal,
  UserRound,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CloudUpload,
  FileSpreadsheet,
  Filter,
  Home,
  ImagePlus,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Package,
  Plus,
  QrCode,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { AssetsPage, AuditsPage, InspectionsPage, LocationsPage, MaintenancePage, PeoplePage, ReportsPage } from '@/components/workspace/workspace-pages'
import { SettingsSection } from '@/components/workspace/settings-pages'
import { TemplateGallery } from '@/components/onboarding/template-gallery'
import { onboardingTemplates } from '@/lib/onboarding-templates'
import { applyTemplateSeed, type OnboardingTemplateId } from '@/lib/workspace-data'

const assets = [
  { name: 'MacBook Pro 14”', tag: 'NST-1048', serial: 'C02ZK1A4MD6M', owner: 'Maya Patel', location: 'New York HQ', status: 'Checked out', type: 'Laptop', tone: 'coral' },
  { name: 'Dell Latitude 5440', tag: 'NST-1047', serial: '7XK91P2', owner: 'Unassigned', location: 'Austin Depot', status: 'In stock', type: 'Laptop', tone: 'blue' },
  { name: 'Herman Miller Aeron', tag: 'NST-1041', serial: 'AER-88210', owner: 'Jordan Lee', location: 'New York HQ', status: 'Checked out', type: 'Furniture', tone: 'green' },
  { name: 'Sony FX3 Camera', tag: 'NST-1032', serial: 'SNY-220941', owner: 'Studio team', location: 'Chicago Studio', status: 'Maintenance', type: 'Equipment', tone: 'amber' },
  { name: 'iPad Pro 12.9”', tag: 'NST-1029', serial: 'DMQ9P2K3', owner: 'Unassigned', location: 'New York HQ', status: 'In stock', type: 'Tablet', tone: 'purple' },
]

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Assets', icon: Boxes, count: '1,285' },
  { label: 'People & teams', icon: Users },
  { label: 'Locations', icon: Home },
  { label: 'Maintenance', icon: Wrench, count: '8' },
  { label: 'Audits', icon: ClipboardCheck, count: '2' },
  { label: 'Inspections', icon: ClipboardList, count: '2' },
]

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Checked out': 'status-checked',
    'In stock': 'status-stock',
    Maintenance: 'status-maintenance',
  }
  return <span className={`status-pill ${styles[status] ?? ''}`}><span className="status-dot" />{status}</span>
}

export default function Page() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSettings, setActiveSettings] = useState('Profile')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Workspace: true, Tools: true, Account: true, Organization: true, Administration: true })
  const [showIntake, setShowIntake] = useState(false)
  const [showMigration, setShowMigration] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [scanTrigger, setScanTrigger] = useState(0)

  const filteredAssets = useMemo(() => assets.filter((asset) =>
    Object.values(asset).some((value) => value.toLowerCase().includes(query.toLowerCase()))
  ), [query])

  function announce(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function handleSelectTemplate(templateId: OnboardingTemplateId) {
    applyTemplateSeed(templateId)
    setShowOnboarding(false)
    setActiveNav('Overview')
    const template = onboardingTemplates.find((t) => t.id === templateId)
    announce(`${template?.title ?? 'Template'} applied — your workspace is ready.`)
  }

  if (showOnboarding) {
    return (
      <>
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onUploadClick={() => setShowMigration(true)}
          onSkip={() => { setShowOnboarding(false); announce('You can restart onboarding anytime from Settings.') }}
        />
        {showMigration && <Modal title="Import center" onClose={() => setShowMigration(false)}><MigrationModal onComplete={() => { setShowMigration(false); setShowOnboarding(false); announce('Migration preview is ready.') }} /></Modal>}
        {toast && <div className="toast"><Check size={16} />{toast}</div>}
      </>
    )
  }

  return (
    <main className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-topbar"><button className="sidebar-toggle" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={sidebarCollapsed} onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}>{sidebarCollapsed ? <PanelLeftOpen size={19} strokeWidth={1.8} /> : <PanelLeftClose size={19} strokeWidth={1.8} />}</button></div>
        <div className="brand-lockup">
          <Image src="/images/assetgriffin-logo.png" alt="AssetGriffin logo" width={29} height={29} className="brand-mark-image" />
          <div><strong>assetgriffin</strong><span>asset operations</span></div>
        </div>
        <div className="workspace-switcher">
          <div className="workspace-avatar">ST</div>
          <div><strong>Summit Tech</strong><span>Operations workspace</span></div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          <div className="nav-group">
            <button className="nav-group-toggle" aria-expanded={openGroups.Workspace} onClick={() => setOpenGroups((groups) => ({ ...groups, Workspace: !groups.Workspace }))}>
              <span className="nav-label">Workspace</span><ChevronDown className={`nav-chevron ${openGroups.Workspace ? 'is-open' : ''}`} size={15} />
            </button>
            <div className={`nav-group-items ${openGroups.Workspace ? 'is-open' : ''}`}>
              {navItems.map(({ label, icon: Icon, count }) => (
                <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
                  <Icon size={17} /><span>{label}</span>{count && <em>{count}</em>}
                </button>
              ))}
            </div>
          </div>
          <div className="nav-group tools-group">
            <button className="nav-group-toggle" aria-expanded={openGroups.Tools} onClick={() => setOpenGroups((groups) => ({ ...groups, Tools: !groups.Tools }))}>
              <span className="nav-label">Tools</span><ChevronDown className={`nav-chevron ${openGroups.Tools ? 'is-open' : ''}`} size={15} />
            </button>
            <div className={`nav-group-items ${openGroups.Tools ? 'is-open' : ''}`}>
              <button className={`nav-item ${activeNav === 'Reports' ? 'active' : ''}`} onClick={() => setActiveNav('Reports')}><Activity size={17} /><span>Reports</span></button>
              <button className={`nav-item ${activeNav === 'Migration' ? 'active' : ''}`} onClick={() => setActiveNav('Migration')}><ArrowDownToLine size={17} /><span>Import center</span><span className="new-badge">NEW</span></button>
              <button className="nav-item" onClick={() => { setActiveNav('Assets'); setScanTrigger((n) => n + 1) }}><QrCode size={17} /><span>Scan asset</span></button>
            </div>
          </div>
          <SettingsGroup title="Account" open={openGroups.Account} onToggle={() => setOpenGroups((groups) => ({ ...groups, Account: !groups.Account }))} items={[['Profile', UserRound], ['Billing', CreditCard], ['Notifications', Bell], ['Preferences', SlidersHorizontal], ['Security', ShieldCheck], ['Integrations', Plug], ['Developer', Code2]]} active={activeSettings} onSelect={(label) => { setActiveSettings(label); setActiveNav('Settings') }} />
          <SettingsGroup title="Organization" open={openGroups.Organization} onToggle={() => setOpenGroups((groups) => ({ ...groups, Organization: !groups.Organization }))} items={[['Branding', Palette], ['Spending limits', BadgeDollarSign], ['Roles & permissions', KeyRound], ['Approval groups', ClipboardCheck]]} active={activeSettings} onSelect={(label) => { setActiveSettings(label); setActiveNav('Settings') }} />
          <SettingsGroup title="Administration" open={openGroups.Administration} onToggle={() => setOpenGroups((groups) => ({ ...groups, Administration: !groups.Administration }))} items={[['Team', Users], ['Departments', Boxes], ['Workflows', Activity], ['Audit log', ClipboardCheck]]} active={activeSettings} onSelect={(label) => { setActiveSettings(label); setActiveNav('Settings') }} />
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => announce('Settings are ready for your workspace.')}><Settings2 size={17} /><span>Settings</span></button>
          <div className="upgrade-card"><div className="upgrade-icon"><Compass size={16} /></div><strong>Make your next move</strong><p>GriffinEye is ready to process your first 100 assets.</p><button onClick={() => setShowIntake(true)}>Ask GriffinEye <ArrowUpRight size={14} /></button></div>
          <div className="profile-row"><div className="profile-avatar">JS</div><div><strong>Jamie Smith</strong><span>Administrator</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setSidebarCollapsed(false)}><Menu size={20} /></button><div className="breadcrumb"><span>Summit Tech</span><span>/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications" onClick={() => announce('You have 3 new notifications.')}><Bell size={18} /><span className="notification-dot" /></button><div className="top-avatar">JS</div></div></header>
        <div className="page-content">
          {activeNav === 'Settings' ? <SettingsSection section={activeSettings} onAnnounce={announce} onNavigateSection={setActiveSettings} onStartOnboarding={() => setShowOnboarding(true)} /> : activeNav === 'Assets' ? <AssetsPage onAnnounce={announce} scanTrigger={scanTrigger} /> : activeNav === 'People & teams' ? <PeoplePage onAnnounce={announce} /> : activeNav === 'Locations' ? <LocationsPage onAnnounce={announce} /> : activeNav === 'Maintenance' ? <MaintenancePage onAnnounce={announce} /> : activeNav === 'Audits' ? <AuditsPage onAnnounce={announce} /> : activeNav === 'Inspections' ? <InspectionsPage onAnnounce={announce} /> : activeNav === 'Reports' ? <ReportsPage onAnnounce={announce} /> : activeNav === 'Migration' ? <MigrationPage onAnnounce={announce} /> : <>
          <div className="page-heading"><div className="heading-icon-row"><div className="heading-icon-badge"><LayoutDashboard size={22} /></div><div><p className="eyebrow">MONDAY, SEPTEMBER 8, 2026</p><h1>Good morning, Jamie.</h1><p className="heading-sub">Here’s what’s happening across your asset portfolio.</p></div></div><div className="heading-actions"><button className="button secondary" onClick={() => setShowMigration(true)}><Upload size={16} /> Import assets</button><button className="button primary" onClick={() => setShowIntake(true)}><Compass size={16} /> Ask GriffinEye</button></div></div>

          <div className="metric-grid">
            <div className="metric-card feature-metric"><div className="metric-top"><span className="metric-label">Total assets</span><span className="metric-icon coral-icon"><Boxes size={18} /></span></div><div className="metric-value">1,284</div><div className="metric-foot"><span className="trend-up">+12.4%</span><span>vs. last month</span><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /></div></div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">Checked out</span><span className="metric-icon blue-icon"><ArrowUpRight size={18} /></span></div><div className="metric-value">876</div><div className="metric-foot"><span>68.2% of portfolio</span><div className="progress"><i style={{ width: '68%' }} /></div></div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">Needs attention</span><span className="metric-icon amber-icon"><Bell size={18} /></span></div><div className="metric-value">24</div><div className="metric-foot"><span className="attention-text">8 maintenance · 16 overdue</span><div className="metric-link" onClick={() => setActiveNav('Maintenance')}>Review queue <ArrowUpRight size={13} /></div></div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">Audit coverage</span><span className="metric-icon green-icon"><ShieldCheck size={18} /></span></div><div className="metric-value">92.8<span className="value-unit">%</span></div><div className="metric-foot"><span>+4.8% this quarter</span><div className="progress green-progress"><i style={{ width: '93%' }} /></div></div></div>
          </div>

          <div className="workspace-grid">
            <section className="panel activity-panel"><div className="panel-header"><div><h2>Recent activity</h2><p>Latest changes across your workspace</p></div><button className="text-button" onClick={() => setActiveNav('Assets')}>View all <ArrowUpRight size={14} /></button></div><div className="activity-list"><ActivityRow icon={<ArrowUpRight size={15} />} color="blue" title="MacBook Pro 14” checked out" detail="Maya Patel · New York HQ" time="12 min ago" /><ActivityRow icon={<Wrench size={15} />} color="amber" title="Maintenance completed" detail="Sony FX3 Camera · Lens calibration" time="1 hr ago" /><ActivityRow icon={<Plus size={15} />} color="green" title="12 assets imported" detail="GriffinEye · Jamie Smith" time="Yesterday" /><ActivityRow icon={<ArrowDownToLine size={15} />} color="purple" title="Asset moved to Austin Depot" detail="Dell Latitude 5440 · NST-1047" time="Yesterday" /></div></section>
            <section className="panel attention-panel"><div className="panel-header"><div><h2>Needs attention</h2><p>Small things before they become big things</p></div><span className="attention-count">24</span></div><div className="attention-list"><AttentionRow icon={<Wrench size={16} />} title="8 maintenance due" detail="Next 14 days" /><AttentionRow icon={<CalendarClock size={16} />} title="16 overdue check-ins" detail="Action needed" critical /></div><div className="panel-footer"><button className="full-button" onClick={() => setActiveNav('Maintenance')}>Open attention queue <ArrowUpRight size={14} /></button></div></section>
          </div>

          <section className="panel assets-panel"><div className="panel-header assets-header"><div><h2>Asset directory</h2><p>Browse, search, and manage your inventory</p></div><button className="button secondary small" onClick={() => announce('Asset creation form opened.')}><Plus size={15} /> Add asset</button></div><div className="table-toolbar"><div className="search-wrap"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets, serials, people..." /></div><button className="filter-button" onClick={() => announce('Filters are ready to customize.')}><Filter size={15} /> Filters <span>2</span></button><button className="filter-button" onClick={() => announce('Export prepared.')}><ArrowDownToLine size={15} /> Export</button></div><div className="asset-table-wrap"><table className="asset-table"><thead><tr><th>Asset</th><th>Tag / serial</th><th>Assigned to</th><th>Location</th><th>Status</th><th /></tr></thead><tbody>{filteredAssets.map((asset) => <tr key={asset.tag}><td><div className="asset-name"><div className={`asset-thumb ${asset.tone}`}><Package size={17} /></div><div><strong>{asset.name}</strong><span>{asset.type}</span></div></div></td><td><strong className="mono">{asset.tag}</strong><span className="table-muted">{asset.serial}</span></td><td>{asset.owner}</td><td>{asset.location}</td><td><StatusPill status={asset.status} /></td><td><button className="row-more" aria-label={`More options for ${asset.name}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{filteredAssets.length === 0 && <div className="empty-search">No assets found for “{query}”.</div>}</div><div className="table-footer"><span>Showing {filteredAssets.length} of 1,284 assets</span><button className="text-button" onClick={() => setActiveNav('Assets')}>Open directory <ArrowUpRight size={14} /></button></div></section>

          <div className="bottom-grid"><section className="panel audit-card"><div className="panel-header"><div><h2>Q3 physical audit</h2><p>New York HQ · Due September 30</p></div><span className="audit-percent">78%</span></div><div className="audit-progress"><i style={{ width: '78%' }} /></div><div className="audit-meta"><span><Check size={14} /> 312 verified</span><span>89 remaining</span></div><button className="full-button light" onClick={() => setActiveNav('Audits')}>Continue audit <ArrowUpRight size={14} /></button></section><section className="panel ai-card"><div className="ai-glow"><Compass size={19} /></div><div><span className="eyebrow coral-eyebrow">GRIFFINEYE AI</span><h2>Turn a photo into an asset.</h2><p>GriffinEye reads your spreadsheet and maps it to the right fields automatically — or snap a label and let it extract the details for your review.</p><button className="button dark small" onClick={() => setShowIntake(true)}>Ask GriffinEye <ArrowUpRight size={14} /></button></div><div className="ai-scan"><QrCode size={50} strokeWidth={1.2} /><span>Scan anything</span></div></section></div>
          </>}
        </div>
      </section>

      {showIntake && <Modal title="GriffinEye asset intake" onClose={() => setShowIntake(false)}><IntakeModal onComplete={() => { setShowIntake(false); announce('Asset draft created for review.') }} /></Modal>}
      {showMigration && <Modal title="Import center" onClose={() => setShowMigration(false)}><MigrationModal onComplete={() => { setShowMigration(false); announce('Migration preview is ready.') }} /></Modal>}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </main>
  )
}

function SettingsGroup({ title, open, onToggle, items, active, onSelect }: { title: string; open: boolean; onToggle: () => void; items: [string, React.ComponentType<{ size?: number } >][]; active: string; onSelect: (label: string) => void }) {
  return <div className="nav-group settings-group"><button className="nav-group-toggle" aria-expanded={open} onClick={onToggle}><span className="nav-label">{title}</span><ChevronDown className={`nav-chevron ${open ? 'is-open' : ''}`} size={15} /></button><div className={`nav-group-items ${open ? 'is-open' : ''}`}>{items.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => onSelect(label)}><Icon size={17} /><span>{label}</span></button>)}</div></div>
}
function MigrationPage({ onAnnounce }: { onAnnounce: (message: string) => void }) { return <div className="workspace-screen"><div className="screen-heading"><div className="heading-icon-row"><div className="heading-icon-badge"><ArrowDownToLine size={22} /></div><div><span className="eyebrow">IMPORT CENTER</span><h1>Bring your data with you.</h1><p>Move from AssetTiger, spreadsheets, or another system without rebuilding your inventory.</p></div></div><button className="button primary" onClick={() => onAnnounce('Upload flow opened.')}><Upload size={16} /> Start import</button></div><div className="migration-cards"><div className="migration-card"><CloudUpload size={24} /><h2>Upload and map</h2><p>Drop in CSV, Excel, or a ZIP of photos. AssetGriffin suggests the right field mappings.</p><button className="button secondary small" onClick={() => onAnnounce('File picker opened.')}>Choose files</button></div><div className="migration-card"><Compass size={24} /><h2>Review with GriffinEye</h2><p>GriffinEye reads your spreadsheet and maps it to the right fields automatically before anything is written to your workspace.</p><span className="status-pill status-stock"><span className="status-dot" /> 3 drafts ready</span></div><div className="migration-card"><Check size={24} /><h2>Import safely</h2><p>Preview duplicates and missing fields, then commit only the records you approve.</p><span className="status-pill status-checked"><span className="status-dot" /> No changes yet</span></div></div><section className="panel list-panel"><div className="panel-header"><div><h2>Recent migration jobs</h2><p>Every import is logged and reversible during review.</p></div></div><div className="migration-job"><FileSpreadsheet size={20} /><div><strong>assettiger-export-september.csv</strong><span>1,284 records · 12 warnings · Uploaded today</span></div><StatusPill status="In review" /><button className="button secondary small" onClick={() => onAnnounce('Migration review opened.')}>Review</button></div></section></div> }
function ActivityRow({ icon, color, title, detail, time }: { icon: React.ReactNode; color: string; title: string; detail: string; time: string }) { return <div className="activity-row"><div className={`activity-icon ${color}`}>{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div> }
function AttentionRow({ icon, title, detail, critical }: { icon: React.ReactNode; title: string; detail: string; critical?: boolean }) { return <div className="attention-row"><div className={`attention-icon ${critical ? 'critical' : ''}`}>{icon}</div><div><strong>{title}</strong><span>{detail}</span></div><ArrowUpRight size={15} /></div> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="eyebrow">ASSETGRIFFIN WORKFLOW</span><h2 id="modal-title">{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>{children}</div></div> }
function IntakeModal({ onComplete }: { onComplete: () => void }) { const [stage, setStage] = useState<'upload' | 'review'>('upload'); return stage === 'upload' ? <div className="modal-body"><div className="dropzone" onClick={() => setStage('review')}><div className="drop-icon"><ImagePlus size={24} /></div><strong>Drop a photo or scan here</strong><span>Upload a device label, barcode, or serial number photo.</span><button className="button primary small"><CloudUpload size={15} /> Choose photo</button><small>JPG, PNG up to 10 MB</small></div><div className="workflow-note"><Compass size={16} /><span><strong>GriffinEye extracts, you approve.</strong> We’ll never add an unverified asset to your database.</span></div></div> : <div className="modal-body"><div className="review-preview"><div className="mock-device"><LaptopGlyph /></div><div><span className="eyebrow">EXTRACTED FROM PHOTO</span><h3>Looks like a Dell Latitude 5440</h3><p>We found 4 fields with high confidence.</p></div><span className="confidence">98% confident</span></div><div className="extracted-fields"><label>Manufacturer<input defaultValue="Dell" /></label><label>Model<input defaultValue="Latitude 5440" /></label><label>Serial number<input defaultValue="7XK91P2" /></label><label>Asset category<select defaultValue="Laptop"><option>Laptop</option><option>Monitor</option><option>Equipment</option></select></label></div><div className="workflow-note"><ShieldCheck size={16} /><span>Duplicate check passed. No matching serial number found in Summit Tech.</span></div><button className="button primary full-width" onClick={onComplete}><Check size={16} /> Create asset draft</button></div> }
function MigrationModal({ onComplete }: { onComplete: () => void }) { return <div className="modal-body"><div className="migration-callout"><FileSpreadsheet size={22} /><div><strong>Bring your existing inventory.</strong><span>Upload a CSV or Excel file and AssetGriffin will map the fields for you.</span></div></div><div className="migration-steps"><div className="migration-step complete"><span>1</span><div><strong>Upload your export</strong><small>AssetTiger, Excel, or CSV accepted</small></div><Check size={17} /></div><div className="migration-step active-step"><span>2</span><div><strong>Review with GriffinEye</strong><small>GriffinEye found 18 matching columns</small></div><ChevronDown size={17} /></div><div className="migration-step"><span>3</span><div><strong>Validate and import</strong><small>Preview before anything is saved</small></div></div></div><div className="mapping-preview"><div><span>YOUR COLUMN</span><span>ASSETGRIFFIN FIELD</span></div><p><strong>Asset Tag</strong><ArrowUpRight size={13} /><b>Asset number</b></p><p><strong>Checked Out To</strong><ArrowUpRight size={13} /><b>Assigned person</b></p><p><strong>Site</strong><ArrowUpRight size={13} /><b>Location</b></p></div><button className="button primary full-width" onClick={onComplete}><Check size={16} /> Preview 1,284 records</button></div> }
function LaptopGlyph() { return <div className="laptop-glyph"><div className="laptop-screen" /><div className="laptop-base" /></div> }
