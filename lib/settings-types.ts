export type NotificationPreferences = {
  overdue: boolean
  auditDue: boolean
  maintenanceDue: boolean
  lowStock: boolean
  warrantyExpiring: boolean
}

export type UserPreferences = {
  dateFormat: string
  landingPage: string
  tableDensity: string
  theme: string
}

export type SecurityPreferences = {
  /** Organization-wide policy: all members must enroll MFA (not per-user enrollment state). */
  requireMfaForMembers: boolean
  passwordMinLength: number
  passwordRequiresSymbol: boolean
  passwordExpirationDays: number
  ssoConnected: boolean
}

export type OrgSettingsJson = {
  security?: SecurityPreferences
  billingPlan?: string
  apiRequestCount?: number
}

export type WorkspaceProfile = {
  id: string
  fullName: string | null
  email: string
  role: string
  jobTitle: string | null
  timezone: string
  notifications: NotificationPreferences
  preferences: UserPreferences
  isAdmin: boolean
}

export type WorkspaceOrganization = {
  id: string
  name: string
  primaryColor: string
  logoUrl: string | null
  customDomain: string | null
  settings: OrgSettingsJson
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastActive: string
}

export type SpendingLimitRow = {
  id: string
  category: string
  threshold: string
  approval: string
}

export type CustomRoleRow = {
  id: string
  name: string
  description: string
  assignedUsers: number
  lastModified: string
  permissions: Record<string, unknown>
}

export type ApprovalGroupRow = {
  id: string
  name: string
  members: string
  threshold: string
  category: string
  memberProfileIds: string[]
}

export type DepartmentRow = {
  id: string
  name: string
  head: string
  assetCount: number
  budget: string
  members: number
}

export type WorkflowRow = {
  id: string
  name: string
  trigger: string
  action: string
  enabled: boolean
  lastTriggered: string
}

export type IntegrationState = {
  integrationKey: string
  connected: boolean
  lastSynced: string | null
}

export type ApiKeyRow = {
  id: string
  name: string
  key: string
  created: string
}

export type WebhookRow = {
  id: string
  url: string
  active: boolean
}

export type FeaturePermissionRow = {
  id: string
  permissionKey: string
  label: string
  description: string
  employeeEnabled: boolean
  managerEnabled: boolean
}

export type BillingSummary = {
  plan: string
  assetCount: number
  assetLimit: number
  monthlyPriceLabel: string
}

export type WorkspaceSettingsPayload = {
  profile: WorkspaceProfile
  organization: WorkspaceOrganization
  team: TeamMember[]
  spendingLimits: SpendingLimitRow[]
  customRoles: CustomRoleRow[]
  approvalGroups: ApprovalGroupRow[]
  departments: DepartmentRow[]
  workflows: WorkflowRow[]
  integrations: IntegrationState[]
  apiKeys: ApiKeyRow[]
  webhooks: WebhookRow[]
  featurePermissions: FeaturePermissionRow[]
  billing: BillingSummary
}

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  overdue: true,
  auditDue: true,
  maintenanceDue: false,
  lowStock: true,
  warrantyExpiring: false,
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  dateFormat: 'MM/DD/YYYY',
  landingPage: 'Overview',
  tableDensity: 'Comfortable',
  theme: 'Light',
}

export const DEFAULT_SECURITY: SecurityPreferences = {
  requireMfaForMembers: false,
  passwordMinLength: 12,
  passwordRequiresSymbol: true,
  passwordExpirationDays: 90,
  ssoConnected: false,
}
