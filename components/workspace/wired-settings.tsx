'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_NOTIFICATIONS } from '@/lib/settings-types'
import {
  ArrowDownToLine,
  CheckCircle2,
  ChevronDown,
  Filter,
  ImagePlus,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { useWorkspaceSettings } from '@/components/workspace/settings-context'
import { GriffinBillingCredits } from '@/components/workspace/griffin-billing-credits'
import { DataTable, DetailDrawer, DrawerSection, EmptyState, StatusBadge, ToggleRow } from './primitives'
import type { NotificationPreferences, UserPreferences } from '@/lib/settings-types'

type Announce = (message: string) => void

type MfaFactorList = {
  totp?: Array<{ status: string }>
  phone?: Array<{ status: string }>
}

function hasVerifiedMfaFactor(factors: MfaFactorList | null | undefined): boolean {
  if (!factors) return false
  return (
    (factors.totp ?? []).some((factor) => factor.status === 'verified') ||
    (factors.phone ?? []).some((factor) => factor.status === 'verified')
  )
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function SettingsCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function WiredProfileSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection, loading } = useWorkspaceSettings()
  const profile = data?.profile
  const orgName = data?.organization.name ?? 'your workspace'
  const [fullName, setFullName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  useEffect(() => {
    if (!profile) return
    setFullName(profile.fullName ?? '')
    setJobTitle(profile.jobTitle ?? '')
    setTimezone(profile.timezone)
  }, [profile])

  async function save() {
    try {
      await patchSection('profile', { fullName, jobTitle, timezone })
      onAnnounce('Profile saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save profile.')
    }
  }

  if (loading && !profile) return <EmptyState title="Loading profile…" description="Fetching your account details." />

  return (
    <SettingsCard title="Personal information" description={`This is how you appear across ${orgName}.`} action={<button className="button primary small" onClick={() => void save()}>Save changes</button>}>
      <div className="profile-form">
        <div className="avatar-upload">
          <div className="profile-avatar large">{initialsFromName(fullName || profile?.email || '?')}</div>
          <button className="button secondary small" onClick={() => onAnnounce('Avatar upload will use Supabase Storage in a future release.')}><ImagePlus size={14} /> Upload photo</button>
        </div>
        <div className="form-grid">
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
          <label>Email address<input value={profile?.email ?? ''} readOnly /></label>
          <label>Job title<input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></label>
          <label>Timezone
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
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

export function WiredBillingSettings({ onAnnounce, creditPurchaseNotice, checkoutSessionId }: { onAnnounce: Announce; creditPurchaseNotice?: 'cancelled' | null; checkoutSessionId?: string | null }) {
  const { data } = useWorkspaceSettings()
  const billing = data?.billing
  const orgName = data?.organization.name ?? 'Your workspace'
  const assetLimit = billing?.assetLimit ?? 2000
  const assetCount = billing?.assetCount ?? 0
  const usagePercent = billing ? Math.min(100, Math.round((assetCount / assetLimit) * 100)) : 0
  const assetsRemaining = Math.max(0, assetLimit - assetCount)

  return (
    <>
      <SettingsCard title="Current plan" description={`${orgName} is on the ${billing?.plan ?? 'Free'} plan.`} action={<button className="button secondary small" onClick={() => onAnnounce('Subscription billing is coming soon. GriffinEye credits are live below.')}>Change plan</button>}>
        <div className="billing-plan-row">
          <div className="plan-tier-card">
            <span className="eyebrow">CURRENT PLAN</span>
            <h3>{billing?.plan ?? 'Free'}</h3>
            <p>{billing?.monthlyPriceLabel ?? '$0/month'} · asset tracking included</p>
          </div>
          <div className="plan-usage">
            <div className="plan-usage-top"><span>Asset usage</span><strong>{assetCount.toLocaleString()} / {assetLimit.toLocaleString()} assets</strong></div>
            <div className="progress"><i style={{ width: `${usagePercent}%` }} /></div>
            <span className="table-muted">{assetsRemaining} assets remaining on the {billing?.plan ?? 'Free'} plan</span>
          </div>
        </div>
      </SettingsCard>
      <GriffinBillingCredits purchaseNotice={creditPurchaseNotice} checkoutSessionId={checkoutSessionId} />
    </>
  )
}

export function WiredNotificationsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection, loading } = useWorkspaceSettings()
  const [state, setState] = useState<NotificationPreferences>(DEFAULT_NOTIFICATIONS)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!data?.profile.notifications) return
    setState(data.profile.notifications)
    setInitialized(true)
  }, [data?.profile.notifications])

  const rows: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'overdue', label: 'Overdue check-ins', description: 'Alert me when an assigned asset is past its expected return date.' },
    { key: 'auditDue', label: 'Audit due', description: 'Alert me when a scheduled audit is approaching its deadline.' },
    { key: 'maintenanceDue', label: 'Maintenance due', description: 'Alert me when a work order is scheduled or overdue.' },
    { key: 'lowStock', label: 'Low stock', description: 'Alert me when available inventory for a category runs low.' },
    { key: 'warrantyExpiring', label: 'Warranty expiring', description: 'Alert me 30 days before an asset warranty expires.' },
  ]

  async function save() {
    try {
      await patchSection('notifications', state)
      onAnnounce('Notification preferences saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save notifications.')
    }
  }

  const controlsReady = initialized && !loading

  return (
    <SettingsCard title="Alert preferences" description={`Changes apply to your account across ${data?.organization.name ?? 'your workspace'}.`} action={<button className="button primary small" onClick={() => void save()} disabled={!controlsReady}>Save changes</button>}>
      {rows.map((row) => (
        <ToggleRow key={row.key} label={row.label} description={row.description} checked={state[row.key]} onChange={(checked) => setState((s) => ({ ...s, [row.key]: checked }))} disabled={!controlsReady} />
      ))}
    </SettingsCard>
  )
}

