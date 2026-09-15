import type OpenAI from 'openai'
import { getOpenAIClient, GRIFFINEYE_AI_MODEL } from '@/lib/openai'
import { GRIFFINEYE_TOOLS } from '@/lib/griffineye-agent/definitions'
import {
  fetchFullReportTable,
  getOrgDataDictionary,
  isToolName,
  TOOL_EXECUTORS,
  type OrgDataDictionary,
  type ReportQuerySource,
  type ToolContext,
  type ToolTable,
} from '@/lib/griffineye-agent/tools'
import {
  generateReport,
  REPORT_FORMATS,
  type GeneratedReport,
  type ReportFormat,
} from '@/lib/griffineye-agent/reports'
import { getTraceStepLabel } from '@/lib/griffineye-trace-labels'
import { available, toModelToolPayload, unavailable } from '@/lib/griffineye-security/availability'
import {
  MAX_TOOL_CALLS_PER_QUERY,
  MAX_TOOL_ROUNDS,
  TOOL_TIMEOUT_MS,
  withToolTimeout,
} from '@/lib/griffineye-security/agent-limits'
import {
  buildGriffinEyeSystemPrompt,
  GRIFFINEYE_FINAL_ROUND_INSTRUCTION,
  wrapUntrustedUserQuestion,
} from '@/lib/griffineye-security/prompt'
import { sanitizeToolArguments } from '@/lib/griffineye-security/sanitize-asset-filters'

export type GriffinEyeToolTrace = {
  tool: string
  label: string
  arguments: Record<string, unknown>
  durationMs?: number
  error?: string
}

function traceStep(
  tool: string,
  args: Record<string, unknown>,
  durationMs?: number,
  error?: string,
): GriffinEyeToolTrace {
  return {
    tool,
    label: getTraceStepLabel(tool),
    arguments: args,
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(error ? { error } : {}),
  }
}

function elapsedMs(start: number): number {
  return Math.max(1, Math.round(performance.now() - start))
}

export type GriffinEyeAnswer = {
  answer: string
  /** Which tools ran, in order, for transparency and the AI audit log. */
  trace: GriffinEyeToolTrace[]
  /** Primary result table for rendering, when the answer is row-shaped. */
  table?: ToolTable
  /** Asset tags in the result, so callers can filter an existing table view. */
  assetTags: string[]
  /** Downloadable file, when the user asked for an export. */
  report?: GeneratedReport
}

/** Report generation runs in the agent loop, not as a query tool, because it
 * packages the rows a previous tool already returned. */
const REPORT_TOOL = 'generate_report'

