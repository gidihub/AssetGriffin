'use client'

import Image from 'next/image'
import { ASSET_GRIFFIN_LOGO } from '@/lib/brand-assets'

export type OrgBrand = {
  name: string
  logoUrl?: string | null
  primaryColor?: string
  tagline?: string
}

export function OrgBrandMark({
  brand,
  compact = false,
  className,
}: {
  brand: OrgBrand
  compact?: boolean
  className?: string
}) {
  const name = brand.name.trim() || 'Workspace'
  const initial = name.charAt(0).toUpperCase() || 'W'
  const accent = brand.primaryColor?.trim() || '#2FA391'
  const tagline = brand.tagline ?? 'Asset operations'

  return (
    <div className={`brand-lockup${compact ? ' brand-lockup-compact' : ''}${className ? ` ${className}` : ''}`}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- org-uploaded logos may be external URLs
        <img src={brand.logoUrl} alt="" className="brand-mark-image" width={32} height={32} />
      ) : (
        <div className="brand-mark" style={{ background: accent }} aria-hidden>
          {initial}
        </div>
      )}
      {!compact ? (
        <div className="brand-lockup-text">
          <strong>{name}</strong>
          <span>{tagline}</span>
        </div>
      ) : null}
    </div>
  )
}

/** Default AssetGriffin mark when org has no custom branding yet. */
export function PlatformBrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? ' brand-lockup-compact' : ''}`}>
      <Image
        src={ASSET_GRIFFIN_LOGO}
        alt=""
        width={32}
        height={32}
        className="brand-mark-image"
      />
      {!compact ? (
        <div className="brand-lockup-text">
          <strong>AssetGriffin</strong>
          <span>Powered workspace</span>
        </div>
      ) : null}
    </div>
  )
}
