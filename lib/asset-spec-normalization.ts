import {
  BRAND_CHOICES,
  DEVICE_TYPE_CHOICES,
  OPERATING_SYSTEM_CHOICES,
  RAM_CHOICES,
  SECURITY_SOFTWARE_SUGGESTIONS,
  type AssetSpecFieldKey,
} from '@/lib/asset-spec-fields'

export type ParsedAssetSpec = {
  name: string
  categoryHint: string
  brand: string
  device_type: string
  model: string
  operating_system: string
  processor: string
  ram: string
  storage: string
  color: string
  mdm_enrollment_status: string
  security_monitoring_software: string[]
  notesAppend: string
  originalName: string
  wasSpecDump: boolean
  suggestedFields: AssetSpecFieldKey[]
}

const SPEC_DUMP_UNITS =
  /\b(\d+\s*(?:gb|tb|mhz|ghz|ram|hdd|ssd|memory|nvme|rom)|\d+(?:\.\d+)?\s*-?\s*inch|\b\d+\s*gb\s*memory)\b/i
const BRAND_PATTERN = new RegExp(`\\b(${BRAND_CHOICES.filter((b) => b !== 'Other').join('|')})\\b`, 'i')
const DEVICE_TYPE_PATTERN = /\b(laptop|desktop|tablet|monitor|server)\b/i
const OS_PATTERN =
  /\b(windows\s*11(?:\s*pro)?|windows\s*10|mac\s*os|macos|chrome\s*os|chromeos|linux)\b/i
const RAM_PATTERN = /\b(\d+\s*gb)\s*(?:ram|ddr\d*)?\b/i
const STORAGE_PATTERN = /\b(\d+\s*(?:gb|tb))\s*(?:hdd|ssd|storage|nvme)?\b/i
const PROCESSOR_PATTERN =
  /\b((?:amd|intel|apple|qualcomm|snapdragon|ryzen)[^,]*?(?:\d+(?:\.\d+)?\s*ghz)?[^,]*|\d+(?:\.\d+)?\s*ghz[^,]*)/i
const COLOR_PATTERN = /\b(silver|black|white|grey|gray|gold|blue|red|space\s*gray|midnight|starlight)\b(?:\s*colou?r)?/i

const SECURITY_SOFTWARE_PATTERN = new RegExp(
  `\\b(${[...SECURITY_SOFTWARE_SUGGESTIONS, 'defender', 'crowdstrike', 'sentinelone', 'activtrak', 'jamf'].join('|')})\\b`,
  'gi',
)

function countSpacedDashClauses(value: string): number {
  return (value.match(/\s-\s/g) ?? []).length
}

function isDashSeparatedSpec(value: string): boolean {
  return countSpacedDashClauses(value) >= 1 && SPEC_DUMP_UNITS.test(value)
}

function splitSpecClauses(raw: string): string[] {
  if (isDashSeparatedSpec(raw) && countSpacedDashClauses(raw) >= 1) {
    return raw.split(/\s+-\s+/).map((segment) => segment.trim()).filter(Boolean)
  }
  return raw.split(',').map((segment) => segment.trim()).filter(Boolean)
}

export function isSpecDumpName(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 50) return false
  if (!SPEC_DUMP_UNITS.test(trimmed)) return false

  const commaCount = (trimmed.match(/,/g) ?? []).length
  const dashClauseCount = countSpacedDashClauses(trimmed)

  if (commaCount >= 2) return true
  if (trimmed.length >= 60 && commaCount >= 1) return true
  if (dashClauseCount >= 2) return true
  if (dashClauseCount >= 1 && trimmed.length >= 50) return true
  return false
}

function normalizeBrand(raw: string): string {
  const match = raw.match(BRAND_PATTERN)
  if (!match) return ''
  const token = match[1]
  const found = BRAND_CHOICES.find((choice) => choice.toLowerCase() === token.toLowerCase())
  return found ?? 'Other'
}

const LAPTOP_PRODUCT_HINTS =
  /\b(laptop|latitude|thinkpad|macbook|elitebook|inspiron|katana|envy|omen|surface|spectre|pavilion|yoga|xps)\b/i

