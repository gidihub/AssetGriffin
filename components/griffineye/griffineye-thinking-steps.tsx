'use client'

import { useState } from 'react'
import {
  BarChart3,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  FileText,
  History,
  LayoutGrid,
  AlertCircle,
  Loader2,
  Search,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import type { GriffinEyeTraceStep } from '@/lib/griffineye-ask'
import { formatTraceDuration } from '@/lib/griffineye-trace-labels'

function StepIcon({ tool }: { tool: string }) {
  const props = { size: 14, strokeWidth: 1.75, 'aria-hidden': true as const }
  switch (tool) {
    case 'count_assets':
      return <BarChart3 {...props} />
    case 'search_assets':
      return <Search {...props} />
    case 'rank_by':
      return <TrendingUp {...props} />
    case 'assets_by_recency':
      return <Calendar {...props} />
    case 'find_data_gaps':
      return <FileText {...props} />
    case 'get_schema_info':
      return <LayoutGrid {...props} />
    case 'get_change_history':
      return <History {...props} />
    case 'generate_report':
      return <FileText {...props} />
    case '_plan':
    case '_plan_next':
      return <Brain {...props} />
    case '_synthesize':
      return <CheckCircle2 {...props} />
    default:
      return <Wrench {...props} />
  }
}

function totalDurationMs(steps: GriffinEyeTraceStep[]): number {
  return steps.reduce((sum, step) => sum + (step.durationMs ?? 0), 0)
}

export function GriffinEyeThinkingSteps({
  steps,
  loading = false,
  defaultExpanded = true,
}: {
  steps: GriffinEyeTraceStep[]
  loading?: boolean
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const stepCount = loading ? 3 : steps.length
  const totalMs = totalDurationMs(steps)

  return (
    <div className={`ge-thinking${loading ? ' ge-thinking-loading' : ''}`}>
      <button
        type="button"
        className="ge-thinking-toggle"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
      >
        <span className="ge-thinking-toggle-left">
          {loading ? <Loader2 size={14} className="ge-thinking-spinner" /> : <Brain size={14} />}
          <span>
            Thinking · {stepCount} {stepCount === 1 ? 'step' : 'steps'}
          </span>
        </span>
        <ChevronDown size={16} className={`ge-thinking-chevron${expanded ? ' expanded' : ''}`} />
      </button>

      {expanded && (
        <div className="ge-thinking-body">
          {!loading && totalMs > 0 && (
            <p className="ge-thinking-done">Done in {formatTraceDuration(totalMs)}</p>
          )}
          <ul className="ge-thinking-steps">
            {loading
              ? ['Reading workspace schema', 'Searching asset records', 'Putting it together'].map(
                  (label, index) => (
                    <li key={label} className="ge-thinking-step ge-thinking-step-pending">
                      <span className="ge-thinking-step-icon">
                        {index === 0 ? <LayoutGrid size={14} /> : index === 1 ? <Search size={14} /> : <CheckCircle2 size={14} />}
                      </span>
                      <span className="ge-thinking-step-label">{label}</span>
                      <span className="ge-thinking-step-time ge-shimmer" />
                    </li>
                  ),
                )
              : steps.map((step, index) => (
                  <li
                    key={`${step.tool}-${index}`}
                    className={`ge-thinking-step${step.error ? ' ge-thinking-step-failed' : ''}`}
                  >
                    <span className="ge-thinking-step-icon">
                      {step.error ? <AlertCircle size={14} /> : <StepIcon tool={step.tool} />}
                    </span>
                    <span className="ge-thinking-step-label">
                      {step.error ? `${step.label} — step did not complete` : step.label}
                    </span>
                    {step.durationMs !== undefined && (
                      <span className="ge-thinking-step-time">{formatTraceDuration(step.durationMs)}</span>
                    )}
                  </li>
                ))}
          </ul>
        </div>
      )}
    </div>
  )
}