export function WiredPreferencesSettings({ onAnnounce, onStartOnboarding }: { onAnnounce: Announce; onStartOnboarding?: () => void }) {
  const { data, patchSection } = useWorkspaceSettings()
  const [prefs, setPrefs] = useState<UserPreferences | null>(null)
  if (data?.profile.preferences && !prefs) setPrefs(data.profile.preferences)

  async function save() {
    if (!prefs) return
    try {
      await patchSection('preferences', prefs)
      onAnnounce('Preferences saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save preferences.')
    }
  }

  return (
    <>
      <SettingsCard title="Workspace defaults" description="These settings only affect how the workspace looks and feels for you." action={<button className="button primary small" onClick={() => void save()}>Save changes</button>}>
        <div className="form-grid">
          <label>Date format
            <select value={prefs?.dateFormat ?? 'MM/DD/YYYY'} onChange={(e) => setPrefs((p) => ({ ...(p ?? data!.profile.preferences), dateFormat: e.target.value }))}>
              <option>MM/DD/YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option>
            </select>
          </label>
          <label>Default landing page
            <select value={prefs?.landingPage ?? 'Overview'} onChange={(e) => setPrefs((p) => ({ ...(p ?? data!.profile.preferences), landingPage: e.target.value }))}>
              <option>Overview</option><option>Assets</option><option>Maintenance</option><option>Reports</option>
            </select>
          </label>
          <label>Table density
            <select value={prefs?.tableDensity ?? 'Comfortable'} onChange={(e) => setPrefs((p) => ({ ...(p ?? data!.profile.preferences), tableDensity: e.target.value }))}>
              <option>Comfortable</option><option>Compact</option>
            </select>
          </label>
          <label>Theme
            <select value={prefs?.theme ?? 'Light'} onChange={(e) => setPrefs((p) => ({ ...(p ?? data!.profile.preferences), theme: e.target.value }))}>
              <option>Light</option><option>Dark</option><option>System</option>
            </select>
          </label>
        </div>
      </SettingsCard>
      <SettingsCard title="Start over with a template" description="Reset your workspace using one of AssetGriffin's persona-based starter templates.">
        <div className="security-status-row">
          <div className="security-status-icon"><Sparkles size={20} /></div>
          <div><strong>Not sure your current setup fits?</strong><span>Reopen the template gallery to reconfigure your categories and sample records.</span></div>
          <button className="button secondary small" onClick={onStartOnboarding}>Start over with a template</button>
        </div>
      </SettingsCard>
    </>
  )
}

