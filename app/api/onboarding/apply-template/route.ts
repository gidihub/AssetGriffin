import { applyOnboardingTemplateAtomic } from '@/lib/onboarding-apply'

export const runtime = 'nodejs'

const TEMPLATE_IDS = new Set<string>([
  'fire-department',
  'k12-devices',
  'biomedical',
  'construction',
  'general-assets',
  'it-inventory',
])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { templateId?: string }
    const templateId = body.templateId

    if (!templateId || !TEMPLATE_IDS.has(templateId)) {
      return Response.json({ error: 'Unknown template.' }, { status: 400 })
    }

    const result = await applyOnboardingTemplateAtomic(templateId)

    return Response.json({
      imported: result.imported,
      templateId,
      alreadyApplied: result.alreadyApplied,
    })
  } catch (error) {
    console.error('[onboarding/apply-template]', error)
    const message = error instanceof Error ? error.message : 'Could not apply template.'
    const status =
      message === 'Unauthorized' || message === 'Forbidden'
        ? 401
        : message.includes('duplicate') || message.includes('unique')
          ? 409
          : 500
    return Response.json({ error: message }, { status })
  }
}
