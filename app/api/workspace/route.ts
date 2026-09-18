import { requireUserProfile } from '@/lib/supabase/session'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const { supabase, profile } = await requireUserProfile()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('name, primary_color, logo_url')
      .eq('id', profile.organization_id)
      .single()

    if (error) throw new Error(error.message)

    return Response.json({
      profile: {
        id: profile.id,
        fullName: profile.full_name,
        email: profile.email,
        role: profile.role,
      },
      organization: {
        name: organization?.name ?? 'Workspace',
        primaryColor: organization?.primary_color ?? '#2FA391',
        logoUrl: organization?.logo_url ?? null,
      },
    })
  } catch (error) {
    console.error('[workspace]', error)
    const message = error instanceof Error ? error.message : 'Could not load workspace.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user' ? 401 : 500
    return Response.json({ error: message }, { status })
  }
}