export function WiredSecuritySettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data } = useWorkspaceSettings()
  const security = data?.organization.settings?.security
  const [mfaEnrolled, setMfaEnrolled] = useState<boolean | null>(null)
  const [mfaBusy, setMfaBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMfaState() {
      try {
        const supabase = createClient()
        const { data: factors, error } = await supabase.auth.mfa.listFactors()
        if (cancelled) return
        if (error) {
          setMfaEnrolled(false)
          return
        }
        setMfaEnrolled(hasVerifiedMfaFactor(factors))
      } catch {
        if (!cancelled) setMfaEnrolled(false)
      }
    }

    void loadMfaState()
    return () => {
      cancelled = true
    }
  }, [])

  async function refreshMfaState() {
    const supabase = createClient()
    const { data: factors, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    setMfaEnrolled(hasVerifiedMfaFactor(factors))
  }

  async function toggle2fa() {
    if (mfaBusy) return
    setMfaBusy(true)
    try {
      const supabase = createClient()

      if (mfaEnrolled) {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
        if (listError) throw listError
        for (const factor of [...(factors?.totp ?? []), ...(factors?.phone ?? [])]) {
          const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
          if (unenrollError) throw unenrollError
        }
        await refreshMfaState()
        onAnnounce('2FA disabled.')
        return
      }

      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator app',
      })
      if (enrollError) throw enrollError
      if (!enrollData?.id) throw new Error('Could not start 2FA enrollment.')

      const code = window.prompt(
        `Scan this secret in your authenticator app: ${enrollData.totp?.secret ?? 'see Supabase dashboard'}\n\nEnter the 6-digit verification code:`,
      )
      if (!code?.trim()) {
        await supabase.auth.mfa.unenroll({ factorId: enrollData.id })
        onAnnounce('2FA enrollment cancelled. Your account remains without 2FA.')
        return
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challengeData.id,
        code: code.trim(),
      })
      if (verifyError) {
        await supabase.auth.mfa.unenroll({ factorId: enrollData.id })
        throw verifyError
      }

      await refreshMfaState()
      onAnnounce('2FA enabled after successful verification.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not update 2FA settings.')
    } finally {
      setMfaBusy(false)
    }
  }

  return (
    <>
      <SettingsCard title="Two-factor authentication" description="Add an extra layer of security to your account.">
        <div className="security-status-row">
          <div className="security-status-icon"><ShieldCheck size={20} /></div>
          <div>
            <strong>{mfaEnrolled ? '2FA is active' : '2FA is currently disabled'}</strong>
            <span>{mfaEnrolled ? 'Your account has a verified authenticator factor enrolled.' : 'Enabling 2FA starts Supabase MFA enrollment for your account only.'}</span>
          </div>
          <button className="button primary small" onClick={() => void toggle2fa()} disabled={mfaBusy || mfaEnrolled === null}>{mfaBusy ? 'Working…' : mfaEnrolled ? 'Disable 2FA' : 'Enable 2FA'}</button>
        </div>
      </SettingsCard>
      <SettingsCard title="Active sessions" description="Your current browser session.">
        <DataTable rows={[{ id: 'current', device: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'This device', location: 'Current session', lastActive: 'Active now' }]} columns={[
          { key: 'device', header: 'Device', render: (r) => <strong>{r.device}</strong> },
          { key: 'location', header: 'Location', render: (r) => r.location },
          { key: 'lastActive', header: 'Last active', render: (r) => r.lastActive },
        ]} />
      </SettingsCard>
      <SettingsCard title="Password policy" description={`Enforced for every member of ${data?.organization.name ?? 'your workspace'}.`}>
        <div className="field-grid">
          <div className="field-item"><span>Minimum length</span><strong>{security?.passwordMinLength ?? 12} characters</strong></div>
          <div className="field-item"><span>Requires</span><strong>{security?.passwordRequiresSymbol ? 'Uppercase, number, symbol' : 'Standard complexity'}</strong></div>
          <div className="field-item"><span>Expiration</span><strong>Every {security?.passwordExpirationDays ?? 90} days</strong></div>
          <div className="field-item"><span>SSO</span><strong>{security?.ssoConnected ? 'Connected' : 'Not connected'}</strong></div>
        </div>
      </SettingsCard>
    </>
  )
}

