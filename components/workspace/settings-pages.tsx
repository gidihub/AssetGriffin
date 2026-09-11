'use client'

import { useState } from 'react'
import {
  ArrowDownToLine,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Database,
  Fingerprint,
  Globe,
  HardHat,
  Headset,
  ImagePlus,
  KeyRound,
  Laptop2,
  Landmark,
  Mail,
  MessageCircle,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  Plug,
  Plus,
  Puzzle,
  Receipt,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Ticket,
  Trash2,
  User,
  Users,
  Wallet,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react'
import { DataTable, DetailDrawer, DrawerSection, EmptyState, StatusBadge, ToggleRow } from './primitives'
import { locations } from '@/lib/workspace-data'

type Announce = (message: string) => void

const sectionCopy: Record<string, [string, string, React.ComponentType<{ size?: number }>]> = {
  Profile: ['Profile', 'Your personal information and workspace presence', User],
  Billing: ['Billing', 'Manage your asset plan and payment details', CreditCard],
      Notifications: ['Notifications', 'Control how and when AssetGriffin alerts you', Bell],
  Preferences: ['Preferences', 'Tune your workspace defaults', Settings2],
  Security: ['Security', 'Keep your account and asset data safe', ShieldCheck],
  Integrations: ['Integrations', 'Connect accounting, identity, device management, ticketing, and automation tools', Plug],
  Developer: ['Developer', 'API keys and programmatic access to your workspace', Terminal],
  Branding: ['Branding', 'Logo, colors, and your organization identity', Palette],
  'Spending limits': ['Spending limits', 'Set guardrails for purchases and asset operations', Wallet],
  'Roles & permissions': ['Roles & permissions', 'Control exactly what each role can see and do', KeyRound],
  'Approval groups': ['Approval groups', 'Route asset purchases and transfers for approval', CheckCircle2],
  Team: ['Team', 'Manage workspace members and access', Users],
  Departments: ['Departments', 'Organize people and assets by department', Building2],
  Workflows: ['Workflows', 'Configure approval and reminder automations', Workflow],
  'Audit log': ['Audit log', 'Review every important action in your workspace', ClipboardList],
}

function SettingsHero({ section }: { section: string }) {
  const [title, description, Icon] = sectionCopy[section] ?? sectionCopy.Profile
  return (
    <div className="settings-hero">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="settings-hero-icon"><Icon size={34} /></div>
    </div>
  )
}

function SettingsCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ---------- Profile ----------
function ProfileSettings({ onAnnounce }: { onAnnounce: Announce }) {
  return (
    <SettingsCard title="Personal information" description="This is how you appear across Summit Tech's workspace." action={<button className="button primary small" onClick={() => onAnnounce('Profile saved.')}>Save changes</button>}>
      <div className="profile-form">
        <div className="avatar-upload">
          <div className="profile-avatar large">JS</div>
          <button className="button secondary small" onClick={() => onAnnounce('Avatar upload opened.')}><ImagePlus size={14} /> Upload photo</button>
        </div>
        <div className="form-grid">
          <label>Full name<input defaultValue="Jamie Smith" /></label>
          <label>Email address<input defaultValue="jamie.smith@summittech.com" /></label>
          <label>Job title<input defaultValue="Operations Administrator" /></label>
          <label>Timezone
            <select defaultValue="America/New_York">
              <option value="America/New_York">Eastern Time (New York)</option>
              <option value="America/Chicago">Central Time (Chicago)</option>
              <option value="Europe/London">Greenwich Mean Time (London)</option>
            </select>
          </label>
        </div>
      </div>
    </SettingsCard>
  )
}

// ---------- Billing ----------
function BillingSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const invoices = [
    { id: 'INV-2026-08', date: 'Aug 1, 2026', amount: '$499.00', status: 'Paid' },
    { id: 'INV-2026-07', date: 'Jul 1, 2026', amount: '$499.00', status: 'Paid' },
    { id: 'INV-2026-06', date: 'Jun 1, 2026', amount: '$449.00', status: 'Paid' },
  ]
  return (
    <>
      <SettingsCard title="Current plan" description="Summit Tech is on the Scale plan, billed monthly." action={<button className="button secondary small" onClick={() => onAnnounce('Plan comparison opened.')}>Change plan</button>}>
        <div className="billing-plan-row">
          <div className="plan-tier-card">
            <span className="eyebrow">CURRENT PLAN</span>
            <h3>Scale</h3>
            <p>$499/month · billed to Visa ending 4471</p>
          </div>
          <div className="plan-usage">
            <div className="plan-usage-top"><span>Asset usage</span><strong>1,284 / 2,000 assets</strong></div>
            <div className="progress"><i style={{ width: '64%' }} /></div>
            <span className="table-muted">716 assets remaining before you need to upgrade</span>
          </div>
        </div>
        <div className="field-grid">
          <div className="field-item"><span>Next invoice</span><strong>Oct 1, 2026 · $499.00</strong></div>
          <div className="field-item"><span>Payment method</span><strong>Visa ending 4471</strong></div>
        </div>
      </SettingsCard>
      <SettingsCard title="Invoice history" description="Download past invoices for your records.">
        <DataTable
          rows={invoices.map((inv) => ({ ...inv }))}
          columns={[
            { key: 'id', header: 'Invoice', mono: true, render: (r) => r.id },
            { key: 'date', header: 'Date', render: (r) => r.date },
            { key: 'amount', header: 'Amount', render: (r) => r.amount },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status="Available" /> },
            { key: 'download', header: '', render: () => <button className="text-button" onClick={() => onAnnounce('Invoice downloaded.')}><ArrowDownToLine size={13} /> Download</button> },
          ]}
        />
      </SettingsCard>
    </>
  )
}

