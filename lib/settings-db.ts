import { createHash, randomBytes } from 'crypto'
import { getAssetsGroupForCurrentOrg } from '@/lib/groups-db'
import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_SECURITY,
  DEFAULT_USER_PREFERENCES,
  type ApprovalGroupRow,
  type BillingSummary,
  type CustomRoleRow,
  type DepartmentRow,
  type FeaturePermissionRow,
  type IntegrationState,
  type NotificationPreferences,
  type OrgSettingsJson,
  type SecurityPreferences,
  type SpendingLimitRow,
  type TeamMember,
  type UserPreferences,
  type WebhookRow,
  type WorkflowRow,
  type WorkspaceOrganization,
  type WorkspaceProfile,
  type WorkspaceSettingsPayload,
} from '@/lib/settings-types'
import { requireUserProfile } from '@/lib/supabase/session'

function readNotifications(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_NOTIFICATIONS }
  const value = raw as Partial<NotificationPreferences>
  return {
    overdue: value.overdue ?? DEFAULT_NOTIFICATIONS.overdue,
    auditDue: value.auditDue ?? DEFAULT_NOTIFICATIONS.auditDue,
    maintenanceDue: value.maintenanceDue ?? DEFAULT_NOTIFICATIONS.maintenanceDue,
    lowStock: value.lowStock ?? DEFAULT_NOTIFICATIONS.lowStock,
    warrantyExpiring: value.warrantyExpiring ?? DEFAULT_NOTIFICATIONS.warrantyExpiring,
  }
}

function readUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_USER_PREFERENCES }
  const value = raw as Partial<UserPreferences>
  return {
    dateFormat: value.dateFormat ?? DEFAULT_USER_PREFERENCES.dateFormat,
    landingPage: value.landingPage ?? DEFAULT_USER_PREFERENCES.landingPage,
    tableDensity: value.tableDensity ?? DEFAULT_USER_PREFERENCES.tableDensity,
    theme: value.theme ?? DEFAULT_USER_PREFERENCES.theme,
  }
}

function readSecurity(raw: unknown): SecurityPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SECURITY }
  const value = raw as Partial<SecurityPreferences> & { twoFactorEnabled?: boolean }
  return {
    requireMfaForMembers:
      value.requireMfaForMembers ??
      DEFAULT_SECURITY.requireMfaForMembers,
    passwordMinLength: value.passwordMinLength ?? DEFAULT_SECURITY.passwordMinLength,
    passwordRequiresSymbol: value.passwordRequiresSymbol ?? DEFAULT_SECURITY.passwordRequiresSymbol,
    passwordExpirationDays: value.passwordExpirationDays ?? DEFAULT_SECURITY.passwordExpirationDays,
    ssoConnected: value.ssoConnected ?? DEFAULT_SECURITY.ssoConnected,
  }
}

function roleLabel(role: string): string {
  if (role === 'owner' || role === 'admin') return 'Administrator'
  if (role === 'member') return 'Member'
  return role
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeSync(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffHours < 48) return 'Yesterday'
  return formatDate(iso)
}

async function ensureWorkspaceDefaults(orgId: string, supabase: Awaited<ReturnType<typeof requireUserProfile>>['supabase']) {
  await supabase.rpc('seed_workspace_settings', { p_org_id: orgId })
}