export function WiredBrandingSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection } = useWorkspaceSettings()
  const org = data?.organization
  const [color, setColor] = useState('')
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  useEffect(() => {
    if (!org) return
    setColor(org.primaryColor)
    setDomain(org.customDomain ?? '')
    setName(org.name)
  }, [org])

  async function save() {
    try {
      await patchSection('branding', { primaryColor: color, customDomain: domain, name })
      onAnnounce('Branding saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save branding.')
    }
  }

  return (
    <SettingsCard title="Organization identity" description="Your logo and colors appear on shared reports and the login screen." action={<button className="button primary small" onClick={() => void save()} disabled={!data?.profile.isAdmin}>Save changes</button>}>
      <div className="branding-layout">
        <div className="branding-form">
          <label>Organization name<input value={name} onChange={(e) => setName(e.target.value)} disabled={!data?.profile.isAdmin} /></label>
          <label>Primary color<input type="color" value={color || '#2FA391'} onChange={(e) => setColor(e.target.value)} className="color-input" disabled={!data?.profile.isAdmin} /></label>
          <label>Custom domain<input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="assets.yourcompany.com" disabled={!data?.profile.isAdmin} /></label>
        </div>
        <div className="branding-preview">
          <span className="table-muted">Live preview</span>
          <div className="branding-preview-card">
            <div className="brand-mark" style={{ background: color || '#2FA391' }}>{name.slice(0, 1).toUpperCase() || 'A'}</div>
            <strong>{name || 'Workspace'}</strong>
            <button className="button small" style={{ background: color || '#2FA391', color: '#fff' }}>Sign in</button>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}

export function WiredSpendingLimitsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, postSection, deleteSection } = useWorkspaceSettings()
  const limits = data?.spendingLimits ?? []

  async function addLimit() {
    const category = window.prompt('Category name')
    if (!category?.trim()) return
    try {
      await postSection('spending-limits', { category, threshold: '$1,000', approval: '$2,000' })
      onAnnounce(`Added spending limit for ${category}.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not add limit.')
    }
  }

  return (
    <SettingsCard title="Category spending limits" description="Purchases above the approval threshold route to an approval group." action={<button className="button secondary small" onClick={() => void addLimit()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add category</button>}>
      <DataTable rows={limits} columns={[
        { key: 'category', header: 'Category', render: (r) => <strong>{r.category}</strong> },
        { key: 'threshold', header: 'Threshold', render: (r) => r.threshold },
        { key: 'approval', header: 'Approval required above', render: (r) => r.approval },
        { key: 'delete', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('spending-limits', r.id).then(() => onAnnounce('Limit removed.')).catch((e) => onAnnounce(e.message))}>Remove</button> },
      ]} emptyState={<EmptyState title="No spending limits" description="Add category guardrails for your team." ctaLabel="Add category" onCta={() => void addLimit()} />} />
    </SettingsCard>
  )
}

const predefinedRoles = [
  { name: 'Organization admin', description: 'Full access to every workspace, billing, and organization-wide settings.' },
  { name: 'Account admin', description: 'Manages a single workspace account including members, roles, and integrations.' },
  { name: 'Collaborator', description: 'Can view and update records they are assigned to, without administrative access.' },
]

export function WiredRolesSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection, postSection, deleteSection } = useWorkspaceSettings()
  const [showDrawer, setShowDrawer] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [permissions, setPermissions] = useState(data?.featurePermissions ?? [])

  useEffect(() => {
    if (data?.featurePermissions) setPermissions(data.featurePermissions)
  }, [data?.featurePermissions])

  async function savePermissions() {
    try {
      await patchSection('feature-permissions', {
        updates: permissions.map((row) => ({
          id: row.id,
          employeeEnabled: row.employeeEnabled,
          managerEnabled: row.managerEnabled,
        })),
      })
      onAnnounce('Permissions saved.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save permissions.')
    }
  }

  async function createRole() {
    try {
      await postSection('custom-roles', { name: roleName, description: roleDescription })
      setShowDrawer(false)
      setRoleName('')
      setRoleDescription('')
      onAnnounce(`${roleName} role created.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not create role.')
    }
  }

  return (
    <>
      <SettingsCard title="Feature permissions" description="Toggle access by role. Owners and admins retain full access." action={<button className="button primary small" onClick={() => void savePermissions()} disabled={!data?.profile.isAdmin}>Save changes</button>}>
        {permissions.map((row) => (
          <div className="permission-row" key={row.id}>
            <div><strong>{row.label}</strong><span>{row.description}</span></div>
            <div className="permission-switches">
              <span className="role-label">Employee</span>
              <button className={`fake-switch ${row.employeeEnabled ? 'on' : ''}`} aria-label={`${row.label} employee`} onClick={() => setPermissions((current) => current.map((item) => item.id === row.id ? { ...item, employeeEnabled: !item.employeeEnabled } : item))} />
              <span className="role-label">Manager</span>
              <button className={`fake-switch ${row.managerEnabled ? 'on' : ''}`} aria-label={`${row.label} manager`} onClick={() => setPermissions((current) => current.map((item) => item.id === row.id ? { ...item, managerEnabled: !item.managerEnabled } : item))} />
            </div>
          </div>
        ))}
      </SettingsCard>
      <SettingsCard title="Predefined roles" description="Built-in roles available to every workspace.">
        <div className="predefined-role-list">
          {predefinedRoles.map((role) => (
            <div className="predefined-role-row" key={role.name}><div><strong>{role.name}</strong><span>{role.description}</span></div></div>
          ))}
        </div>
      </SettingsCard>
      <SettingsCard title="Custom roles" description="Roles created by your workspace." action={<button className="button secondary small" onClick={() => setShowDrawer(true)} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add</button>}>
        <DataTable rows={data?.customRoles ?? []} columns={[
          { key: 'name', header: 'Role name', render: (r) => <strong>{r.name}</strong> },
          { key: 'description', header: 'Description', render: (r) => r.description },
          { key: 'delete', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('custom-roles', r.id).then(() => onAnnounce('Role deleted.'))}>Delete</button> },
        ]} />
      </SettingsCard>
      {showDrawer && (
        <DetailDrawer title="Create custom role" subtitle="Define what this role can do." onClose={() => setShowDrawer(false)} actions={<><button className="button secondary small" onClick={() => setShowDrawer(false)}>Cancel</button><button className="button primary small" onClick={() => void createRole()}>Save role</button></>}>
          <DrawerSection title="Role details">
            <div className="form-grid">
              <label>Role name<input value={roleName} onChange={(e) => setRoleName(e.target.value)} /></label>
              <label>Description<input value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} /></label>
            </div>
          </DrawerSection>
        </DetailDrawer>
      )}
    </>
  )
}