function normalizeDeviceType(raw: string): string {
  const match = raw.match(DEVICE_TYPE_PATTERN)
  if (match) {
    const token = match[1].toLowerCase()
    const found = DEVICE_TYPE_CHOICES.find((choice) => choice.toLowerCase() === token)
    if (found) return found
  }
  if (LAPTOP_PRODUCT_HINTS.test(raw)) return 'Laptop'
  if (/\b(tablet|ipad)\b/i.test(raw)) return 'Tablet'
  if (/\b(monitor|display)\b/i.test(raw)) return 'Monitor'
  return ''
}

function normalizeOperatingSystem(raw: string): string {
  const match = raw.match(OS_PATTERN)
  if (!match) return ''
  const token = match[1].toLowerCase()
  if (token.includes('windows 11')) return 'Windows 11 Pro'
  if (token.includes('windows 10')) return 'Windows 10'
  if (token.includes('mac')) return 'macOS'
  if (token.includes('chrome')) return 'ChromeOS'
  if (token.includes('linux')) return 'Linux'
  return ''
}

function normalizeRam(raw: string): string {
  const match = raw.match(RAM_PATTERN)
  if (!match) return ''
  const token = match[1].replace(/\s+/g, '').toUpperCase()
  const normalized = token.endsWith('GB') ? token : `${token}GB`
  return RAM_CHOICES.find((choice) => choice.toUpperCase() === normalized) ?? normalized
}

function normalizeStorage(raw: string): string {
  const hddMatch = raw.match(/\b(\d+\s*(?:GB|TB))\s*(HDD|SSD|NVMe)\b/i)
  if (hddMatch) {
    return `${hddMatch[1].replace(/\s+/g, '').toUpperCase()} ${hddMatch[2].toUpperCase()}`
  }

  const matches = [...raw.matchAll(/\b(\d+\s*(?:GB|TB))\b/gi)]
  for (const match of matches) {
    const start = match.index ?? 0
    const context = raw.slice(Math.max(0, start - 8), start + match[0].length + 8).toLowerCase()
    if (context.includes('ram')) continue
    return `${match[1].replace(/\s+/g, '').toUpperCase()} HDD`
  }
  return ''
}

function normalizeProcessor(raw: string): string {
  const chipMatch = raw.match(/\b((?:Apple|AMD|Intel|Qualcomm|Snapdragon)\s+[A-Za-z0-9\s+.-]+(?:chip|Core|Ryzen)[^,]*)/i)
  if (chipMatch) {
    return chipMatch[1].replace(/\s+/g, ' ').trim()
  }

  const ryzenMatch = raw.match(/\b(Ryzen\s+\d[^,]*)/i)
  if (ryzenMatch) {
    return ryzenMatch[1].replace(/\s+/g, ' ').trim()
  }

  const amdIntel = raw.match(/\b((?:AMD|Intel|Apple|Qualcomm|Snapdragon)[^,]*)/i)
  const ghz = raw.match(/\b(\d+(?:\.\d+)?\s*GHZ)\b/i)
  if (amdIntel && ghz) {
    return `${amdIntel[1].replace(/\s+/g, ' ').trim()}, ${ghz[1].replace(/\s+/g, '')}`
  }
  const match = raw.match(PROCESSOR_PATTERN)
  if (!match) return ''
  return match[1].replace(/\s+/g, ' ').trim()
}

function normalizeProcessorFromSegments(segments: string[], full: string): string {
  for (const segment of segments) {
    if (/\b(amd|intel|apple|qualcomm|snapdragon|ryzen|core\s*i[0-9]|m[0-9]\s*chip)\b/i.test(segment)) {
      const processor = normalizeProcessor(segment)
      if (processor) return processor
    }
  }
  return normalizeProcessor(full)
}

function normalizeBrandFromLeading(segment: string, full: string): string {
  const fromList = normalizeBrand(segment) || normalizeBrand(full)
  if (fromList) return fromList

  const token = segment.split(/\s+/)[0] ?? ''
  if (!token) return ''
  const canonical = BRAND_CHOICES.find((choice) => choice.toLowerCase() === token.toLowerCase())
  if (canonical) return canonical
  if (/^[A-Za-z][A-Za-z0-9+&]*$/.test(token) && token.length <= 20) return 'Other'
  return ''
}

