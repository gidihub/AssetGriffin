export type AuthPromoIconName =
  | 'building'
  | 'sparkles'
  | 'shield-check'
  | 'chart-bar'
  | 'wrench'
  | 'clipboard-check'
  | 'calendar'
  | 'alert-triangle'
  | 'bar-chart'
  | 'file-search'
  | 'lock'
  | 'history'
  | 'search'
  | 'eye'

export type AuthPromoSlide = {
  id: string
  label: string
  headline: string
  body: string
  linkLabel: string
  linkHref: string
  icons: AuthPromoIconName[]
}

export const AUTH_PROMO_SLIDE_INTERVAL_MS = 5500

export const AUTH_PROMO_SLIDES: AuthPromoSlide[] = [
  {
    id: 'asset-tracking',
    label: 'REAL-TIME',
    headline: 'Real-time asset visibility — set up in minutes, not weeks.',
    body: 'Track every asset, automate maintenance schedules, and stay audit-ready. No spreadsheets, no guesswork.',
    linkLabel: 'See how it works →',
    linkHref: '/solutions/asset-tracking',
    icons: ['building', 'sparkles', 'shield-check', 'chart-bar', 'wrench'],
  },
  {
    id: 'maintenance-inspections',
    label: 'PREVENTIVE',
    headline: 'Never miss a maintenance window again.',
    body: 'Schedule preventive maintenance, run inspection checklists, and catch problems before they cause downtime.',
    linkLabel: 'See how it works →',
    linkHref: '/solutions/maintenance-management',
    icons: ['wrench', 'clipboard-check', 'calendar', 'alert-triangle', 'bar-chart'],
  },
  {
    id: 'audit-trail',
    label: 'AUDIT-READY',
    headline: 'When an auditor asks, you already have the answer.',
    body: 'Every check-out, transfer, and status change logged automatically — searchable, exportable, audit-ready.',
    linkLabel: 'See how it works →',
    linkHref: '/solutions/audit-trail-compliance',
    icons: ['shield-check', 'file-search', 'lock', 'history', 'building'],
  },
  {
    id: 'griffineye',
    label: 'AI POWERED',
    headline: 'Ask GriffinEye. Get the answer instantly.',
    body: 'Natural-language search across your entire asset fleet — no filters to build, no reports to run.',
    linkLabel: 'See how it works →',
    linkHref: '/solutions/asset-tracking',
    icons: ['sparkles', 'search', 'eye', 'bar-chart', 'building'],
  },
]

export type AuthPromoBadgePosition = {
  top?: string
  right?: string
  bottom?: string
  left?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Scattered above/below the centered text block — indices map to icons[] on each slide. */
export const AUTH_PROMO_BADGE_POSITIONS: AuthPromoBadgePosition[] = [
  { top: '1%', right: '14%', size: 'lg' },
  { top: '5%', right: '2%', size: 'sm' },
  { top: '12%', left: '70%', size: 'md' },
  { bottom: '16%', right: '4%', size: 'sm' },
  { bottom: '2%', right: '20%', size: 'lg' },
]