export function WiredApprovalGroupsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, postSection, deleteSection } = useWorkspaceSettings()

  async function addGroup() {
    const name = window.prompt('Approval group name')
    if (!name?.trim()) return
    try {
      await postSection('approval-groups', { name, members: '', threshold: 'Above $2,000', category: 'General' })
      onAnnounce(`${name} created.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not create group.')
    }
  }

  return (
    <SettingsCard title="Approval routing" description="Purchases above a category threshold route to the matching group." action={<button className="button secondary small" onClick={() => void addGroup()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add group</button>}>
      <DataTable rows={data?.approvalGroups ?? []} columns={[
        { key: 'name', header: 'Group name', render: (r) => <strong>{r.name}</strong> },
        { key: 'members', header: 'Members', render: (r) => <span className="avatar-stack">{r.members || '—'}</span> },
        { key: 'threshold', header: 'Approval threshold', render: (r) => r.threshold },
        { key: 'category', header: 'Linked category', render: (r) => r.category },
        { key: 'delete', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('approval-groups', r.id)}>Remove</button> },
      ]} emptyState={<EmptyState title="No approval groups" description="Create a group to route high-value purchases." ctaLabel="Add group" onCta={() => void addGroup()} />} />
    </SettingsCard>
  )
}

export function WiredTeamSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection } = useWorkspaceSettings()
  const orgName = data?.organization.name ?? 'your workspace'

  async function changeRole(memberId: string, name: string) {
    const role = window.prompt(`Set role for ${name} (owner, admin, member)`)
    if (!role || !['owner', 'admin', 'member'].includes(role)) return
    try {
      await patchSection('team', { memberId, role })
      onAnnounce(`Updated role for ${name}.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not update role.')
    }
  }

  return (
    <SettingsCard title="Workspace members" description={`Manage who has access to ${orgName}.`} action={<button className="button primary small" onClick={() => onAnnounce('Member invites require Supabase Auth admin — use your project dashboard for now.')} disabled={!data?.profile.isAdmin}><Plus size={14} /> Invite member</button>}>
      <DataTable rows={data?.team ?? []} columns={[
        { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
        { key: 'role', header: 'Role', render: (r) => r.role },
        { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        { key: 'lastActive', header: 'Last active', render: (r) => r.lastActive },
        { key: 'actions', header: '', render: (r) => data?.profile.isAdmin ? <button className="text-button" onClick={() => void changeRole(r.id, r.name)}>Change role</button> : null },
      ]} />
    </SettingsCard>
  )
}

export function WiredDepartmentsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, postSection, deleteSection } = useWorkspaceSettings()

  async function addDepartment() {
    const name = window.prompt('Department name')
    if (!name?.trim()) return
    try {
      await postSection('departments', { name, head: '', budget: '$0', members: 0, assetCount: 0 })
      onAnnounce(`${name} department created.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not create department.')
    }
  }

  return (
    <SettingsCard title="Departments" description="Group people and assets for reporting and budget tracking." action={<button className="button secondary small" onClick={() => void addDepartment()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add department</button>}>
      <DataTable rows={data?.departments ?? []} columns={[
        { key: 'name', header: 'Department', render: (r) => <strong>{r.name}</strong> },
        { key: 'head', header: 'Head', render: (r) => r.head || '—' },
        { key: 'assetCount', header: 'Asset count', render: (r) => r.assetCount },
        { key: 'budget', header: 'Budget', render: (r) => r.budget },
        { key: 'members', header: 'Team members', render: (r) => r.members },
        { key: 'delete', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('departments', r.id)}>Remove</button> },
      ]} emptyState={<EmptyState title="No departments" description="Add departments to organize your workspace." ctaLabel="Add department" onCta={() => void addDepartment()} />} />
    </SettingsCard>
  )
}

export function WiredWorkflowsSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, patchSection, postSection, deleteSection } = useWorkspaceSettings()

  async function toggleRule(id: string, enabled: boolean) {
    try {
      await patchSection('workflows', { id, enabled: !enabled })
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not update workflow.')
    }
  }

  async function addWorkflow() {
    const name = window.prompt('Workflow name')
    if (!name?.trim()) return
    try {
      await postSection('workflows', { name, trigger: 'Custom trigger', action: 'Custom action' })
      onAnnounce(`${name} workflow created.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not create workflow.')
    }
  }

  return (
    <SettingsCard title="Automation rules" description="Workflows run automatically based on asset and audit events." action={<button className="button secondary small" onClick={() => void addWorkflow()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add workflow</button>}>
      <DataTable rows={data?.workflows ?? []} columns={[
        { key: 'name', header: 'Rule', render: (r) => <strong>{r.name}</strong> },
        { key: 'trigger', header: 'Trigger', render: (r) => r.trigger },
        { key: 'action', header: 'Action', render: (r) => r.action },
        { key: 'enabled', header: 'Enabled', render: (r) => <button className={`fake-switch ${r.enabled ? 'on' : ''}`} onClick={() => void toggleRule(r.id, r.enabled)} aria-label={`Toggle ${r.name}`} /> },
        { key: 'delete', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('workflows', r.id)}>Remove</button> },
      ]} />
    </SettingsCard>
  )
}

const INTEGRATION_CATALOG = [
  { key: 'slack', name: 'Slack', category: 'Communication', popular: true },
  { key: 'microsoft_teams', name: 'Microsoft Teams', category: 'Communication' },
  { key: 'email_digests', name: 'Email digests', category: 'Communication', kind: 'toggle' as const },
  { key: 'okta', name: 'Okta', category: 'Identity & access', popular: true },
  { key: 'google_workspace', name: 'Google Workspace', category: 'Identity & access' },
  { key: 'quickbooks', name: 'QuickBooks', category: 'Accounting & finance', popular: true },
  { key: 'jira', name: 'Jira', category: 'IT & ticketing', popular: true },
  { key: 'zapier', name: 'Zapier', category: 'Automation & developer', popular: true },
  { key: 'webhooks_api', name: 'Webhooks & API', category: 'Automation & developer', kind: 'manage' as const },
]

export function WiredIntegrationsSettings({ onAnnounce, onNavigateSection }: { onAnnounce: Announce; onNavigateSection?: (section: string) => void }) {
  const { data, patchSection } = useWorkspaceSettings()
  const [query, setQuery] = useState('')
  const connectedMap = useMemo(() => new Map((data?.integrations ?? []).map((i) => [i.integrationKey, i])), [data?.integrations])

  async function toggleIntegration(key: string, connected: boolean) {
    try {
      await patchSection('integrations', { integrationKey: key, connected: !connected })
      onAnnounce(`${key} ${connected ? 'disconnected' : 'connected'}.`)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not update integration.')
    }
  }

  const filtered = INTEGRATION_CATALOG.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <div className="integrations-toolbar">
        <div className="search-wrap integration-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search integrations..." /></div>
        <span className="status-badge tone-positive"><CheckCircle2 size={12} /> {(data?.integrations ?? []).filter((i) => i.connected).length} connected</span>
      </div>
      <div className="integration-grid">
        {filtered.map((item) => {
          const state = connectedMap.get(item.key)
          const connected = state?.connected ?? false
          return (
            <div key={item.key} className={`integration-card ${connected ? 'connected' : ''}`}>
              <strong>{item.name}</strong>
              <p>{item.category}</p>
              {item.kind === 'manage' ? (
                <button className="button small secondary" onClick={() => onNavigateSection?.('Developer')}>Manage</button>
              ) : item.kind === 'toggle' ? (
                <button className={`fake-switch ${connected ? 'on' : ''}`} onClick={() => void toggleIntegration(item.key, connected)} />
              ) : (
                <button className={`button small ${connected ? 'secondary' : 'primary'}`} onClick={() => void toggleIntegration(item.key, connected)} disabled={!data?.profile.isAdmin}>{connected ? 'Disconnect' : 'Connect'}</button>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

export function WiredDeveloperSettings({ onAnnounce }: { onAnnounce: Announce }) {
  const { data, postSection, deleteSection } = useWorkspaceSettings()
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  async function generateKey() {
    const name = window.prompt('API key name', 'Production sync')
    if (!name?.trim()) return
    try {
      const result = await postSection('api-keys', { name })
      setRevealedKey(result.createdKey ?? null)
      onAnnounce('API key generated — copy it now; it won’t be shown again.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not generate key.')
    }
  }

  async function addWebhook() {
    const url = window.prompt('Webhook URL')
    if (!url?.trim()) return
    try {
      await postSection('webhooks', { url })
      onAnnounce('Webhook endpoint added.')
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not add webhook.')
    }
  }

  return (
    <>
      {revealedKey && (
        <SettingsCard title="New API key" description="Copy this key now. It will not be shown again.">
          <code className="mono">{revealedKey}</code>
        </SettingsCard>
      )}
      <SettingsCard title="API keys" description="Use these keys to read and write asset data programmatically." action={<button className="button primary small" onClick={() => void generateKey()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Generate key</button>}>
        <DataTable rows={data?.apiKeys ?? []} columns={[
          { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
          { key: 'key', header: 'Key', mono: true, render: (r) => r.key },
          { key: 'created', header: 'Created', render: (r) => r.created },
          { key: 'revoke', header: '', render: (r) => <button className="text-button" onClick={() => void deleteSection('api-keys', r.id).then(() => onAnnounce('Key revoked.'))}><Trash2 size={13} /> Revoke</button> },
        ]} />
      </SettingsCard>
      <SettingsCard title="Webhook endpoints" description="AssetGriffin will POST asset events to these URLs." action={<button className="button secondary small" onClick={() => void addWebhook()} disabled={!data?.profile.isAdmin}><Plus size={14} /> Add endpoint</button>}>
        {(data?.webhooks ?? []).length ? (data?.webhooks ?? []).map((hook) => (
          <div className="webhook-row" key={hook.id}>
            <span className="mono">{hook.url}</span>
            <StatusBadge status={hook.active ? 'Active' : 'Retired'} />
            <button className="text-button" onClick={() => void deleteSection('webhooks', hook.id)}>Remove</button>
          </div>
        )) : <p className="table-muted">No webhook endpoints configured.</p>}
      </SettingsCard>
    </>
  )
}