function extractModelFromDashSegments(segments: string[], brand: string): string {
  if (segments.length < 2) return ''

  let modelPart = segments[1]
    .replace(DEVICE_TYPE_PATTERN, '')
    .replace(/\d+(?:\.\d+)?\s*-?\s*inch/gi, '')
    .replace(/\b\d+\s*ghz\b/gi, '')
    .replace(/\s+with\s+.*$/i, '')
    .replace(/-?\s*(?:ryzen|intel|core|rtx|geforce|snapdragon)\s+.*$/i, '')
    .replace(/\b\d+\s*gb\s*memory\b/gi, '')
    .trim()

  const firstToken = segments[0]?.split(/\s+/)[0] ?? ''
  if (brand === 'Other' && firstToken && !modelPart.toLowerCase().startsWith(firstToken.toLowerCase())) {
    modelPart = `${firstToken} ${modelPart}`.trim()
  }

  return modelPart.slice(0, 80)
}

function normalizeColorFromSegments(segments: string[], full: string): string {
  const fromFull = normalizeColor(full)
  if (fromFull) return fromFull

  const last = segments[segments.length - 1]?.trim() ?? ''
  if (segments.length >= 3 && last) {
    const fromLast = normalizeColor(last)
    if (fromLast) return fromLast
    if (/^(midnight|natural silver|platinum|titan|moonlight blue|black|silv(?:er)?)$/i.test(last)) {
      return last
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }
  }
  return ''
}

function normalizeColor(raw: string): string {
  const match = raw.match(COLOR_PATTERN)
  if (!match) return ''
  const token = match[1].replace(/\s+/g, ' ')
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
}

function extractSecuritySoftware(raw: string): string[] {
  const found = new Set<string>()
  for (const match of raw.matchAll(SECURITY_SOFTWARE_PATTERN)) {
    const token = match[1]
    const canonical = SECURITY_SOFTWARE_SUGGESTIONS.find(
      (entry) => entry.toLowerCase() === token.toLowerCase() || entry.toLowerCase().includes(token.toLowerCase()),
    )
    if (canonical) found.add(canonical)
    else if (token.toLowerCase() === 'defender') found.add('Microsoft Defender')
    else if (token.toLowerCase() === 'crowdstrike') found.add('CrowdStrike')
    else if (token.toLowerCase() === 'sentinelone') found.add('SentinelOne')
    else if (token.toLowerCase() === 'activtrak') found.add('ActivTrak')
    else if (token.toLowerCase() === 'jamf') found.add('Jamf Protect')
  }
  return [...found]
}

function buildCleanName(
  brand: string,
  deviceType: string,
  model: string,
  raw: string,
  segments: string[] = [],
): string {
  const brandLabel =
    brand === 'Other' && segments[0]
      ? segments[0].split(/\s+/)[0]
      : brand

  if (brandLabel && deviceType) {
    const deviceLabel = deviceType === 'Laptop' ? 'Laptop' : deviceType
    if (model) {
      const shortModel = model
        .replace(DEVICE_TYPE_PATTERN, '')
        .replace(/\b\d+(?:\.\d+)?\s*-?\s*inch\b/gi, '')
        .split(/\s+/)
        .slice(0, 4)
        .join(' ')
        .trim()
      if (shortModel && shortModel.length <= 40 && !/\b\d+\s*gb\b/i.test(shortModel)) {
        if (shortModel.toLowerCase().includes(String(brandLabel).toLowerCase())) {
          return shortModel.slice(0, 48)
        }
        return `${brandLabel} ${shortModel}`.trim().slice(0, 48)
      }
    }
    return `${brandLabel} ${deviceLabel}`.trim()
  }

  const firstSegment = splitSpecClauses(raw)[0]?.trim()
  if (firstSegment && firstSegment.length <= 48) return firstSegment
  if (brandLabel) return `${brandLabel} ${deviceType || 'Device'}`.trim()
  return firstSegment?.slice(0, 48) || 'Untitled asset'
}

