'use client'

import {
  MarketingAssetsPreview,
  MarketingAuditsPreview,
  MarketingAuditLogPreview,
  MarketingInspectionsPreview,
  MarketingLocationsPreview,
  MarketingMaintenancePreview,
  MarketingPeoplePreview,
  MarketingReportsPreview,
  MarketingRolesPreview,
} from '@/components/marketing/marketing-preview-screens'

export type ProductPreviewScreen =
  | 'assets'
  | 'people'
  | 'locations'
  | 'maintenance'
  | 'audits'
  | 'inspections'
  | 'reports'
  | 'audit-log'
  | 'roles'

function ScreenBody({ screen }: { screen: ProductPreviewScreen }) {
  switch (screen) {
    case 'assets':
      return <MarketingAssetsPreview />
    case 'people':
      return <MarketingPeoplePreview />
    case 'locations':
      return <MarketingLocationsPreview />
    case 'maintenance':
      return <MarketingMaintenancePreview />
    case 'audits':
      return <MarketingAuditsPreview />
    case 'inspections':
      return <MarketingInspectionsPreview />
    case 'reports':
      return <MarketingReportsPreview />
    case 'audit-log':
      return <MarketingAuditLogPreview />
    case 'roles':
      return <MarketingRolesPreview />
  }
}

interface ProductPreviewProps {
  screen: ProductPreviewScreen
  caption?: string
}

/**
 * Embeds a real, live workspace screen (not a static screenshot) inside marketing
 * pages. The wrapped component is fully functional — search, filters, sorting —
 * running against the same demo data as the in-app experience at /app.
 */
export function ProductPreview({ screen, caption }: ProductPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-secondary px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/25" />
        <span className="ml-2 font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">assetgriffin.com/app</span>
      </div>
      <div className="preview-frame max-h-[600px] overflow-y-auto bg-[#FAFAF8] p-5">
        <ScreenBody screen={screen} />
      </div>
      {caption && (
        <p className="border-t border-border bg-card px-5 py-3 text-xs leading-relaxed text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  )
}