// ---------- Notifications ----------
function NotificationsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [state, setState] = useState({ overdue: true, auditDue: true, maintenanceDue: false, lowStock: true, warrantyExpiring: false })
  const rows: { key: keyof typeof state; label: string; description: string }[] = [
    { key: 'overdue', label: 'Overdue check-ins', description: 'Alert me when an assigned asset is past its expected return date.' },
    { key: 'auditDue', label: 'Audit due', description: 'Alert me when a scheduled audit is approaching its deadline.' },
    { key: 'maintenanceDue', label: 'Maintenance due', description: 'Alert me when a work order is scheduled or overdue.' },
    { key: 'lowStock', label: 'Low stock', description: 'Alert me when available inventory for a category runs low.' },
    { key: 'warrantyExpiring', label: 'Warranty expiring', description: 'Alert me 30 days before an asset warranty expires.' },
  ]
  return (
    <SettingsCard title="Alert preferences" description="Changes apply to your account across the Summit Tech workspace." action={<button className="button primary small" onClick={() => onAnnounce('Notification preferences saved.')}>Save changes</button>}>
      {rows.map((row) => (
        <ToggleRow key={row.key} label={row.label} description={row.description} checked={state[row.key]} onChange={(checked) => setState((s) => ({ ...s, [row.key]: checked }))} />
      ))}
    </SettingsCard>
  )
}

// ---------- Preferences ----------
function PreferencesSettings({ onAnnounce, onStartOnboarding }: { onAnnounce: Announce; onStartOnboarding?: () => void }) {
  return (
    <>
      <SettingsCard title="Workspace defaults" description="These settings only affect how the workspace looks and feels for you." action={<button className="button primary small" onClick={() => onAnnounce('Preferences saved.')}>Save changes</button>}>
        <div className="form-grid">
          <label>Date format
            <select defaultValue="MM/DD/YYYY"><option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select>
          </label>
          <label>Default landing page
            <select defaultValue="Overview"><option>Overview</option><option>Assets</option><option>Maintenance</option><option>Reports</option></select>
          </label>
          <label>Table density
            <select defaultValue="Comfortable"><option>Comfortable</option><option>Compact</option></select>
          </label>
          <label>Theme
            <select defaultValue="Light"><option>Light</option><option>Dark</option><option>System</option></select>
          </label>
        </div>
      </SettingsCard>
      <SettingsCard title="Start over with a template" description="Reset your workspace using one of AssetGriffin's persona-based starter templates.">
        <div className="security-status-row">
          <div className="security-status-icon"><Sparkles size={20} /></div>
          <div>
            <strong>Not sure your current setup fits?</strong>
            <span>Reopen the template gallery to reconfigure your categories and sample records.</span>
          </div>
          <button className="button secondary small" onClick={onStartOnboarding}>Start over with a template</button>
        </div>
      </SettingsCard>
    </>
  )
}