export function parseSpecDump(rawName: string): ParsedAssetSpec {
  const originalName = rawName.trim()
  const empty: ParsedAssetSpec = {
    name: originalName,
    categoryHint: '',
    brand: '',
    device_type: '',
    model: '',
    operating_system: '',
    processor: '',
    ram: '',
    storage: '',
    color: '',
    mdm_enrollment_status: '',
    security_monitoring_software: [],
    notesAppend: '',
    originalName,
    wasSpecDump: false,
    suggestedFields: [],
  }

  if (!isSpecDumpName(originalName)) return empty

  const segments = splitSpecClauses(originalName)
  const dashFormat = isDashSeparatedSpec(originalName) && segments.length >= 2

  const brand = dashFormat
    ? normalizeBrandFromLeading(segments[0] ?? '', originalName)
    : normalizeBrand(originalName)
  const device_type = normalizeDeviceType(originalName)
  const operating_system = normalizeOperatingSystem(originalName)
  const processor = dashFormat
    ? normalizeProcessorFromSegments(segments, originalName)
    : normalizeProcessor(originalName)
  const ram = normalizeRam(originalName)
  const storage = normalizeStorage(originalName)
  const color = dashFormat
    ? normalizeColorFromSegments(segments, originalName)
    : normalizeColor(originalName)
  const security_monitoring_software = extractSecuritySoftware(originalName)

  let model = ''
  if (dashFormat) {
    model = extractModelFromDashSegments(segments, brand)
  } else {
    const firstPart = originalName.split(',')[0] ?? ''
    if (brand && firstPart.toLowerCase().includes(brand.toLowerCase())) {
      model = firstPart.replace(new RegExp(`\\b${brand}\\b`, 'i'), '').replace(/\blaptop\b/i, '').trim()
    }
  }

  const name = buildCleanName(brand, device_type, model, originalName, segments)
  const categoryHint =
    device_type === 'Tablet'
      ? 'Tablets'
      : device_type === 'Monitor'
        ? 'Displays'
        : device_type
          ? 'Computers'
          : brand
            ? 'Computers'
            : ''

  const suggestedFields: AssetSpecFieldKey[] = []
  const track = (key: AssetSpecFieldKey, value: unknown) => {
    if (value && (typeof value !== 'string' || value.trim()) && (!Array.isArray(value) || value.length)) {
      suggestedFields.push(key)
    }
  }
  track('brand', brand)
  track('device_type', device_type)
  track('model', model)
  track('operating_system', operating_system)
  track('processor', processor)
  track('ram', ram)
  track('storage', storage)
  track('color', color)
  track('security_monitoring_software', security_monitoring_software)

  const cleanName = name.replace(/[""]\s*$/u, '').trim()

  return {
    name: cleanName,
    categoryHint,
    brand,
    device_type,
    model,
    operating_system,
    processor,
    ram,
    storage,
    color,
    mdm_enrollment_status: '',
    security_monitoring_software,
    notesAppend: originalName !== name ? `Original name/spec string: ${originalName}` : '',
    originalName,
    wasSpecDump: true,
    suggestedFields,
  }
}

export function applySpecFieldsToRecordData(
  data: Record<string, unknown>,
  spec: ParsedAssetSpec,
): Record<string, unknown> {
  if (!spec.wasSpecDump) return data

  const next: Record<string, unknown> = { ...data, name: spec.name || data.name }

  if (spec.categoryHint && (!data.category || String(data.category).trim() === '')) {
    next.category = spec.categoryHint
  }

  if (spec.brand) next.brand = spec.brand
  if (spec.device_type) next.device_type = spec.device_type
  if (spec.model) next.model = spec.model
  if (spec.operating_system) next.operating_system = spec.operating_system
  if (spec.processor) next.processor = spec.processor
  if (spec.ram) next.ram = spec.ram
  if (spec.storage) next.storage = spec.storage
  if (spec.color) next.color = spec.color
  if (spec.mdm_enrollment_status) next.mdm_enrollment_status = spec.mdm_enrollment_status
  if (spec.security_monitoring_software.length) {
    next.security_monitoring_software = { tags: spec.security_monitoring_software }
  }

  if (spec.notesAppend) {
    const existing = String(data.notes ?? '').trim()
    next.notes = existing ? `${existing}\n\n${spec.notesAppend}` : spec.notesAppend
  }

  return next
}
