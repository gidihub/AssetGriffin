import {
  createApiKey,
  createApprovalGroup,
  createCustomRole,
  createDepartment,
  createSpendingLimit,
  createWebhook,
  createWorkflow,
  deleteApiKey,
  deleteApprovalGroup,
  deleteCustomRole,
  deleteDepartment,
  deleteSpendingLimit,
  deleteWebhook,
  deleteWorkflow,
  loadWorkspaceSettings,
  setIntegrationState,
  updateBranding,
  updateFeaturePermissions,
  updateMemberRole,
  updateNotificationPreferences,
  updateProfile,
  updateSecuritySettings,
  updateSpendingLimit,
  updateUserPreferences,
  updateWorkflow,
} from '@/lib/settings-db'
import type {
  NotificationPreferences,
  SecurityPreferences,
  UserPreferences,
} from '@/lib/settings-types'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ section: string }> }

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed.'
  const status =
    message === 'Unauthorized' || message === 'Profile not found for authenticated user'
      ? 401
      : message === 'Forbidden' || message === 'forbidden'
        ? 403
        : 500
  return Response.json({ error: message }, { status })
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { section } = await context.params
    const body = (await request.json()) as Record<string, unknown>

    switch (section) {
      case 'profile':
        await updateProfile({
          fullName: typeof body.fullName === 'string' ? body.fullName : undefined,
          jobTitle: typeof body.jobTitle === 'string' ? body.jobTitle : undefined,
          timezone: typeof body.timezone === 'string' ? body.timezone : undefined,
        })
        break
      case 'notifications':
        await updateNotificationPreferences(body as NotificationPreferences)
        break
      case 'preferences':
        await updateUserPreferences(body as UserPreferences)
        break
      case 'branding':
        await updateBranding({
          primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor : undefined,
          logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl : body.logoUrl === null ? null : undefined,
          customDomain: typeof body.customDomain === 'string' ? body.customDomain : body.customDomain === null ? null : undefined,
          name: typeof body.name === 'string' ? body.name : undefined,
        })
        break
      case 'security':
        await updateSecuritySettings(body as SecurityPreferences)
        break
      case 'feature-permissions':
        await updateFeaturePermissions(
          Array.isArray(body.updates)
            ? (body.updates as Array<{ id: string; employeeEnabled: boolean; managerEnabled: boolean }>)
            : [],
        )
        break
      case 'integrations':
        if (typeof body.integrationKey !== 'string') {
          return Response.json({ error: 'integrationKey is required.' }, { status: 400 })
        }
        await setIntegrationState(body.integrationKey, Boolean(body.connected))
        break
      case 'team':
        if (typeof body.memberId !== 'string' || typeof body.role !== 'string') {
          return Response.json({ error: 'memberId and role are required.' }, { status: 400 })
        }
        await updateMemberRole(body.memberId, body.role as 'owner' | 'admin' | 'member')
        break
      case 'spending-limits':
        if (typeof body.id !== 'string') {
          return Response.json({ error: 'id is required.' }, { status: 400 })
        }
        await updateSpendingLimit(body.id, {
          category: typeof body.category === 'string' ? body.category : undefined,
          threshold: typeof body.threshold === 'string' ? body.threshold : undefined,
          approval: typeof body.approval === 'string' ? body.approval : undefined,
        })
        break
      case 'workflows':
        if (typeof body.id !== 'string') {
          return Response.json({ error: 'id is required.' }, { status: 400 })
        }
        await updateWorkflow(body.id, { enabled: Boolean(body.enabled) })
        break
      default:
        return Response.json({ error: 'Unknown settings section.' }, { status: 404 })
    }

    const settings = await loadWorkspaceSettings()
    return Response.json(settings)
  } catch (error) {
    console.error('[settings/patch]', error)
    return errorResponse(error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { section } = await context.params
    const body = (await request.json()) as Record<string, unknown>

    switch (section) {
      case 'spending-limits':
        await createSpendingLimit({
          category: String(body.category ?? ''),
          threshold: String(body.threshold ?? '$0'),
          approval: String(body.approval ?? '$0'),
        })
        break
      case 'custom-roles':
        await createCustomRole({
          name: String(body.name ?? ''),
          description: String(body.description ?? ''),
          permissions: typeof body.permissions === 'object' && body.permissions !== null ? (body.permissions as Record<string, unknown>) : {},
        })
        break
      case 'approval-groups':
        await createApprovalGroup({
          name: String(body.name ?? ''),
          members: String(body.members ?? ''),
          threshold: String(body.threshold ?? ''),
          category: String(body.category ?? ''),
        })
        break
      case 'departments':
        await createDepartment({
          name: String(body.name ?? ''),
          head: String(body.head ?? ''),
          budget: String(body.budget ?? '$0'),
          members: Number(body.members ?? 0),
          assetCount: Number(body.assetCount ?? 0),
        })
        break
      case 'workflows':
        await createWorkflow({
          name: String(body.name ?? ''),
          trigger: String(body.trigger ?? ''),
          action: String(body.action ?? ''),
          enabled: body.enabled !== false,
        })
        break
      case 'api-keys': {
        const created = await createApiKey(String(body.name ?? 'API key'))
        const settings = await loadWorkspaceSettings()
        return Response.json({ ...settings, createdKey: created.rawKey })
      }
      case 'webhooks':
        await createWebhook(String(body.url ?? ''))
        break
      default:
        return Response.json({ error: 'Unknown settings section.' }, { status: 404 })
    }

    const settings = await loadWorkspaceSettings()
    return Response.json(settings)
  } catch (error) {
    console.error('[settings/post]', error)
    return errorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { section } = await context.params
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required.' }, { status: 400 })

    switch (section) {
      case 'spending-limits':
        await deleteSpendingLimit(id)
        break
      case 'custom-roles':
        await deleteCustomRole(id)
        break
      case 'approval-groups':
        await deleteApprovalGroup(id)
        break
      case 'departments':
        await deleteDepartment(id)
        break
      case 'workflows':
        await deleteWorkflow(id)
        break
      case 'api-keys':
        await deleteApiKey(id)
        break
      case 'webhooks':
        await deleteWebhook(id)
        break
      default:
        return Response.json({ error: 'Unknown settings section.' }, { status: 404 })
    }

    const settings = await loadWorkspaceSettings()
    return Response.json(settings)
  } catch (error) {
    console.error('[settings/delete]', error)
    return errorResponse(error)
  }
}
