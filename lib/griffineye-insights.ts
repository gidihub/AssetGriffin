/**
 * Shared shapes for the "GriffinEye noticed" panel. The observations themselves
 * are computed from live Supabase data in lib/griffineye-agent/insights.ts and
 * served by /api/griffineye-insights.
 */

export type GriffinEyeNavTarget =
  | { page: 'Assets'; query: string }
  | { page: 'Maintenance'; status?: string; query?: string }
  | { page: 'Inspections'; status?: string; query?: string }
  | { page: 'Audits' }

export type GriffinEyeObservation = {
  id: string
  message: string
  nav: GriffinEyeNavTarget
}
