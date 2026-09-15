import { loadWorkspaceSettings } from '@/lib/settings-db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const settings = await loadWorkspaceSettings()
    return Response.json(settings)
  } catch (error) {
    console.error('[settings/get]', error)
    const message = error instanceof Error ? error.message : 'Could not load settings.'
    const status =
      message === 'Unauthorized' || message === 'Profile not found for authenticated user'
        ? 401
        : message === 'Forbidden'
          ? 403
          : 500
    return Response.json({ error: message }, { status })
  }
}