export async function loadWorkspaceSettings(): Promise<WorkspaceSettingsPayload> {
  const { supabase, profile, user } = await requireUserProfile()
  await ensureWorkspaceDefaults(profile.organization_id, supabase)

  const [
    orgResult,
    teamResult,
    spendingResult,
    rolesResult,
    approvalResult,
    departmentsResult,
    workflowsResult,
    integrationsResult,
    apiKeysResult,
    webhooksResult,
    permissionsResult,
    assetCountResult,
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, primary_color, logo_url, custom_domain, settings')
      .eq('id', profile.organization_id)
      .single(),
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true }),
    supabase
      .from('spending_limits')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('custom_roles')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('approval_groups')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('departments')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('workflows')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('org_integrations')
      .select('*')
      .eq('organization_id', profile.organization_id),
    supabase
      .from('org_api_keys')
      .select('id, name, key_prefix, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('org_webhooks')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('feature_permissions')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('sort_order', { ascending: true }),
    (async () => {
      const assetsGroup = await getAssetsGroupForCurrentOrg()
      if (!assetsGroup) return { count: 0 }
      const { count } = await supabase
        .from('records')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', assetsGroup.id)
      return { count: count ?? 0 }
    })(),
  ])

  if (orgResult.error) throw new Error(orgResult.error.message)

  const preferencesRaw = profile.preferences
  const preferences = readUserPreferences(preferencesRaw)
  const notifications = readPreferencesSection<NotificationPreferences>(preferencesRaw, 'notifications', DEFAULT_NOTIFICATIONS)
  const orgSettings = (orgResult.data?.settings ?? {}) as OrgSettingsJson
  const security = readSecurity(orgSettings.security)

  const workspaceProfile: WorkspaceProfile = {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role,
    jobTitle: profile.job_title ?? null,
    timezone: profile.timezone ?? 'America/New_York',
    notifications,
    preferences,
    isAdmin: profile.role === 'owner' || profile.role === 'admin',
  }

  const organization: WorkspaceOrganization = {
    id: orgResult.data!.id,
    name: orgResult.data!.name,
    primaryColor: orgResult.data!.primary_color ?? '#2FA391',
    logoUrl: orgResult.data!.logo_url,
    customDomain: orgResult.data!.custom_domain,
    settings: orgSettings,
  }

  const team: TeamMember[] = (teamResult.data ?? []).map((member) => ({
    id: member.id,
    name: member.full_name?.trim() || member.email.split('@')[0] || 'Member',
    email: member.email,
    role: roleLabel(member.role),
    status: member.id === user.id ? 'Active' : 'Active',
    lastActive: member.id === user.id ? 'Active now' : formatDate(member.created_at),
  }))

  const spendingLimits: SpendingLimitRow[] = (spendingResult.data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    threshold: row.threshold_amount,
    approval: row.approval_amount,
  }))

  const customRoles: CustomRoleRow[] = (rolesResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    assignedUsers: 0,
    lastModified: formatDate(row.updated_at),
    permissions: (row.permissions ?? {}) as Record<string, unknown>,
  }))

  const approvalGroups: ApprovalGroupRow[] = (approvalResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    members: row.members_label,
    threshold: row.threshold_label,
    category: row.category,
    memberProfileIds: row.member_profile_ids ?? [],
  }))

  const departments: DepartmentRow[] = (departmentsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    head: row.head_name,
    assetCount: row.asset_count,
    budget: row.budget_amount,
    members: row.member_count,
  }))

  const workflows: WorkflowRow[] = (workflowsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    trigger: row.trigger_label,
    action: row.action_label,
    enabled: row.enabled,
    lastTriggered: row.last_triggered_label,
  }))

  const integrations: IntegrationState[] = (integrationsResult.data ?? []).map((row) => ({
    integrationKey: row.integration_key,
    connected: row.connected,
    lastSynced: formatRelativeSync(row.last_synced_at),
  }))

  const apiKeys = (apiKeysResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    key: `${row.key_prefix}••••••••`,
    created: formatDate(row.created_at),
  }))

  const webhooks: WebhookRow[] = (webhooksResult.data ?? []).map((row) => ({
    id: row.id,
    url: row.url,
    active: row.active,
  }))

  const featurePermissions: FeaturePermissionRow[] = (permissionsResult.data ?? []).map((row) => ({
    id: row.id,
    permissionKey: row.permission_key,
    label: row.label,
    description: row.description,
    employeeEnabled: row.employee_enabled,
    managerEnabled: row.manager_enabled,
  }))

  const assetCount = assetCountResult.count ?? 0
  const billing: BillingSummary = {
    plan: orgSettings.billingPlan ?? 'Free',
    assetCount,
    assetLimit: 2000,
    monthlyPriceLabel: orgSettings.billingPlan === 'Scale' ? '$499/month' : '$0/month',
  }

  return {
    profile: workspaceProfile,
    organization,
    team,
    spendingLimits,
    customRoles,
    approvalGroups,
    departments,
    workflows,
    integrations,
    apiKeys,
    webhooks,
    featurePermissions,
    billing,
  }
}

