const STORAGE_KEY = 'griffineye-vision-call-times'
const NUDGE_DISMISSED_KEY = 'griffineye-vision-bulk-nudge-dismissed'
const WINDOW_MS = 10 * 60 * 1000
const THRESHOLD = 5

export function recordVisionCallLocally(): number {
  if (typeof window === 'undefined') return 0

  const now = Date.now()
  const recent = readRecentCallTimes(now)
  recent.push(now)
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
  } catch {
    return recent.length
  }
  return recent.length
}

export function shouldShowBulkImportNudge(): boolean {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(NUDGE_DISMISSED_KEY) === '1') return false

  const now = Date.now()
  return readRecentCallTimes(now).length >= THRESHOLD
}

export function dismissBulkImportNudge() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(NUDGE_DISMISSED_KEY, '1')
  } catch {
    // Ignore storage failures — nudge dismissal is best-effort.
  }
}

function readRecentCallTimes(now: number): number[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is number => typeof value === 'number' && now - value < WINDOW_MS)
  } catch {
    return []
  }
}
