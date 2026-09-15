'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowDownToLine,
  BadgeDollarSign,
  Code2,
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
  Columns3,
  FolderKanban,
  Filter,
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
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { GroupPage } from '@/components/workspace/group-page'
import { SettingsSection } from '@/components/workspace/settings-pages'
import { TemplateGallery } from '@/components/onboarding/template-gallery'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeNoticedPanel } from '@/components/griffineye/griffineye-noticed-panel'
import { GriffinEyeAssistant } from '@/components/griffineye/griffineye-assistant'
import { GriffinEyeIntakeModal } from '@/components/workspace/griffineye-intake-modal'
import { MigrationModal } from '@/components/workspace/migration-modal'
import { type GriffinEyeNavTarget, type GriffinEyeObservation } from '@/lib/griffineye-insights'
import type { DataGapSummary } from '@/lib/griffineye-agent/tools'
import type { DbAuditLogRow } from '@/lib/griffineye-audit'
import { onboardingTemplates } from '@/lib/onboarding-templates'
import { logout } from '@/app/login/actions'
import { saveIntakeAsset } from '@/lib/save-intake-asset'
import { groupIcon } from '@/lib/group-icons'
import type { DbGroup } from '@/lib/supabase/database.types'
import type { OnboardingTemplateId } from '@/lib/onboarding-templates'
import type { AssetRecord } from '@/lib/workspace-data'

type WorkspaceGroup = DbGroup & { recordCount?: number }

const ASSET_THUMB_TONES = ['coral', 'blue', 'green', 'amber', 'purple'] as const
const DEMO_SEED_ID = 'demo-workspace-v1'
const ONBOARDING_DISMISSED_KEY = 'ag-onboarding-dismissed'

function initialsFromLabel(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function capitalizeName(value: string) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function firstNameFromProfile(fullName: string, email: string) {
  const trimmed = fullName.trim()
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0]
    if (first) return capitalizeName(first)
  }

  const localPart = email.split('@')[0] ?? ''
  const firstSegment = localPart.split(/[._-]+/).find((part) => part.length > 0) ?? ''
  return capitalizeName(firstSegment) || 'there'
}

function displayNameFromProfile(fullName: string, email: string) {
  const trimmed = fullName.trim()
  if (trimmed) return trimmed
  return firstNameFromProfile('', email)
}

function formatOverviewDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()
}

function formatRelativeTime(iso: string) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const deltaMs = Date.now() - then
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function toneForAsset(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % ASSET_THUMB_TONES.length
  return ASSET_THUMB_TONES[hash]
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In use': 'status-checked',
    Available: 'status-stock',
    'In maintenance': 'status-maintenance',
    Retired: 'status-maintenance',
  }
  return <span className={`status-pill ${styles[status] ?? ''}`}><span className="status-dot" />{status}</span>
}