// ---------- Security ----------
function SecuritySettings({ onAnnounce }: { onAnnounce: Announce }) {
  const sessions = [
    { id: 'SES-1', device: 'MacBook Pro · Chrome', location: 'New York, US', lastActive: 'Active now' },
      { id: 'SES-2', device: 'iPhone 15 Pro · AssetGriffin app', location: 'New York, US', lastActive: '2 hours ago' },
    { id: 'SES-3', device: 'Windows PC · Edge', location: 'Austin, US', lastActive: '3 days ago' },
  ]
  return (
    <>
      <SettingsCard title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <div className="security-status-row">
          <div className="security-status-icon"><ShieldCheck size={20} /></div>
          <div>
            <strong>2FA is currently disabled</strong>
            <span>We recommend enabling authenticator app verification.</span>
          </div>
          <button className="button primary small" onClick={() => onAnnounce('Two-factor setup opened.')}>Enable 2FA</button>
        </div>
      </SettingsCard>
      <SettingsCard title="Active sessions" description="Devices currently signed in to your account.">
        <DataTable
          rows={sessions}
          columns={[
            { key: 'device', header: 'Device', render: (r) => <strong>{r.device}</strong> },
            { key: 'location', header: 'Location', render: (r) => r.location },
            { key: 'lastActive', header: 'Last active', render: (r) => r.lastActive },
            { key: 'revoke', header: '', render: (r) => <button className="text-button" onClick={() => onAnnounce(`${r.device} session revoked.`)}>Revoke</button> },
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Password policy" description="Enforced for every member of the Summit Tech workspace.">
        <div className="field-grid">
          <div className="field-item"><span>Minimum length</span><strong>12 characters</strong></div>
          <div className="field-item"><span>Requires</span><strong>Uppercase, number, symbol</strong></div>
          <div className="field-item"><span>Expiration</span><strong>Every 90 days</strong></div>
          <div className="field-item"><span>SSO</span><strong>Not connected</strong></div>
        </div>
      </SettingsCard>
    </>
  )
}

// ---------- Integrations ----------
type IntegrationItem = {
  name: string
  description: string
  icon: React.ComponentType<{ size?: number }>
  logo?: string
  category: string
  connected?: boolean
  lastSynced?: string
  popular?: boolean
  kind?: 'toggle' | 'manage'
}

const integrationCategoryList = ['Communication', 'Identity & access', 'Device management', 'Accounting & finance', 'IT & ticketing', 'Procurement', 'Automation & developer']

const integrations: IntegrationItem[] = [
  { name: 'Slack', description: 'Send alerts and mentions to your team channels.', icon: MessageSquare, logo: '/logos/slack.svg', category: 'Communication', connected: true, lastSynced: '12 min ago', popular: true },
  { name: 'Microsoft Teams', description: 'Send alerts and mentions to your Teams channels.', icon: MessageCircle, logo: '/logos/microsoft-teams.svg', category: 'Communication', connected: false },
  { name: 'Email digests', description: 'Get a daily or weekly summary sent to your inbox.', icon: Mail, category: 'Communication', kind: 'toggle' },
  { name: 'Active Directory', description: 'Provision and deprovision workspace members.', icon: Building2, category: 'Identity & access', connected: false },
  { name: 'Okta', description: 'Sync users and enforce single sign-on.', icon: Shield, logo: '/logos/okta.svg', category: 'Identity & access', connected: true, lastSynced: '34 min ago', popular: true },
  { name: 'Microsoft Entra ID (Azure AD)', description: 'Sync users and enforce single sign-on for Microsoft 365 orgs.', icon: Fingerprint, category: 'Identity & access', connected: false },
  { name: 'Google Workspace', description: 'Sign in and sync users with your Google Workspace.', icon: Globe, logo: '/logos/google-workspace.svg', category: 'Identity & access', connected: false },
  { name: 'Microsoft Intune', description: 'Pull device compliance status into asset records.', icon: MonitorSmartphone, logo: '/logos/microsoft-intune.svg', category: 'Device management', connected: true, lastSynced: 'Yesterday', popular: true },
  { name: 'Jamf', description: 'Sync Apple device inventory and enrollment status.', icon: Laptop2, category: 'Device management', connected: false },
  { name: 'QuickBooks', description: 'Sync depreciation and purchase data to your books.', icon: Database, logo: '/logos/quickbooks.svg', category: 'Accounting & finance', connected: true, lastSynced: '2 hours ago', popular: true },
  { name: 'Xero', description: 'Sync depreciation and purchase data to your books.', icon: Receipt, logo: '/logos/xero.svg', category: 'Accounting & finance', connected: false },
  { name: 'NetSuite', description: 'Sync asset and financial data with your ERP.', icon: Landmark, category: 'Accounting & finance', connected: false },
  { name: 'Jira', description: 'Link asset records to issues and repair tickets.', icon: Ticket, logo: '/logos/jira.svg', category: 'IT & ticketing', connected: true, lastSynced: '1 hour ago', popular: true },
  { name: 'ServiceNow', description: 'Sync asset records with your ITSM workflows.', icon: Headset, category: 'IT & ticketing', connected: false },
  { name: 'Procore', description: 'Sync jobsite equipment and procurement data for construction teams.', icon: HardHat, category: 'Procurement', connected: false },
  { name: 'Zapier', description: 'Connect AssetGriffin to thousands of other apps without custom code.', icon: Puzzle, logo: '/logos/zapier.svg', category: 'Automation & developer', connected: true, lastSynced: '20 min ago', popular: true },
  { name: 'Webhooks & API', description: 'Build custom integrations with our REST API.', icon: Webhook, category: 'Automation & developer', kind: 'manage' },
]

function IntegrationMark({ name, icon: Icon, logo }: { name: string; icon: React.ComponentType<{ size?: number }>; logo?: string }) {
  return (
    <div className="integration-icon">
      {logo ? <img src={logo} alt={`${name} logo`} /> : <Icon size={20} />}
    </div>
  )
}

function IntegrationsSettings({ onAnnounce, onNavigateSection }: { onAnnounce: Announce; onNavigateSection?: (section: string) => void }) {
  const [digestsOn, setDigestsOn] = useState(true)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'all' | 'connected'>('all')
  const [activeCategory, setActiveCategory] = useState('All')

  const connectedCount = integrations.filter((item) => item.connected).length
  const popular = integrations.filter((item) => item.popular)

  const filtered = integrations.filter((item) => {
    const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesView = view === 'all' || item.connected
    return matchesQuery && matchesCategory && matchesView
  })

  const showPopular = activeCategory === 'All' && view === 'all' && !query

  return (
    <>
      <div className="integrations-toolbar">
        <div className="search-wrap integration-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search integrations..." />
        </div>
        <span className="status-badge tone-positive">
          <CheckCircle2 size={12} /> {connectedCount} connected
        </span>
        <div className="view-toggle">
          <button className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>All</button>
          <button className={view === 'connected' ? 'active' : ''} onClick={() => setView('connected')}>Connected</button>
        </div>
      </div>

      <div className="integration-pills">
        <button className={activeCategory === 'All' ? 'active' : ''} onClick={() => setActiveCategory('All')}>All</button>
        {integrationCategoryList.map((category) => (
          <button key={category} className={activeCategory === category ? 'active' : ''} onClick={() => setActiveCategory(category)}>{category}</button>
        ))}
      </div>

      {showPopular && (
        <div className="integration-popular">
          <p className="integration-popular-label"><Zap size={14} /> Popular integrations</p>
          <div className="integration-popular-grid">
            {popular.map(({ name, icon, logo, connected }) => (
              <div key={name} className="integration-popular-tile">
                <IntegrationMark name={name} icon={icon} logo={logo} />
                <span>{name}</span>
                {connected && <span className="integration-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="integration-grid">
        {filtered.map(({ name, description, icon, logo, category, connected, lastSynced, kind }) => (
          <div key={name} className={`integration-card ${connected ? 'connected' : ''}`}>
            <div className="integration-card-top">
              <IntegrationMark name={name} icon={icon} logo={logo} />
              {connected && <CheckCircle2 size={15} className="integration-check" />}
            </div>
            <strong>{name}</strong>
            <p>{description}</p>
            {kind === 'toggle' ? (
              <div className="integration-footer">
                <span className="integration-category">{category}</span>
                <button
                  className={`fake-switch ${digestsOn ? 'on' : ''}`}
                  role="switch"
                  aria-checked={digestsOn}
                  aria-label="Email digests"
                  onClick={() => { setDigestsOn((v) => !v); onAnnounce(`Email digests ${!digestsOn ? 'enabled' : 'disabled'}.`) }}
                />
              </div>
            ) : kind === 'manage' ? (
              <div className="integration-footer">
                <span className="integration-category">{category}</span>
                <button className="button small secondary" onClick={() => { onNavigateSection?.('Developer'); onAnnounce('Opening Developer settings.') }}>Manage</button>
              </div>
            ) : (
              <div className="integration-footer">
                <span className="integration-category">{connected && lastSynced ? `${category} · Synced ${lastSynced}` : category}</span>
                <button className={`button small ${connected ? 'secondary' : 'primary'}`} onClick={() => onAnnounce(`${name} ${connected ? 'reconnected' : 'connected'}.`)}>{connected ? 'Reconnect' : 'Connect'}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="table-muted">No integrations match your search.</p>}
    </>
  )
}

// ---------- Developer ----------
function DeveloperSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const keys = [
    { id: 'API-1', name: 'Production sync', key: 'nsk_live_••••••••8821', created: 'Jun 2, 2026' },
    { id: 'API-2', name: 'Reporting export', key: 'nsk_live_••••••••1147', created: 'Jul 15, 2026' },
  ]
  return (
    <>
      <SettingsCard title="API keys" description="Use these keys to read and write asset data programmatically." action={<button className="button primary small" onClick={() => onAnnounce('New API key generated.')}><Plus size={14} /> Generate key</button>}>
        <DataTable
          rows={keys}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
            { key: 'key', header: 'Key', mono: true, render: (r) => r.key },
            { key: 'created', header: 'Created', render: (r) => r.created },
            { key: 'revoke', header: '', render: (r) => <button className="text-button" onClick={() => onAnnounce(`${r.name} key revoked.`)}><Trash2 size={13} /> Revoke</button> },
          ]}
        />
      </SettingsCard>
      <SettingsCard title="Webhook endpoints" description="AssetGriffin will POST asset events to these URLs." action={<button className="button secondary small" onClick={() => onAnnounce('Webhook form opened.')}><Plus size={14} /> Add endpoint</button>}>
        <div className="webhook-row">
          <span className="mono">https://hooks.summittech.com/assetgriffin/assets</span>
          <StatusBadge status="Active" />
        </div>
        <div className="webhook-row">
          <span className="mono">https://hooks.summittech.com/assetgriffin/audits</span>
          <StatusBadge status="Active" />
        </div>
      </SettingsCard>
      <SettingsCard title="Rate limit usage" description="Requests reset every rolling hour.">
        <div className="plan-usage-top"><span>API requests</span><strong>3,420 / 10,000</strong></div>
        <div className="progress"><i style={{ width: '34%' }} /></div>
      </SettingsCard>
    </>
  )
}

// ---------- Branding ----------
function BrandingSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [color, setColor] = useState('#2FA391')
  return (
    <SettingsCard title="Organization identity" description="Your logo and colors appear on shared reports and the login screen." action={<button className="button primary small" onClick={() => onAnnounce('Branding saved.')}>Save changes</button>}>
      <div className="branding-layout">
        <div className="branding-form">
          <label>Logo
            <button className="dropzone small-dropzone" onClick={() => onAnnounce('Logo upload opened.')}><ImagePlus size={20} /><span>Upload logo</span></button>
          </label>
          <label>Primary color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="color-input" />
          </label>
          <label>Custom domain<input defaultValue="assets.summittech.com" /></label>
        </div>
        <div className="branding-preview">
          <span className="table-muted">Live preview</span>
          <div className="branding-preview-card">
            <div className="brand-mark" style={{ background: color }}>N</div>
            <strong>Summit Tech</strong>
            <button className="button small" style={{ background: color, color: '#fff' }}>Sign in</button>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

// ---------- Spending limits ----------
function SpendingLimitsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const limits = [
    { id: 'SL-1', category: 'Computers & tablets', threshold: '$1,500', approval: '$2,500' },
    { id: 'SL-2', category: 'Furniture', threshold: '$800', approval: '$1,500' },
    { id: 'SL-3', category: 'Vehicles', threshold: '$5,000', approval: '$15,000' },
    { id: 'SL-4', category: 'Tools & equipment', threshold: '$500', approval: '$2,000' },
  ]
  return (
    <SettingsCard title="Category spending limits" description="Purchases above the approval threshold route to an approval group." action={<button className="button secondary small" onClick={() => onAnnounce('New spending limit added.')}><Plus size={14} /> Add category</button>}>
      <DataTable
        rows={limits}
        columns={[
          { key: 'category', header: 'Category', render: (r) => <strong>{r.category}</strong> },
          { key: 'threshold', header: 'Threshold', render: (r) => r.threshold },
          { key: 'approval', header: 'Approval required above', render: (r) => r.approval },
          { key: 'edit', header: '', render: (r) => <button className="text-button" onClick={() => onAnnounce(`Editing ${r.category} limit.`)}>Edit</button> },
        ]}
      />
    </SettingsCard>
  )
}

// ---------- Roles & permissions ----------
const predefinedRoles = [
  { name: 'Organization admin', description: 'Full access to every workspace, billing, and organization-wide settings.', detail: 'Can create and delete workspaces, manage billing and payment methods, and override any permission set at the account level. Typically limited to founders or IT leadership.' },
  { name: 'Account admin', description: 'Manages a single workspace account including members, roles, and integrations.', detail: 'Can invite and remove members, configure integrations, and edit roles and permissions within their workspace, but cannot access other workspaces in the organization.' },
  { name: 'Module admin', description: 'Full control over one or more modules (e.g. Maintenance, Audits) without organization-wide access.', detail: 'Can configure workflows, checklists, and settings for the modules they administer, and manage records within those modules, but cannot manage members or billing.' },
  { name: 'Collaborator', description: 'Can view and update records they are assigned to, without administrative access.', detail: 'Can check assets in and out, complete assigned maintenance and inspection tasks, and view records shared with them, but cannot change workspace settings or roles.' },
]

function PredefinedRoleRow({ name, description, detail }: { name: string; description: string; detail: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="predefined-role-row">
      <button className="predefined-role-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div>
          <strong>{name}</strong>
          <span>{description}</span>
        </div>
        <ChevronDown size={16} className={`predefined-role-chevron ${open ? 'is-open' : ''}`} />
      </button>
      {open && <p className="predefined-role-detail">{detail}</p>}
    </div>
  )
}

interface CustomRole {
  id: string
  name: string
  description: string
  assignedUsers: number
  lastModified: string
}

const initialCustomRoles: CustomRole[] = [
  { id: 'CR-1', name: 'Field Technician', description: 'View and update maintenance work orders assigned to them.', assignedUsers: 6, lastModified: 'Aug 28, 2026' },
  { id: 'CR-2', name: 'Read-Only Auditor', description: 'View-only access across assets, audits, and reports for compliance review.', assignedUsers: 2, lastModified: 'Jul 14, 2026' },
  { id: 'CR-3', name: 'Department Manager', description: 'Manages assets and approvals for their assigned department.', assignedUsers: 9, lastModified: 'Sep 2, 2026' },
]

const resourceAreas = ['Assets', 'People', 'Locations', 'Maintenance', 'Audits', 'Inspections', 'Reports', 'Settings'] as const
const permissionActions = ['view', 'edit', 'create', 'delete'] as const
type ResourceKey = (typeof resourceAreas)[number]
type PermissionAction = (typeof permissionActions)[number]
type ResourcePermissions = Record<ResourceKey, Record<PermissionAction, boolean>>

function defaultResourcePermissions(): ResourcePermissions {
  return resourceAreas.reduce((acc, resource) => {
    acc[resource] = { view: true, edit: false, create: false, delete: false }
    return acc
  }, {} as ResourcePermissions)
}

const additionalFeatureList = [
  { key: 'submitForms', label: 'Submit forms', description: 'Allow this role to submit intake and request forms.' },
  { key: 'importRecords', label: 'Import records', description: 'Allow this role to bulk import records from spreadsheets.' },
  { key: 'exportRecords', label: 'Export records', description: 'Allow this role to export records and reports.' },
  { key: 'barcodeScanning', label: 'Barcode scanning', description: 'Allow this role to scan barcodes to look up or check out assets.' },
  { key: 'barcodeGeneration', label: 'Barcode generation', description: 'Allow this role to generate and print new asset tags.' },
  { key: 'activityStream', label: 'Activity stream access', description: 'Allow this role to view the workspace activity timeline.' },
  { key: 'lockingRecords', label: 'Locking records', description: 'Allow this role to lock records to prevent further edits.' },
] as const

function CreateRoleDrawer({ onClose, onSave }: { onClose: () => void; onSave: (role: { name: string; description: string }) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [resourcePermissions, setResourcePermissions] = useState<ResourcePermissions>(defaultResourcePermissions)
  const [limitRecords, setLimitRecords] = useState(false)
  const [showFilterBuilder, setShowFilterBuilder] = useState(false)
  const [filterLocation, setFilterLocation] = useState('')
  const [features, setFeatures] = useState<Record<string, boolean>>({ submitForms: true, importRecords: false, exportRecords: true, barcodeScanning: true, barcodeGeneration: false, activityStream: false, lockingRecords: false })

  function togglePermission(resource: ResourceKey, action: PermissionAction) {
    setResourcePermissions((current) => ({ ...current, [resource]: { ...current[resource], [action]: !current[resource][action] } }))
  }

  return (
    <DetailDrawer
      title="Create custom role"
      subtitle="Define exactly what this role can see and do."
      onClose={onClose}
      actions={<>
        <button className="button secondary small" onClick={onClose}>Cancel</button>
        <button className="button primary small" onClick={() => onSave({ name: name.trim() || 'Untitled role', description })}>Save role</button>
      </>}
    >
      <DrawerSection title="Role details">
        <div className="form-grid">
          <label>Role name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Field Technician" />
          </label>
          <label>Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this role for?" />
          </label>
        </div>
      </DrawerSection>

      <DrawerSection title="Resources">
        <div className="resource-table-wrap">
          <table className="resource-permission-table">
            <thead>
              <tr><th>Resource</th><th>View</th><th>Edit</th><th>Create</th><th>Delete</th></tr>
            </thead>
            <tbody>
              {resourceAreas.map((resource) => (
                <tr key={resource}>
                  <td><strong>{resource}</strong></td>
                  {permissionActions.map((action) => (
                    <td key={action}>
                      <input type="checkbox" aria-label={`${resource} ${action}`} checked={resourcePermissions[resource][action]} onChange={() => togglePermission(resource, action)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DrawerSection>

      <DrawerSection title="Record access">
        <ToggleRow label="Limit record permissions" description="Restrict this role to only records matching a condition." checked={limitRecords} onChange={setLimitRecords} />
        {limitRecords && (
          <div className="condition-builder">
            {!showFilterBuilder ? (
              <button className="button secondary small" onClick={() => setShowFilterBuilder(true)}><Filter size={14} /> Filter</button>
            ) : (
              <div className="condition-row">
                <span>Show only records where</span>
                <select value="Location" disabled><option>Location</option></select>
                <span>=</span>
                <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} aria-label="Filter location value">
                  <option value="">Select a location</option>
                  {locations.map((loc) => <option key={loc.id} value={loc.name}>{loc.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </DrawerSection>

      <DrawerSection title="Additional features">
        {additionalFeatureList.map((feature) => (
          <ToggleRow
            key={feature.key}
            label={feature.label}
            description={feature.description}
            checked={features[feature.key]}
            onChange={(checked) => setFeatures((current) => ({ ...current, [feature.key]: checked }))}
          />
        ))}
      </DrawerSection>
    </DetailDrawer>
  )
}

function RolesSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const permissions = ['View assets', 'Create and edit assets', 'Check assets in and out', 'Manage maintenance', 'Run physical audits', 'Export reports']
  const [customRoles, setCustomRoles] = useState<CustomRole[]>(initialCustomRoles)
  const [showRoleDrawer, setShowRoleDrawer] = useState(false)

  function handleSaveRole({ name, description }: { name: string; description: string }) {
    setCustomRoles((current) => [...current, { id: `CR-${current.length + 1}`, name, description: description || 'Custom role', assignedUsers: 0, lastModified: 'Today' }])
    setShowRoleDrawer(false)
    onAnnounce(`${name} role created.`)
  }

  return (
    <>
      <SettingsCard title="Feature permissions" description="Toggle access by role. Owners and admins retain full access." action={<button className="button primary small" onClick={() => onAnnounce('Permissions saved.')}>Save changes</button>}>
        {permissions.map((label, index) => (
          <div className="permission-row" key={label}>
            <div>
              <strong>{label}</strong>
              <span>{index % 2 ? 'Create, update, and manage records' : 'View and review workspace information'}</span>
            </div>
            <div className="permission-switches">
              <span className="role-label">Employee</span>
              <button className={`fake-switch ${index < 2 ? 'on' : ''}`} aria-label={`${label} employee permission`} />
              <span className="role-label">Manager</span>
              <button className="fake-switch on" aria-label={`${label} manager permission`} />
              <span className="role-label">Admin</span>
              <span className="lock-badge">Full access</span>
            </div>
          </div>
        ))}
      </SettingsCard>

      <SettingsCard title="Predefined roles" description="Built-in roles available to every workspace. These cannot be edited or removed.">
        <div className="predefined-role-list">
          {predefinedRoles.map((role) => <PredefinedRoleRow key={role.name} {...role} />)}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Custom roles"
        description="Roles created by your workspace with specific resource and record permissions."
        action={<button className="button secondary small" onClick={() => setShowRoleDrawer(true)}><Plus size={14} /> Add</button>}
      >
        <DataTable
          rows={customRoles}
          columns={[
            { key: 'name', header: 'Role name', render: (r) => <strong>{r.name}</strong> },
            { key: 'assignedUsers', header: 'Assigned users', render: (r) => r.assignedUsers },
            { key: 'lastModified', header: 'Last modified', render: (r) => r.lastModified },
          ]}
          emptyState={<EmptyState title="No custom roles yet" description="Create a role to set specific resource and record permissions." ctaLabel="Add custom role" onCta={() => setShowRoleDrawer(true)} />}
        />
      </SettingsCard>

      {showRoleDrawer && <CreateRoleDrawer onClose={() => setShowRoleDrawer(false)} onSave={handleSaveRole} />}
    </>
  )
}

// ---------- Approval groups ----------
function ApprovalGroupsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const groups = [
    { id: 'AG-1', name: 'Equipment approvals', members: 'JS, ML, NP', threshold: 'Above $2,000', category: 'Tools & equipment' },
    { id: 'AG-2', name: 'IT hardware approvals', members: 'JS, AR', threshold: 'Above $2,500', category: 'Computers & tablets' },
    { id: 'AG-3', name: 'Fleet approvals', members: 'JS, ML, DW', threshold: 'Above $15,000', category: 'Vehicles' },
  ]
  return (
    <SettingsCard title="Approval routing" description="Purchases above a category threshold route to the matching group." action={<button className="button secondary small" onClick={() => onAnnounce('New approval group created.')}><Plus size={14} /> Add group</button>}>
      <DataTable
        rows={groups}
        columns={[
          { key: 'name', header: 'Group name', render: (r) => <strong>{r.name}</strong> },
          { key: 'members', header: 'Members', render: (r) => <span className="avatar-stack">{r.members}</span> },
          { key: 'threshold', header: 'Approval threshold', render: (r) => r.threshold },
          { key: 'category', header: 'Linked category', render: (r) => r.category },
        ]}
      />
    </SettingsCard>
  )
}

// ---------- Team ----------
function TeamSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const members = [
    { id: 'TM-1', name: 'Jamie Smith', role: 'Administrator', status: 'Active', lastActive: 'Active now' },
    { id: 'TM-2', name: 'Ava Rodriguez', role: 'Manager', status: 'Active', lastActive: 'Today, 8:40 AM' },
    { id: 'TM-3', name: 'Marcus Lee', role: 'Manager', status: 'Active', lastActive: 'Yesterday' },
    { id: 'TM-4', name: 'Theo Grant', role: 'Employee', status: 'Invited', lastActive: '—' },
  ]
  return (
      <SettingsCard title="Workspace members" description="Manage who has access to Summit Tech's AssetGriffin workspace." action={<button className="button primary small" onClick={() => onAnnounce('Invite form opened.')}><Plus size={14} /> Invite member</button>}>
      <DataTable
        rows={members}
        columns={[
          { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
          { key: 'role', header: 'Role', render: (r) => r.role },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { key: 'lastActive', header: 'Last active', render: (r) => r.lastActive },
          { key: 'actions', header: '', render: (r) => <button className="text-button" onClick={() => onAnnounce(`Managing access for ${r.name}.`)}>Change role</button> },
        ]}
      />
    </SettingsCard>
  )
}

// ---------- Departments ----------
function DepartmentsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const departments = [
    { id: 'DP-1', name: 'Engineering', head: 'Jordan Lee', assetCount: 412, budget: '$180,000', members: 18 },
    { id: 'DP-2', name: 'Operations', head: 'Marcus Lee', assetCount: 320, budget: '$95,000', members: 22 },
    { id: 'DP-3', name: 'Finance', head: 'Nora Patel', assetCount: 64, budget: '$40,000', members: 6 },
    { id: 'DP-4', name: 'Design', head: 'Theo Grant', assetCount: 41, budget: '$28,000', members: 5 },
  ]
  return (
    <SettingsCard title="Departments" description="Group people and assets for reporting and budget tracking." action={<button className="button secondary small" onClick={() => onAnnounce('New department created.')}><Plus size={14} /> Add department</button>}>
      <DataTable
        rows={departments}
        columns={[
          { key: 'name', header: 'Department', render: (r) => <strong>{r.name}</strong> },
          { key: 'head', header: 'Head', render: (r) => r.head },
          { key: 'assetCount', header: 'Asset count', render: (r) => r.assetCount },
          { key: 'budget', header: 'Budget', render: (r) => r.budget },
          { key: 'members', header: 'Team members', render: (r) => r.members },
        ]}
      />
    </SettingsCard>
  )
}

// ---------- Workflows ----------
function WorkflowsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [rules, setRules] = useState([
    { id: 'WF-1', name: 'Overdue check-in reminder', trigger: 'Check-out age > 30 days', action: 'Email assignee + manager', enabled: true, lastTriggered: 'Today, 6:00 AM' },
    { id: 'WF-2', name: 'High-value approval', trigger: 'Purchase above category threshold', action: 'Route to approval group', enabled: true, lastTriggered: 'Sep 6, 2026' },
    { id: 'WF-3', name: 'Warranty expiration alert', trigger: 'Warranty expires in 30 days', action: 'Notify asset owner', enabled: false, lastTriggered: 'Never' },
  ])
  return (
    <SettingsCard title="Automation rules" description="Workflows run automatically based on asset and audit events." action={<button className="button secondary small" onClick={() => onAnnounce('New workflow created.')}><Plus size={14} /> Add workflow</button>}>
      <DataTable
        rows={rules}
        columns={[
          { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
          { key: 'trigger', header: 'Trigger', render: (r) => r.trigger },
          { key: 'action', header: 'Action', render: (r) => r.action },
          { key: 'lastTriggered', header: 'Last triggered', render: (r) => r.lastTriggered },
          { key: 'enabled', header: 'Enabled', render: (r) => (
            <button className={`fake-switch ${r.enabled ? 'on' : ''}`} aria-label={`Toggle ${r.name}`} onClick={() => setRules((current) => current.map((rule) => rule.id === r.id ? { ...rule, enabled: !rule.enabled } : rule))} />
          ) },
        ]}
      />
    </SettingsCard>
  )
}

// ---------- Audit log ----------
function AuditLogSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const [userFilter, setUserFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const events = [
    { id: 'EV-1', timestamp: 'Sep 8, 2026 · 9:14 AM', user: 'Maya Patel', action: 'Checked out', entityType: 'Asset', entity: 'MacBook Pro 14” (NST-1048)' },
    { id: 'EV-2', timestamp: 'Sep 8, 2026 · 8:02 AM', user: 'Jamie Smith', action: 'Generated report', entityType: 'Report', entity: 'Asset register' },
    { id: 'EV-3', timestamp: 'Sep 7, 2026 · 4:41 PM', user: 'Marcus Lee', action: 'Created work order', entityType: 'Maintenance', entity: 'Hilti TE 30-A36' },
    { id: 'EV-4', timestamp: 'Sep 6, 2026 · 2:15 PM', user: 'Nora Patel', action: 'Approved purchase', entityType: 'Spending limit', entity: 'Sony FX3 Camera' },
    { id: 'EV-5', timestamp: 'Sep 5, 2026 · 11:03 AM', user: 'Jamie Smith', action: 'Updated permissions', entityType: 'Role', entity: 'Manager role' },
    { id: 'EV-6', timestamp: 'Sep 5, 2026 · 9:47 AM', user: 'Compass', action: 'Created asset', entityType: 'Asset', entity: 'Dell U2723QE (NST-1052)' },
  ]
  const filtered = events.filter((e) => (!userFilter || e.user === userFilter) && (!actionFilter || e.action === actionFilter))
  return (
    <SettingsCard
      title="Activity timeline"
      description="Every important action across your workspace, retained for 12 months."
      action={<button className="button secondary small" onClick={() => onAnnounce('Audit log exported.')}><ArrowDownToLine size={14} /> Export log</button>}
    >
      <div className="table-toolbar list-toolbar" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <select className="filter-select" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} aria-label="Filter by user">
          <option value="">User</option>
          {Array.from(new Set(events.map((e) => e.user))).map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select className="filter-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} aria-label="Filter by action">
          <option value="">Action</option>
          {Array.from(new Set(events.map((e) => e.action))).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="filter-button" onClick={() => { setUserFilter(''); setActionFilter('') }}><RotateCcw size={13} /> Reset</button>
      </div>
      <DataTable
        rows={filtered}
        columns={[
          { key: 'timestamp', header: 'Timestamp', mono: true, render: (r) => r.timestamp },
          { key: 'user', header: 'User', render: (r) => <strong>{r.user}</strong> },
          { key: 'action', header: 'Action', render: (r) => r.action },
          { key: 'entityType', header: 'Entity type', render: (r) => r.entityType },
          { key: 'entity', header: 'Entity name', render: (r) => r.entity },
        ]}
      />
    </SettingsCard>
  )
}

export function SettingsSection({ section, onAnnounce, onNavigateSection, onStartOnboarding }: { section: string; onAnnounce: Announce; onNavigateSection?: (section: string) => void; onStartOnboarding?: () => void }) {
  return (
    <div className="settings-page">
      <SettingsHero section={section} />
      {section === 'Profile' && <ProfileSettings onAnnounce={onAnnounce} />}
      {section === 'Billing' && <BillingSettings onAnnounce={onAnnounce} />}
      {section === 'Notifications' && <NotificationsSettings onAnnounce={onAnnounce} />}
      {section === 'Preferences' && <PreferencesSettings onAnnounce={onAnnounce} onStartOnboarding={onStartOnboarding} />}
      {section === 'Security' && <SecuritySettings onAnnounce={onAnnounce} />}
      {section === 'Integrations' && <IntegrationsSettings onAnnounce={onAnnounce} onNavigateSection={onNavigateSection} />}
      {section === 'Developer' && <DeveloperSettings onAnnounce={onAnnounce} />}
      {section === 'Branding' && <BrandingSettings onAnnounce={onAnnounce} />}
      {section === 'Spending limits' && <SpendingLimitsSettings onAnnounce={onAnnounce} />}
      {section === 'Roles & permissions' && <RolesSettings onAnnounce={onAnnounce} />}
      {section === 'Approval groups' && <ApprovalGroupsSettings onAnnounce={onAnnounce} />}
      {section === 'Team' && <TeamSettings onAnnounce={onAnnounce} />}
      {section === 'Departments' && <DepartmentsSettings onAnnounce={onAnnounce} />}
      {section === 'Workflows' && <WorkflowsSettings onAnnounce={onAnnounce} />}
      {section === 'Audit log' && <AuditLogSettings onAnnounce={onAnnounce} />}
    </div>
  )
}
