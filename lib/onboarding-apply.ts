import { createAdminClient } from '@/lib/supabase/admin'
import { requireUserProfile } from '@/lib/supabase/session'

export type ApplyOnboardingTemplateResult = {
  imported: number
  alreadyApplied: boolean
}

export async function applyOnboardingTemplateAtomic(
  templateId: string,
): Promise<ApplyOnboardingTemplateResult> {
  const { profile } = await requireUserProfile()
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('apply_onboarding_template', {
    p_template_id: templateId,
    p_organization_id: profile.organization_id,
    p_applied_by: profile.id,
  })

  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  const imported = Number((row as { imported?: number })?.imported ?? 0)
  const alreadyApplied = Boolean((row as { already_applied?: boolean })?.already_applied)

  return { imported, alreadyApplied }
}