function readPreferencesSection<T extends Record<string, unknown>>(
  raw: unknown,
  key: string,
  defaults: T,
): T {
  if (!raw || typeof raw !== 'object') return { ...defaults }
  const root = raw as Record<string, unknown>
  const section = root[key]
  if (!section || typeof section !== 'object') return { ...defaults }
  return { ...defaults, ...(section as T) }
}

export async function updateProfile(input: {
  fullName?: string
  jobTitle?: string
  timezone?: string
}) {
  const { supabase, user } = await requireUserProfile()
  const payload: Record<string, string | null> = {}
  if (input.fullName !== undefined) payload.full_name = input.fullName.trim() || null
  if (input.jobTitle !== undefined) payload.job_title = input.jobTitle.trim() || null
  if (input.timezone !== undefined) payload.timezone = input.timezone

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateNotificationPreferences(notifications: NotificationPreferences) {
  const { supabase, user, profile } = await requireUserProfile()
  const current = profile.preferences ?? {}
  const { error } = await supabase
    .from('profiles')
    .update({ preferences: { ...current, notifications } })
    .eq('id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateUserPreferences(preferences: UserPreferences) {
  const { supabase, user, profile } = await requireUserProfile()
  const current = (profile.preferences ?? {}) as Record<string, unknown>
  const { error } = await supabase
    .from('profiles')
    .update({ preferences: { ...current, ...preferences } })
    .eq('id', user.id)
  if (error) throw new Error(error.message)
}

export async function updateBranding(input: {
  primaryColor?: string
  logoUrl?: string | null
  customDomain?: string | null
  name?: string
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')

  const payload: Record<string, string | null> = {}
  if (input.primaryColor !== undefined) payload.primary_color = input.primaryColor
  if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl
  if (input.customDomain !== undefined) payload.custom_domain = input.customDomain?.trim() || null
  if (input.name !== undefined) payload.name = input.name.trim()

  const { error } = await supabase.from('organizations').update(payload).eq('id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function updateSecuritySettings(
  security: SecurityPreferences & { twoFactorEnabled?: boolean },
) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')

  const { data: org, error: readError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', profile.organization_id)
    .single()
  if (readError) throw new Error(readError.message)

  const { twoFactorEnabled: _legacyEnrollment, ...orgSecurity } = security
  const settings = { ...((org?.settings ?? {}) as OrgSettingsJson), security: orgSecurity }
  const { error } = await supabase
    .from('organizations')
    .update({ settings })
    .eq('id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function updateFeaturePermissions(
  updates: Array<{ id: string; employeeEnabled: boolean; managerEnabled: boolean }>,
) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')

  for (const row of updates) {
    const { error } = await supabase
      .from('feature_permissions')
      .update({ employee_enabled: row.employeeEnabled, manager_enabled: row.managerEnabled })
      .eq('id', row.id)
      .eq('organization_id', profile.organization_id)
    if (error) throw new Error(error.message)
  }
}

export async function createSpendingLimit(input: {
  category: string
  threshold: string
  approval: string
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('spending_limits')
    .insert({
      organization_id: profile.organization_id,
      category: input.category.trim(),
      threshold_amount: input.threshold.trim(),
      approval_amount: input.approval.trim(),
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateSpendingLimit(
  id: string,
  input: { category?: string; threshold?: string; approval?: string },
) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const payload: Record<string, string> = {}
  if (input.category !== undefined) payload.category = input.category.trim()
  if (input.threshold !== undefined) payload.threshold_amount = input.threshold.trim()
  if (input.approval !== undefined) payload.approval_amount = input.approval.trim()
  const { error } = await supabase
    .from('spending_limits')
    .update(payload)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function deleteSpendingLimit(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('spending_limits')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function createCustomRole(input: {
  name: string
  description: string
  permissions?: Record<string, unknown>
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('custom_roles')
    .insert({
      organization_id: profile.organization_id,
      name: input.name.trim(),
      description: input.description.trim(),
      permissions: input.permissions ?? {},
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCustomRole(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('custom_roles')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function createApprovalGroup(input: {
  name: string
  members: string
  threshold: string
  category: string
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('approval_groups')
    .insert({
      organization_id: profile.organization_id,
      name: input.name.trim(),
      members_label: input.members.trim(),
      threshold_label: input.threshold.trim(),
      category: input.category.trim(),
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteApprovalGroup(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('approval_groups')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function createDepartment(input: {
  name: string
  head: string
  budget: string
  members: number
  assetCount: number
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('departments')
    .insert({
      organization_id: profile.organization_id,
      name: input.name.trim(),
      head_name: input.head.trim(),
      budget_amount: input.budget.trim(),
      member_count: input.members,
      asset_count: input.assetCount,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteDepartment(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function createWorkflow(input: {
  name: string
  trigger: string
  action: string
  enabled?: boolean
}) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('workflows')
    .insert({
      organization_id: profile.organization_id,
      name: input.name.trim(),
      trigger_label: input.trigger.trim(),
      action_label: input.action.trim(),
      enabled: input.enabled ?? true,
    })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateWorkflow(id: string, input: { enabled?: boolean }) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('workflows')
    .update({ enabled: input.enabled })
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function deleteWorkflow(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function setIntegrationState(integrationKey: string, connected: boolean) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase.from('org_integrations').upsert(
    {
      organization_id: profile.organization_id,
      integration_key: integrationKey,
      connected,
      last_synced_at: connected ? new Date().toISOString() : null,
    },
    { onConflict: 'organization_id,integration_key' },
  )
  if (error) throw new Error(error.message)
}

export async function createApiKey(name: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const rawKey = `agk_${randomBytes(24).toString('hex')}`
  const keyPrefix = rawKey.slice(0, 12)
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const { data, error } = await supabase
    .from('org_api_keys')
    .insert({
      organization_id: profile.organization_id,
      name: name.trim() || 'API key',
      key_prefix: keyPrefix,
      key_hash: keyHash,
    })
    .select('id, name, created_at')
    .single()
  if (error) throw new Error(error.message)
  return { ...data, rawKey, created: formatDate(data.created_at) }
}

export async function deleteApiKey(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('org_api_keys')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function createWebhook(url: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { data, error } = await supabase
    .from('org_webhooks')
    .insert({ organization_id: profile.organization_id, url: url.trim(), active: true })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteWebhook(id: string) {
  const { supabase, profile } = await requireUserProfile()
  if (profile.role !== 'owner' && profile.role !== 'admin') throw new Error('Forbidden')
  const { error } = await supabase
    .from('org_webhooks')
    .delete()
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}

export async function updateMemberRole(memberId: string, role: 'owner' | 'admin' | 'member') {
  const { supabase } = await requireUserProfile()
  const { error } = await supabase.rpc('update_org_member_role', {
    p_member_id: memberId,
    p_role: role,
  })
  if (error) throw new Error(error.message)
}

export async function updateRecordData(recordId: string, data: Record<string, unknown>) {
  const { supabase, profile } = await requireUserProfile()
  const { data: row, error } = await supabase
    .from('records')
    .update({ data })
    .eq('id', recordId)
    .eq('organization_id', profile.organization_id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return row
}

export async function deleteRecord(recordId: string) {
  const { supabase, profile } = await requireUserProfile()
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', recordId)
    .eq('organization_id', profile.organization_id)
  if (error) throw new Error(error.message)
}
