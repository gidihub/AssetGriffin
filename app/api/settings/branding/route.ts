import { updateBranding } from '@/lib/settings-db'
import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

function isAdminRole(role: string) {
  return role === 'owner' || role === 'admin'
}

export async function GET() {
  try {
    const { supabase, profile } = await requireUserProfile()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('name, primary_color, logo_url, custom_domain')
      .eq('id', profile.organization_id)
      .single()

    if (error) throw new Error(error.message)

    return Response.json({
      name: organization?.name ?? '',
      primaryColor: organization?.primary_color ?? '#2FA391',
      logoUrl: organization?.logo_url ?? null,
      customDomain: organization?.custom_domain ?? '',
      isAdmin: isAdminRole(profile.role),
    })
  } catch (error) {
    console.error('[settings/branding/get]', error)
    const message = error instanceof Error ? error.message : 'Could not load branding.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : 500
    return Response.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    await updateBranding({
      primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor : undefined,
      logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl : body.logoUrl === null ? null : undefined,
      customDomain: typeof body.customDomain === 'string' ? body.customDomain : body.customDomain === null ? null : undefined,
      name: typeof body.name === 'string' ? body.name : undefined,
    })

    const { supabase, profile } = await requireUserProfile()
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('name, primary_color, logo_url, custom_domain')
      .eq('id', profile.organization_id)
      .single()

    if (error) throw new Error(error.message)

    return Response.json({
      name: organization?.name ?? '',
      primaryColor: organization?.primary_color ?? '#2FA391',
      logoUrl: organization?.logo_url ?? null,
      customDomain: organization?.custom_domain ?? '',
      isAdmin: isAdminRole(profile.role),
    })
  } catch (error) {
    console.error('[settings/branding/patch]', error)
    const message = error instanceof Error ? error.message : 'Could not save branding.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500
    return Response.json({ error: message }, { status })
  }
}