function parseArguments(raw: string): Record<string, unknown> {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function collectAssetTags(table: ToolTable | undefined): string[] {
  if (!table) return []
  return table.rows
    .map((row) => row.asset_tag)
    .filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
}

/**
 * Packages the rows a query tool already returned. Returning a plain error to
 * the model rather than throwing lets it recover by running a query first.
 */
async function runReportTool(
  ctx: ToolContext,
  args: Record<string, unknown>,
  table: ToolTable | undefined,
  tableSource: ReportQuerySource | undefined,
  question: string,
): Promise<{ modelPayload: unknown; report?: GeneratedReport; error?: string }> {
  if (!table || table.rows.length === 0) {
    const error = 'No results to export yet. Run the query that returns the rows first, then call generate_report.'
    return { modelPayload: toModelToolPayload(unavailable(error)), error }
  }

  const format = REPORT_FORMATS.includes(args.format as ReportFormat)
    ? (args.format as ReportFormat)
    : 'csv'
  const title = typeof args.title === 'string' && args.title.trim() ? args.title.trim() : 'GriffinEye report'

  try {
    const exportTable = tableSource ? await fetchFullReportTable(ctx, tableSource) : undefined
    const reportTable = exportTable ?? table

    const generated = await generateReport(reportTable, format, {
      title,
      question,
      organizationName: ctx.organizationName,
    })

    return {
      report: generated,
      modelPayload: toModelToolPayload(
        available({
          created: true,
          format: generated.format,
          filename: generated.filename,
          rows: generated.rowCount,
          columns: generated.columnCount,
          note: 'The download button is shown to the user automatically.',
        }),
      ),
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Report generation failed'
    return { modelPayload: toModelToolPayload(unavailable(detail)), error: detail }
  }
}

/**
 * Runs the function-calling loop: the model picks tools, we execute them as real
 * org-scoped Supabase queries, and it answers from the results.
 */
export async function answerGriffinEyeQuestion(
  ctx: ToolContext,
  question: string,
): Promise<GriffinEyeAnswer> {
  const client = getOpenAIClient()
  const dictionary = await getOrgDataDictionary(ctx)
  const today = new Date().toISOString().slice(0, 10)

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildGriffinEyeSystemPrompt(dictionary, today) },
    { role: 'user', content: wrapUntrustedUserQuestion(question) },
  ]

  const trace: GriffinEyeToolTrace[] = []
  let table: ToolTable | undefined
  let tableSource: ReportQuerySource | undefined
  let assetTags: string[] = []
  let report: GeneratedReport | undefined
  let toolCallsUsed = 0

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const isFinalRound = round === MAX_TOOL_ROUNDS - 1

    if (isFinalRound) {
      messages.push({ role: 'system', content: GRIFFINEYE_FINAL_ROUND_INSTRUCTION })
    }

    const llmStart = performance.now()
    const response = await client.chat.completions.create({
      model: GRIFFINEYE_AI_MODEL,
      messages,
      tools: GRIFFINEYE_TOOLS,
      tool_choice: isFinalRound ? 'none' : 'auto',
    })
    const llmDurationMs = elapsedMs(llmStart)

    const message = response.choices[0]?.message
    if (!message) throw new Error('GriffinEye returned an empty response.')

    const toolCalls = message.tool_calls ?? []

    if (!toolCalls.length) {
      trace.push(traceStep('_synthesize', {}, llmDurationMs))
      const answer = message.content?.trim()
      if (!answer) throw new Error('GriffinEye could not put together an answer.')
      return { answer, trace, table, assetTags, report }
    }

    trace.push(traceStep(round === 0 ? '_plan' : '_plan_next', {}, llmDurationMs))
    messages.push(message)

    for (const call of toolCalls) {
      if (call.type !== 'function') continue

      const name = call.function.name
      const args = sanitizeToolArguments(name, parseArguments(call.function.arguments))

      if (toolCallsUsed >= MAX_TOOL_CALLS_PER_QUERY) {
        trace.push(traceStep(name, args, undefined, 'Tool budget exhausted for this query'))
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(
            toModelToolPayload(unavailable('Tool call budget exhausted for this query — answer with data already retrieved.')),
          ),
        })
        continue
      }

      if (name === REPORT_TOOL) {
        toolCallsUsed += 1
        const toolStart = performance.now()
        const outcome = await withToolTimeout(
          runReportTool(ctx, args, table, tableSource, question),
          REPORT_TOOL,
        )
        trace.push(traceStep(name, args, elapsedMs(toolStart), outcome.error))
        if (outcome.report) report = outcome.report
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(outcome.modelPayload),
        })
        continue
      }

      if (!isToolName(name)) {
        trace.push(traceStep(name, args, undefined, 'Unknown tool'))
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toModelToolPayload(unavailable(`Unknown tool: ${name}`))),
        })
        continue
      }

      toolCallsUsed += 1
      const toolStart = performance.now()
      try {
        const outcome = await withToolTimeout(TOOL_EXECUTORS[name](ctx, args), name)

        trace.push(traceStep(name, args, elapsedMs(toolStart)))

        if (outcome.table && name !== 'get_schema_info') {
          table = outcome.table
          tableSource = { tool: name, args }
          assetTags = collectAssetTags(outcome.table)
        }

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(outcome.modelPayload),
        })
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Query failed'
        trace.push(traceStep(name, args, elapsedMs(toolStart), detail))
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(toModelToolPayload(unavailable(detail))),
        })
      }
    }
  }

  throw new Error('GriffinEye could not put together an answer.')
}

export { MAX_TOOL_ROUNDS, MAX_TOOL_CALLS_PER_QUERY, TOOL_TIMEOUT_MS }
