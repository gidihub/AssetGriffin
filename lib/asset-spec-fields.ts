/** Typed specification fields on the Assets group (Settings > Fields). */

export const IT_SPEC_CATEGORIES = ['Computers', 'Tablets', 'Displays'] as const

export type ItSpecCategory = (typeof IT_SPEC_CATEGORIES)[number]

export const ASSET_SPEC_FIELD_KEYS = [
  'brand',
  'device_type',
  'model',
  'operating_system',
  'processor',
  'ram',
  'storage',
  'color',
  'mdm_enrollment_status',
  'security_monitoring_software',
] as const

export type AssetSpecFieldKey = (typeof ASSET_SPEC_FIELD_KEYS)[number]

export const BRAND_CHOICES = ['HP', 'Dell', 'Apple', 'Lenovo', 'Microsoft', 'MSI', 'Acer', 'Other'] as const
export const DEVICE_TYPE_CHOICES = ['Laptop', 'Desktop', 'Tablet', 'Monitor', 'Server'] as const
export const OPERATING_SYSTEM_CHOICES = [
  'Windows 11 Pro',
  'Windows 10',
  'macOS',
  'ChromeOS',
  'Linux',
  'Other',
] as const
export const RAM_CHOICES = ['4GB', '8GB', '16GB', '32GB', '64GB+'] as const
export const MDM_ENROLLMENT_CHOICES = ['Enrolled', 'Not enrolled'] as const

export const SECURITY_SOFTWARE_SUGGESTIONS = [
  'CrowdStrike',
  'SentinelOne',
  'ActivTrak',
  'Jamf Protect',
  'Microsoft Defender',
] as const

export type SecurityMonitoringSoftware = {
  tags: string[]
}

export function parseSecurityMonitoringSoftware(value: unknown): SecurityMonitoringSoftware {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const tags = (value as SecurityMonitoringSoftware).tags
    if (Array.isArray(tags)) {
      return { tags: tags.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0) }
    }
  }
  if (typeof value === 'string' && value.trim()) {
    return {
      tags: value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    }
  }
  return { tags: [] }
}

export function formatSecurityMonitoringSoftware(value: unknown): string {
  const parsed = parseSecurityMonitoringSoftware(value)
  return parsed.tags.length ? parsed.tags.join(', ') : '—'
}

export function isItSpecCategory(category: unknown): category is ItSpecCategory {
  return typeof category === 'string' && (IT_SPEC_CATEGORIES as readonly string[]).includes(category)
}