export default function Page() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [workspaceGroups, setWorkspaceGroups] = useState<WorkspaceGroup[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSettings, setActiveSettings] = useState('Profile')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Workspace: true, Tools: true, Account: true, Organization: true, Administration: true })
  const [showIntake, setShowIntake] = useState(false)
  const [showMigration, setShowMigration] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [scanTrigger, setScanTrigger] = useState(0)
  const [assetsGriffinEyeQuery, setAssetsGriffinEyeQuery] = useState<string | null>(null)
  const [assetsOpenRecordRef, setAssetsOpenRecordRef] = useState<string | null>(null)
  const [dataHealth, setDataHealth] = useState<DataGapSummary[]>([])
  const [totalAssets, setTotalAssets] = useState(0)
  const [maintenanceInitial, setMaintenanceInitial] = useState<{ status?: string; query?: string }>({})
  const [inspectionsInitial, setInspectionsInitial] = useState<{ status?: string; query?: string }>({})
  const [creditPurchaseNotice, setCreditPurchaseNotice] = useState<'cancelled' | null>(null)
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [griffinEyeObservations, setGriffinEyeObservations] = useState<GriffinEyeObservation[]>([])
  const [overviewAssets, setOverviewAssets] = useState<AssetRecord[]>([])
  const [auditEvents, setAuditEvents] = useState<DbAuditLogRow[]>([])
  const [workspaceName, setWorkspaceName] = useState('Workspace')
  const [userFirstName, setUserFirstName] = useState('')
  const [userDisplayName, setUserDisplayName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [userInitials, setUserInitials] = useState('?')

  async function loadGroups() {
    try {
      const response = await fetch('/api/groups')
      if (!response.ok) return
      const data = (await response.json()) as { groups?: WorkspaceGroup[] }
      const groups = data.groups ?? []
      setWorkspaceGroups(groups)

      if (window.localStorage.getItem(ONBOARDING_DISMISSED_KEY) !== '1') {
        const assetsGroup = groups.find((group) => group.slug === 'assets')
        const hasAssets = (assetsGroup?.recordCount ?? 0) > 0
        if (!hasAssets) setShowOnboarding(true)
      }
    } catch {
      // Sidebar falls back to Overview-only when groups cannot load.
    }
  }

  async function loadInsights() {
    try {
      const response = await fetch('/api/griffineye-insights')
      if (!response.ok) return
      const data = (await response.json()) as {
        observations?: Array<{ id: string; message: string; query: string }>
        dataHealth?: DataGapSummary[]
        totalAssets?: number
      }
      setGriffinEyeObservations(
        (data.observations ?? []).map((observation) => ({
          id: observation.id,
          message: observation.message,
          nav: { page: 'Assets', query: observation.query },
        })),
      )
      setDataHealth(data.dataHealth ?? [])
      setTotalAssets(data.totalAssets ?? 0)
    } catch {
      // Insights are optional on the overview dashboard.
    }
  }

  async function loadOverviewData() {
    try {
      const [workspaceRes, assetsRes, auditRes] = await Promise.all([
        fetch('/api/workspace'),
        fetch('/api/assets'),
        fetch('/api/audit-log?limit=5'),
      ])

      if (workspaceRes.ok) {
        const workspace = (await workspaceRes.json()) as {
          profile?: { fullName?: string | null; email?: string; role?: string }
          organization?: { name?: string }
        }
        const fullName = workspace.profile?.fullName?.trim() ?? ''
        const email = workspace.profile?.email ?? ''
        setWorkspaceName(workspace.organization?.name ?? 'Workspace')
        setUserFirstName(firstNameFromProfile(fullName, email))
        setUserDisplayName(displayNameFromProfile(fullName, email))
        setUserRole(workspace.profile?.role ?? 'Member')
        setUserInitials(initialsFromLabel(fullName || email.replace(/@.*$/, '').replace(/[._-]+/g, ' ')))
      }

      if (assetsRes.ok) {
        const assetsPayload = (await assetsRes.json()) as { assets?: AssetRecord[] }
        setOverviewAssets(assetsPayload.assets ?? [])
      }

      if (auditRes.ok) {
        const auditPayload = (await auditRes.json()) as { events?: DbAuditLogRow[] }
        setAuditEvents(
          (auditPayload.events ?? []).filter((event) => event.metadata?.seed !== DEMO_SEED_ID),
        )
      }
    } catch {
      // Overview keeps partial data if any request fails.
    }
  }

  useEffect(() => {
    void loadGroups()
    void loadOverviewData()
    void loadInsights()
  }, [])

  function dismissOnboarding() {
    window.localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1')
    setShowOnboarding(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('settings') === 'Billing') {
      setActiveNav('Settings')
      setActiveSettings('Billing')
    }
    const sessionId = params.get('checkoutSessionId')
    if (sessionId) {
      setCheckoutSessionId(sessionId)
    }
    if (params.get('creditPurchase') === 'cancelled') {
      setCreditPurchaseNotice('cancelled')
    }
  }, [])

  // Cmd/Ctrl+K opens the assistant from anywhere in the app.
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowAssistant((open) => !open)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const filteredAssets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return overviewAssets
    return overviewAssets.filter((asset) =>
      [asset.name, asset.id, asset.serial, asset.assignedTo, asset.location, asset.category, asset.status]
        .some((value) => value.toLowerCase().includes(needle)),
    )
  }, [overviewAssets, query])

  const inUseCount = useMemo(
    () => overviewAssets.filter((asset) => asset.status === 'In use').length,
    [overviewAssets],
  )
  const maintenanceCount = useMemo(
    () => overviewAssets.filter((asset) => asset.status === 'In maintenance').length,
    [overviewAssets],
  )
  const availableCount = useMemo(
    () => overviewAssets.filter((asset) => asset.status === 'Available').length,
    [overviewAssets],
  )
  const inUsePercent = totalAssets > 0 ? Math.round((inUseCount / totalAssets) * 100) : 0
  const attentionCount = maintenanceCount + dataHealth.reduce((sum, gap) => sum + gap.missing, 0)
  const previewAssets = filteredAssets.slice(0, 8)

  function announce(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  async function applyOnboardingTemplate(templateId: OnboardingTemplateId) {
    const response = await fetch('/api/onboarding/apply-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    })
    const payload = (await response.json()) as { error?: string; imported?: number }
    if (!response.ok) throw new Error(payload.error ?? 'Could not apply template.')
    await Promise.all([loadGroups(), loadOverviewData(), loadInsights()])
    return payload.imported ?? 0
  }

  function handleSelectTemplate(templateId: OnboardingTemplateId) {
    void (async () => {
      try {
        const imported = await applyOnboardingTemplate(templateId)
        dismissOnboarding()
        setActiveNav('Overview')
        const template = onboardingTemplates.find((t) => t.id === templateId)
        announce(
          `${template?.title ?? 'Template'} applied — ${imported} sample asset${imported === 1 ? '' : 's'} added to your workspace.`,
        )
      } catch (error) {
        announce(error instanceof Error ? error.message : 'Could not apply template.')
      }
    })()
  }

  function navigateToPage(nav: string) {
    setShowAssistant(false)
    setActiveNav(nav)
  }

  function navigateToSettings(section: string) {
    setShowAssistant(false)
    setActiveSettings(section)
    setActiveNav('Settings')
  }

  function openGroupSlug(slug: string) {
    const group = workspaceGroups.find((entry) => entry.slug === slug)
    navigateToPage(group?.name ?? slug)
  }

  function openAssetDetail(assetRef: string) {
    setAssetsOpenRecordRef(assetRef)
    openGroupSlug('assets')
  }

  function handleGriffinEyeNavigate(target: GriffinEyeNavTarget) {
    if (target.page === 'Assets') {
      openGroupSlug('assets')
      setAssetsGriffinEyeQuery(target.query)
      return
    }
    if (target.page === 'Maintenance') {
      openGroupSlug('maintenance')
      setMaintenanceInitial({ status: target.status, query: target.query })
      return
    }
    if (target.page === 'Inspections') {
      openGroupSlug('inspections')
      setInspectionsInitial({ status: target.status, query: target.query })
      return
    }
    openGroupSlug('audits')
  }

  const activeGroup = workspaceGroups.find((group) => group.name === activeNav || group.slug === activeNav)
  const toolGroups = workspaceGroups.filter((group) => group.slug === 'reports')
  const navGroups = workspaceGroups.filter((group) => group.slug !== 'reports')

  if (showOnboarding) {
    return (
      <>
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onGriffinEyeApply={(templateId, templateTitle) => {
            void (async () => {
              try {
                const imported = await applyOnboardingTemplate(templateId)
                dismissOnboarding()
                setActiveNav('Overview')
                announce(
                  `GriffinEye set up your account based on: ${templateTitle} — ${imported} sample asset${imported === 1 ? '' : 's'} added.`,
                )
              } catch (error) {
                announce(error instanceof Error ? error.message : 'Could not apply template.')
              }
            })()
          }}
          onUploadClick={() => setShowMigration(true)}
          onSkip={() => { dismissOnboarding(); announce('You can restart onboarding anytime from Settings.') }}
        />
        {showMigration && (
          <Modal title="Import center" onClose={() => setShowMigration(false)}>
            <MigrationModal
              onComplete={({ imported }) => {
                setShowMigration(false)
                dismissOnboarding()
                announce(`GriffinEye imported ${imported} assets into your organization.`)
              }}
            />
          </Modal>
        )}
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
        <button type="button" className={`sidebar-ask-griffineye${showAssistant ? ' is-active' : ''}`} onClick={() => setShowAssistant((open) => !open)} aria-label="Ask GriffinEye" aria-pressed={showAssistant}>
          <GriffinEyeIcon size={16} />
          <span>Ask GriffinEye</span>
          <kbd>⌘K</kbd>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <div className="nav-group">
            <button className="nav-group-toggle" aria-expanded={openGroups.Workspace} onClick={() => setOpenGroups((groups) => ({ ...groups, Workspace: !groups.Workspace }))}>
              <span className="nav-label">Workspace</span><ChevronDown className={`nav-chevron ${openGroups.Workspace ? 'is-open' : ''}`} size={15} />
            </button>
            <div className={`nav-group-items ${openGroups.Workspace ? 'is-open' : ''}`}>
              <button className={`nav-item ${activeNav === 'Overview' ? 'active' : ''}`} onClick={() => navigateToPage('Overview')}>
                <LayoutDashboard size={17} /><span>Overview</span>
              </button>
              {navGroups.map((group) => {
                const Icon = groupIcon(group.icon)
                const count = group.recordCount ? group.recordCount.toLocaleString() : undefined
                return (
                  <button key={group.id} className={`nav-item ${activeNav === group.name ? 'active' : ''}`} onClick={() => navigateToPage(group.name)}>
                    <Icon size={17} /><span>{group.name}</span>{count ? <em>{count}</em> : null}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="nav-group tools-group">
            <button className="nav-group-toggle" aria-expanded={openGroups.Tools} onClick={() => setOpenGroups((groups) => ({ ...groups, Tools: !groups.Tools }))}>
              <span className="nav-label">Tools</span><ChevronDown className={`nav-chevron ${openGroups.Tools ? 'is-open' : ''}`} size={15} />
            </button>
            <div className={`nav-group-items ${openGroups.Tools ? 'is-open' : ''}`}>
              {toolGroups.map((group) => {
                const Icon = groupIcon(group.icon)
                return (
                  <button key={group.id} className={`nav-item ${activeNav === group.name ? 'active' : ''}`} onClick={() => navigateToPage(group.name)}>
                    <Icon size={17} /><span>{group.name}</span>
                  </button>
                )
              })}
              <button className={`nav-item ${activeNav === 'Migration' ? 'active' : ''}`} onClick={() => navigateToPage('Migration')}><ArrowDownToLine size={17} /><span>Import center</span><span className="new-badge">NEW</span></button>
              <button className="nav-item" onClick={() => { openGroupSlug('assets'); setScanTrigger((n) => n + 1) }}><QrCode size={17} /><span>Scan asset</span></button>
            </div>
          </div>
          <SettingsGroup title="Account" open={openGroups.Account} onToggle={() => setOpenGroups((groups) => ({ ...groups, Account: !groups.Account }))} items={[['Profile', UserRound], ['Billing', CreditCard], ['Notifications', Bell], ['Preferences', SlidersHorizontal], ['Security', ShieldCheck], ['Integrations', Plug], ['Developer', Code2]]} active={activeSettings} onSelect={navigateToSettings} />
          <SettingsGroup title="Organization" open={openGroups.Organization} onToggle={() => setOpenGroups((groups) => ({ ...groups, Organization: !groups.Organization }))} items={[['Branding', Palette], ['Spending limits', BadgeDollarSign], ['Roles & permissions', KeyRound], ['Approval groups', ClipboardCheck], ['Groups', FolderKanban], ['Fields', Columns3]]} active={activeSettings} onSelect={navigateToSettings} />
          <SettingsGroup title="Administration" open={openGroups.Administration} onToggle={() => setOpenGroups((groups) => ({ ...groups, Administration: !groups.Administration }))} items={[['Team', Users], ['Departments', Boxes], ['Workflows', Activity], ['Audit log', ClipboardCheck]]} active={activeSettings} onSelect={navigateToSettings} />
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => announce('Settings are ready for your workspace.')}><Settings2 size={17} /><span>Settings</span></button>
          <div className="upgrade-card"><div className="upgrade-icon"><GriffinEyeIcon size={16} /></div><strong>Make your next move</strong><p>{totalAssets > 0 ? `GriffinEye is tracking ${totalAssets.toLocaleString()} assets in your workspace.` : 'GriffinEye is ready to process your first assets.'}</p><button onClick={() => setShowIntake(true)}>Add assets <ArrowUpRight size={14} /></button></div>
          <form action={logout} className="sidebar-logout-form">
            <button type="submit" className="nav-item sidebar-logout">
              <UserRound size={17} />
              <span>Log out</span>
            </button>
          </form>
          <div className="profile-row"><div className="profile-avatar">{userInitials}</div><div><strong>{userDisplayName || 'Account'}</strong><span>{userRole}</span></div><MoreHorizontal size={17} /></div>
        </div>
      </aside>

      <section className={`content-area${showAssistant ? ' ge-chat-open' : ''}`}>
        {!showAssistant && (
          <>
        <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setSidebarCollapsed(false)}><Menu size={20} /></button><div className="breadcrumb"><span>{workspaceName}</span><span>/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="topbar-ask-griffineye" onClick={() => setShowAssistant(true)} aria-label="Ask GriffinEye"><GriffinEyeIcon size={14} /><span className="topbar-ask-label">Ask GriffinEye</span><kbd>⌘K</kbd></button><button className="icon-button" aria-label="Notifications" onClick={() => announce('Notifications are not configured yet.')}><Bell size={18} /></button><div className="top-avatar">{userInitials}</div></div></header>
        <div className="page-content">
          {activeNav === 'Settings' ? <SettingsSection section={activeSettings} onAnnounce={announce} onNavigateSection={setActiveSettings} onStartOnboarding={() => setShowOnboarding(true)} creditPurchaseNotice={creditPurchaseNotice} checkoutSessionId={checkoutSessionId} /> : activeNav === 'Migration' ? <MigrationPage onOpenImport={() => setShowMigration(true)} /> : activeGroup ? <GroupPage slug={activeGroup.slug} onAnnounce={announce} scanTrigger={activeGroup.slug === 'assets' ? scanTrigger : undefined} initialGriffinEyeQuery={activeGroup.slug === 'assets' ? assetsGriffinEyeQuery : undefined} onInitialGriffinEyeQueryHandled={() => setAssetsGriffinEyeQuery(null)} onOpenSpreadsheetImport={() => setShowMigration(true)} initialStatusFilter={activeGroup.slug === 'maintenance' ? maintenanceInitial.status : activeGroup.slug === 'inspections' ? inspectionsInitial.status : undefined} initialQuery={activeGroup.slug === 'maintenance' ? maintenanceInitial.query : activeGroup.slug === 'inspections' ? inspectionsInitial.query : undefined} onInitialFiltersHandled={() => { setMaintenanceInitial({}); setInspectionsInitial({}) }} initialOpenRecordRef={activeGroup.slug === 'assets' ? assetsOpenRecordRef : undefined} onInitialOpenRecordHandled={() => setAssetsOpenRecordRef(null)} onOpenRecordDetail={(ref) => setAssetsOpenRecordRef(ref)} /> : <>
          <div className="page-heading"><div className="heading-icon-row"><div className="heading-icon-badge"><LayoutDashboard size={22} /></div><div><p className="eyebrow">{formatOverviewDate()}</p><h1>Hello, {userFirstName || 'there'}.</h1><p className="heading-sub">Here’s what’s happening across your asset portfolio.</p></div></div><div className="heading-actions"><button className="button secondary" onClick={() => setShowMigration(true)}><Upload size={16} /> Import assets</button><button className="button primary" onClick={() => setShowAssistant(true)}><GriffinEyeIcon size={16} /> Ask GriffinEye</button></div></div>

          <div className="metric-grid">
            <div className="metric-card feature-metric"><div className="metric-top"><span className="metric-label">Total assets</span><span className="metric-icon coral-icon"><Boxes size={18} /></span></div><div className="metric-value">{totalAssets.toLocaleString()}</div><div className="metric-foot"><span>{overviewAssets.length ? 'Live inventory from your workspace' : 'Import or add assets to get started'}</span></div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">In use</span><span className="metric-icon blue-icon"><ArrowUpRight size={18} /></span></div><div className="metric-value">{inUseCount.toLocaleString()}</div><div className="metric-foot"><span>{totalAssets ? `${inUsePercent}% of portfolio` : 'No assets yet'}</span>{totalAssets ? <div className="progress"><i style={{ width: `${inUsePercent}%` }} /></div> : null}</div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">Needs attention</span><span className="metric-icon amber-icon"><Bell size={18} /></span></div><div className="metric-value">{attentionCount.toLocaleString()}</div><div className="metric-foot"><span className="attention-text">{maintenanceCount} in maintenance · {dataHealth.reduce((sum, gap) => sum + gap.missing, 0)} data gaps</span>{attentionCount ? <div className="metric-link" onClick={() => openGroupSlug('assets')}>Review assets <ArrowUpRight size={13} /></div> : null}</div></div>
            <div className="metric-card"><div className="metric-top"><span className="metric-label">Available</span><span className="metric-icon green-icon"><ShieldCheck size={18} /></span></div><div className="metric-value">{availableCount.toLocaleString()}</div><div className="metric-foot"><span>{totalAssets ? `${Math.round((availableCount / totalAssets) * 100)}% ready to assign` : 'No assets yet'}</span>{totalAssets ? <div className="progress green-progress"><i style={{ width: `${Math.round((availableCount / totalAssets) * 100)}%` }} /></div> : null}</div></div>
          </div>

          <div className="workspace-grid">
            <section className="panel activity-panel"><div className="panel-header"><div><h2>Recent activity</h2><p>Latest changes across your workspace</p></div><button className="text-button" onClick={() => navigateToSettings('Audit log')}>View all <ArrowUpRight size={14} /></button></div><div className="activity-list">{auditEvents.length ? auditEvents.map((event) => <ActivityRow key={event.id} icon={auditIconForCategory(event.category)} color={auditColorForCategory(event.category)} title={event.summary || event.action} detail={`${event.actor_label}${event.entity_label ? ` · ${event.entity_label}` : ''}`} time={formatRelativeTime(event.created_at)} />) : <p className="empty-search">No activity logged yet.</p>}</div></section>
            <section className="panel attention-panel"><div className="panel-header"><div><h2>Needs attention</h2><p>Small things before they become big things</p></div>{attentionCount ? <span className="attention-count">{attentionCount}</span> : null}</div><div className="attention-list">{maintenanceCount ? <AttentionRow icon={<Wrench size={16} />} title={`${maintenanceCount} asset${maintenanceCount === 1 ? '' : 's'} in maintenance`} detail="Review status in Assets" /> : null}{dataHealth.slice(0, 2).map((gap) => <AttentionRow key={gap.field} icon={<CalendarClock size={16} />} title={`${gap.missing} missing ${gap.label.toLowerCase()}`} detail={`${gap.percent}% of records blank`} critical={gap.percent >= 40} />)} {!attentionCount ? <p className="empty-search">Nothing needs attention right now.</p> : null}</div>{attentionCount ? <div className="panel-footer"><button className="full-button" onClick={() => openGroupSlug('assets')}>Open assets <ArrowUpRight size={14} /></button></div> : null}</section>
          </div>

          <GriffinEyeNoticedPanel observations={griffinEyeObservations} onNavigate={handleGriffinEyeNavigate} />

          {dataHealth.length > 0 ? (
            <section className="panel data-health-panel">
              <div className="panel-header">
                <div>
                  <h2>Data health</h2>
                  <p>Fields still blank across your {totalAssets.toLocaleString()} records</p>
                </div>
                <button className="text-button" onClick={() => setShowAssistant(true)}>
                  Ask GriffinEye <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="data-health-list">
                {dataHealth.slice(0, 5).map((gap) => (
                  <button
                    key={gap.field}
                    type="button"
                    className="data-health-row"
                    onClick={() =>
                      handleGriffinEyeNavigate({ page: 'Assets', query: `Which assets have ${gap.blankPhrase}?` })
                    }
                  >
                    <strong>{gap.label}</strong>
                    <span>
                      {gap.missing} of {gap.total} blank · {gap.percent}%
                    </span>
                    <div className={`data-health-bar ${gap.percent >= 40 ? 'warn' : ''}`}>
                      <i style={{ width: `${Math.max(2, gap.percent)}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel assets-panel"><div className="panel-header assets-header"><div><h2>Asset directory</h2><p>Browse, search, and manage your inventory</p></div><button className="button secondary small" onClick={() => setShowIntake(true)}><Plus size={15} /> Add asset</button></div><div className="table-toolbar"><div className="search-wrap"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assets, serials, people..." /></div><button className="filter-button" onClick={() => openGroupSlug('assets')}><Filter size={15} /> Open filters</button></div><div className="asset-table-wrap"><table className="asset-table"><thead><tr><th>Asset</th><th>Tag / serial</th><th>Assigned to</th><th>Location</th><th>Status</th><th /></tr></thead><tbody>{previewAssets.map((asset) => <tr key={asset.id} className="clickable-row" onClick={() => openAssetDetail(asset.id)}><td><div className="asset-name"><div className={`asset-thumb ${toneForAsset(asset.name)}`}><Package size={17} /></div><div><strong>{asset.name}</strong><span>{asset.category}</span></div></div></td><td><strong className="mono">{asset.id}</strong><span className="table-muted">{asset.serial || '—'}</span></td><td>{asset.assignedTo}</td><td>{asset.location}</td><td><StatusPill status={asset.status} /></td><td><button type="button" className="text-button row-view-button" aria-label={`View ${asset.name}`} onClick={(event) => { event.stopPropagation(); openAssetDetail(asset.id) }}>View</button></td></tr>)}</tbody></table>{previewAssets.length === 0 && <div className="empty-search">{query ? `No assets found for “${query}”.` : 'No assets yet — import a spreadsheet or add your first asset.'}</div>}</div><div className="table-footer"><span>Showing {previewAssets.length} of {totalAssets.toLocaleString()} assets</span><button className="text-button" onClick={() => openGroupSlug('assets')}>Open directory <ArrowUpRight size={14} /></button></div></section>

          <div className="bottom-grid"><section className="panel ai-card"><div className="ai-glow"><GriffinEyeIcon size={19} /></div><div><span className="eyebrow coral-eyebrow">GRIFFINEYE</span><h2>Turn a photo or a sentence into an asset.</h2><p>Snap a label or just describe the item in plain words — GriffinEye extracts the details for your review. It also reads spreadsheets and maps them to the right fields automatically.</p><button className="button dark small" onClick={() => setShowIntake(true)}>Start asset intake <ArrowUpRight size={14} /></button></div><div className="ai-scan"><QrCode size={50} strokeWidth={1.2} /><span>Scan anything</span></div></section></div>
          </>}
        </div>
          </>
        )}
        {showAssistant && (
          <GriffinEyeAssistant
            open={showAssistant}
            onClose={() => setShowAssistant(false)}
            onOpenBilling={() => navigateToSettings('Billing')}
            firstName={userFirstName}
            userInitials={userInitials}
            totalAssets={totalAssets}
            maintenanceCount={maintenanceCount}
            inUsePercent={inUsePercent}
            dataHealth={dataHealth}
            observations={griffinEyeObservations}
          />
        )}
      </section>

      {showIntake && (
        <Modal title="GriffinEye asset intake" onClose={() => setShowIntake(false)}>
          <GriffinEyeIntakeModal
            onComplete={async (draft) => {
              const created = await saveIntakeAsset(draft)
              setShowIntake(false)
              await Promise.all([loadOverviewData(), loadGroups(), loadInsights()])
              openAssetDetail(created.id)
              announce(`GriffinEye saved ${created.name} (${created.id}).`)
            }}
            onOpenSpreadsheetImport={() => {
              setShowIntake(false)
              setShowMigration(true)
            }}
          />
        </Modal>
      )}
      {showMigration && (
        <Modal title="Import center" onClose={() => setShowMigration(false)}>
          <MigrationModal
            onComplete={async ({ imported }) => {
              setShowMigration(false)
              await Promise.all([loadOverviewData(), loadGroups(), loadInsights()])
              announce(`GriffinEye imported ${imported} assets into your organization.`)
            }}
          />
        </Modal>
      )}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </main>
  )
}

function SettingsGroup({ title, open, onToggle, items, active, onSelect }: { title: string; open: boolean; onToggle: () => void; items: [string, React.ComponentType<{ size?: number } >][]; active: string; onSelect: (label: string) => void }) {
  return <div className="nav-group settings-group"><button className="nav-group-toggle" aria-expanded={open} onClick={onToggle}><span className="nav-label">{title}</span><ChevronDown className={`nav-chevron ${open ? 'is-open' : ''}`} size={15} /></button><div className={`nav-group-items ${open ? 'is-open' : ''}`}>{items.map(([label, Icon]) => <button key={label} className={`nav-item ${active === label ? 'active' : ''}`} onClick={() => onSelect(label)}><Icon size={17} /><span>{label}</span></button>)}</div></div>
}
function MigrationPage({ onOpenImport }: { onOpenImport: () => void }) {
  return (
    <div className="workspace-screen">
      <div className="screen-heading">
        <div className="heading-icon-row">
          <div className="heading-icon-badge"><ArrowDownToLine size={22} /></div>
          <div>
            <span className="eyebrow">IMPORT CENTER</span>
            <h1>Bring your data with you.</h1>
            <p>Move from AssetTiger, spreadsheets, or another system without rebuilding your inventory.</p>
          </div>
        </div>
        <button className="button primary" onClick={onOpenImport}><Upload size={16} /> Start import</button>
      </div>
      <div className="migration-cards">
        <div className="migration-card">
          <CloudUpload size={24} />
          <h2>Upload and map</h2>
          <p>Drop in CSV, Excel, or a ZIP of photos. AssetGriffin suggests the right field mappings.</p>
          <button className="button secondary small" onClick={onOpenImport}>Choose files</button>
        </div>
        <div className="migration-card">
          <span className="migration-griffineye-icon"><GriffinEyeIcon size={24} /></span>
          <h2>Review with GriffinEye</h2>
          <p>GriffinEye reads your spreadsheet and maps it to the right fields automatically before anything is written to your workspace.</p>
        </div>
        <div className="migration-card">
          <Check size={24} />
          <h2>Import safely</h2>
          <p>Preview duplicates and missing fields, then commit only the records you approve.</p>
        </div>
      </div>
      <section className="panel list-panel">
        <div className="panel-header">
          <div>
            <h2>Recent migration jobs</h2>
            <p>Completed imports appear in your audit log.</p>
          </div>
        </div>
        <p className="empty-search">No migration jobs yet.</p>
      </section>
    </div>
  )
}

function auditIconForCategory(category: DbAuditLogRow['category']) {
  if (category === 'import') return <ArrowDownToLine size={15} />
  if (category === 'ai') return <GriffinEyeIcon size={15} />
  if (category === 'user') return <UserRound size={15} />
  return <Package size={15} />
}

function auditColorForCategory(category: DbAuditLogRow['category']) {
  if (category === 'import') return 'purple'
  if (category === 'ai') return 'green'
  if (category === 'user') return 'blue'
  return 'amber'
}
function ActivityRow({ icon, color, title, detail, time }: { icon: React.ReactNode; color: string; title: string; detail: string; time: string }) { return <div className="activity-row"><div className={`activity-icon ${color}`}>{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div> }
function AttentionRow({ icon, title, detail, critical }: { icon: React.ReactNode; title: string; detail: string; critical?: boolean }) { return <div className="attention-row"><div className={`attention-icon ${critical ? 'critical' : ''}`}>{icon}</div><div><strong>{title}</strong><span>{detail}</span></div><ArrowUpRight size={15} /></div> }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><span className="eyebrow">ASSETGRIFFIN WORKFLOW</span><h2 id="modal-title">{title}</h2></div><button className="close-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></div>{children}</div></div> }