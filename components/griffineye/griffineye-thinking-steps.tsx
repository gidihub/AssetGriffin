'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

const LOADING_PLACEHOLDERS: { tool: string; label: string }[] = [
  { tool: '_plan', label: 'Understanding your question' },
  { tool: 'search_assets', label: 'Searching asset records' },
  { tool: '_synthesize', label: 'Putting it together' },
]

const STEP_REVEAL_MS = 750

export function GriffinEyeThinkingSteps({
  steps,
  loading = false,
  animate = true,
  defaultExpanded = true,
  onRevealComplete,
}: {
  steps: GriffinEyeTraceStep[]
  loading?: boolean
  /** When false, all steps show immediately (past turns). */
  animate?: boolean
  defaultExpanded?: boolean
  onRevealComplete?: () => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [revealedCount, setRevealedCount] = useState(0)
  const completedRef = useRef(false)
  const onRevealCompleteRef = useRef(onRevealComplete)
  onRevealCompleteRef.current = onRevealComplete

  const stepsKey = useMemo(
    () => steps.map((step) => `${step.tool}:${step.label}:${step.durationMs ?? ''}`).join('|'),
    [steps],
  )

  const stepCount = loading ? LOADING_PLACEHOLDERS.length : steps.length
  const totalMs = totalDurationMs(steps)
  const allRevealed = !loading && revealedCount >= steps.length && steps.length > 0
  const visibleCount = Math.min(revealedCount, stepCount)

  useEffect(() => {
    completedRef.current = false

    if (!animate) {
      const count = loading ? LOADING_PLACEHOLDERS.length : steps.length
      setRevealedCount(count)
      if (!loading && steps.length > 0) {
        completedRef.current = true
        onRevealCompleteRef.current?.()
      }
      return
    }

    if (loading) {
      let cancelled = false
      setRevealedCount(0)

      const timers = [0, 1200, 2800].map((delayMs, index) =>
        window.setTimeout(() => {
          if (!cancelled) setRevealedCount(index + 1)
        }, delayMs),
      )

      return () => {
        cancelled = true
        timers.forEach(clearTimeout)
      }
    }

    if (steps.length === 0) {
      setRevealedCount(0)
      return
    }

    let cancelled = false
    // Always reveal completed trace from step 1 — never carry placeholder count forward.
    setRevealedCount(1)

    const timers = steps.slice(1).map((_, index) =>
      window.setTimeout(() => {
        if (!cancelled) setRevealedCount(index + 2)
      }, (index + 1) * STEP_REVEAL_MS),
    )

    const doneTimer = window.setTimeout(() => {
      if (!cancelled && !completedRef.current) {
        completedRef.current = true
        onRevealCompleteRef.current?.()
      }
    }, steps.length * STEP_REVEAL_MS)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      clearTimeout(doneTimer)
    }
  }, [animate, loading, stepsKey, steps.length])

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
            {loading && visibleCount === 0
              ? 'Thinking…'
              : `Thinking · ${visibleCount} ${visibleCount === 1 ? 'step' : 'steps'}${loading && visibleCount < stepCount ? '+' : ''}`}
          </span>
        </span>
        <ChevronDown size={16} className={`ge-thinking-chevron${expanded ? ' expanded' : ''}`} />
      </button>

      {expanded && (
        <div className="ge-thinking-body">
          {allRevealed && totalMs > 0 && (
            <p className="ge-thinking-done">Done in {formatTraceDuration(totalMs)}</p>
          )}
          <ul className="ge-thinking-steps">
            {loading
              ? LOADING_PLACEHOLDERS.slice(0, visibleCount).map((placeholder, index) => (
                  <li
                    key={placeholder.tool}
                    className="ge-thinking-step ge-thinking-step-pending ge-thinking-step-enter"
                  >
                    <span className="ge-thinking-step-icon">
                      <StepIcon tool={placeholder.tool} />
                    </span>
                    <span className="ge-thinking-step-label">{placeholder.label}</span>
                    <span
                      className={
                        index === visibleCount - 1 && visibleCount < LOADING_PLACEHOLDERS.length
                          ? 'ge-thinking-step-time ge-shimmer'
                          : 'ge-thinking-step-time'
                      }
                    />
                  </li>
                ))
              : steps.map((step, index) => {
                  const revealed = index < visibleCount
                  return (
                    <li
                      key={`${step.tool}-${index}`}
                      className={`ge-thinking-step ge-thinking-step-enter${
                        revealed
                          ? step.error
                            ? ' ge-thinking-step-failed'
                            : ''
                          : ' ge-thinking-step-pending'
                      }`}
                    >
                      <span className="ge-thinking-step-icon">
                        {revealed && step.error ? (
                          <AlertCircle size={14} />
                        ) : (
                          <StepIcon tool={step.tool} />
                        )}
                      </span>
                      <span className="ge-thinking-step-label">
                        {revealed && step.error
                          ? `${step.label} — step did not complete`
                          : step.label}
                      </span>
                      {revealed && step.durationMs !== undefined ? (
                        <span className="ge-thinking-step-time">{formatTraceDuration(step.durationMs)}</span>
                      ) : (
                        <span className="ge-thinking-step-time ge-shimmer" />
                      )}
                    </li>
                  )
                })}
          </ul>
        </div>
      )}
    </div>
  )
}
