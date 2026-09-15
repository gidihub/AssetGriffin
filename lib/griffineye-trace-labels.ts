/** Human-readable labels for GriffinEye agent tool trace steps. */

const TOOL_LABELS: Record<string, string> = {
  count_assets: 'Counting matching assets',
  search_assets: 'Searching asset records',
  rank_by: 'Ranking results',
  assets_by_recency: 'Checking recent changes',
  find_data_gaps: 'Finding data gaps',
  get_schema_info: 'Reading workspace schema',
  get_change_history: 'Reviewing change history',
  generate_report: 'Building export',
  _plan: 'Understanding your question',
  _plan_next: 'Planning next step',
  _synthesize: 'Putting it together',
}

export function getTraceStepLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, ' ')
}

export function formatTraceDuration(ms: number): string {
  const seconds = ms / 1000
  if (seconds < 0.1) return '0.1s'
  if (seconds < 10) return `${seconds.toFixed(1)}s`
  return `${Math.round(seconds)}s`
}
