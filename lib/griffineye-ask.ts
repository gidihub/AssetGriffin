import type { GriffinVisionUsageSnapshot } from '@/lib/griffin-vision-usage'

/** Wire types for /api/griffineye-query — safe to import from client components. */

export type GriffinEyeResultTable = {
  columns: { key: string; header: string }[]
  rows: Record<string, string | number | null>[]
}

/** A generated file, delivered inline so nothing has to be stored server-side. */
export type GriffinEyeReport = {
  format: 'csv' | 'pdf'
  filename: string
  mimeType: string
  base64: string
  rowCount: number
  columnCount: number
  byteSize: number
}

export type GriffinEyeTraceStep = {
  tool: string
  label: string
  durationMs?: number
  error?: string
}

export type GriffinEyeAskResult = {
  answer: string
  table: GriffinEyeResultTable | null
  /** Asset tags in the result, for filtering an existing table view. */
  assetTags: string[]
  tools: string[]
  trace: GriffinEyeTraceStep[]
  report: GriffinEyeReport | null
  usage?: GriffinVisionUsageSnapshot
  billingSource?: 'tier_allowance' | 'purchased_credit' | 'overage'
}

/** Turns the inline base64 payload into a file the browser saves to disk. */
export function downloadGriffinEyeReport(report: GriffinEyeReport): void {
  const bytes = Uint8Array.from(atob(report.base64), (char) => char.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: report.mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = report.filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export type GriffinEyeAskError = Error & {
  code?: 'VISION_CAP_EXCEEDED'
}

export async function askGriffinEye(question: string, signal?: AbortSignal): Promise<GriffinEyeAskResult> {
  const response = await fetch('/api/griffineye-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal,
  })

  const data = (await response.json().catch(() => null)) as
    | (GriffinEyeAskResult & { error?: string; code?: string })
    | null

  if (!response.ok || !data || data.error) {
    const error = new Error(data?.error ?? 'GriffinEye could not answer that question.') as GriffinEyeAskError
    if (data?.code === 'VISION_CAP_EXCEEDED') error.code = 'VISION_CAP_EXCEEDED'
    throw error
  }

  return {
    answer: data.answer,
    table: data.table ?? null,
    assetTags: data.assetTags ?? [],
    tools: data.tools ?? [],
    trace: data.trace ?? [],
    report: data.report ?? null,
    usage: data.usage,
    billingSource: data.billingSource,
  }
}
