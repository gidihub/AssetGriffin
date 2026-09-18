'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUp,
  CornerDownRight,
  Download,
  Mic,
  Newspaper,
  PieChart,
  Plus,
  Share2,
  TrendingDown,
  X,
  Zap,
} from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinkingSteps } from '@/components/griffineye/griffineye-thinking-steps'
import { GriffinEyeResultTable } from '@/components/griffineye/griffineye-result-table'
import {
  askGriffinEye,
  downloadGriffinEyeReport,
  type GriffinEyeReport,
  type GriffinEyeResultTable as ResultTable,
  type GriffinEyeTraceStep,
} from '@/lib/griffineye-ask'
import type { DataGapSummary } from '@/lib/griffineye-agent/tools'
import type { GriffinEyeObservation } from '@/lib/griffineye-insights'

type Turn =
  | { role: 'user'; id: string; text: string }
  | {
      role: 'griffineye'
      id: string
      text: string
      table: ResultTable | null
      report: GriffinEyeReport | null
      trace: GriffinEyeTraceStep[]
      followUp: string | null
      thinking?: boolean
    }
  | { role: 'error'; id: string; text: string; atCap: boolean }

type ForYouCard = {
  id: string
  icon: 'portfolio' | 'maintenance' | 'news'
  title: string
  subtitle: string
  question: string
}

function formatByteSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`
}

function timeGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function contextHeadline(
  maintenanceCount: number,
  totalAssets: number,
  gapCount: number,
): string {
  if (maintenanceCount > 0) {
    return `${maintenanceCount} asset${maintenanceCount === 1 ? '' : 's'} in maintenance`
  }
  if (gapCount > 0) {
    return `${gapCount} data gap${gapCount === 1 ? '' : 's'} to review`
  }
  if (totalAssets === 0) {
    return 'Your workspace is ready for its first assets'
  }
  return 'Your workspace is up to date'
}

function buildForYouCards(
  totalAssets: number,
  maintenanceCount: number,
  inUsePercent: number,
  observations: GriffinEyeObservation[],
  topGap: DataGapSummary | undefined,
): ForYouCard[] {
  const cards: ForYouCard[] = [
    {
      id: 'review',
      icon: 'portfolio',
      title: 'Review my workspace',
      subtitle:
        totalAssets > 0
          ? `${totalAssets} assets · ${inUsePercent}% in use`
          : 'Import or add assets to get started',
      question: 'Give me a summary of my asset workspace.',
    },
    {
      id: 'maintenance',
      icon: 'maintenance',
      title: 'Check maintenance',
      subtitle:
        maintenanceCount > 0
          ? `${maintenanceCount} in maintenance now`
          : 'No assets currently in maintenance',
      question: 'How many assets are in maintenance?',
    },
  ]

  if (observations[0]) {
    cards.push({
      id: observations[0].id,
      icon: 'news',
      title: 'GriffinEye noticed',
      subtitle: observations[0].message,
      question: observations[0].nav.page === 'Assets' && 'query' in observations[0].nav
        ? observations[0].nav.query
        : observations[0].message,
    })
  } else if (topGap) {
    cards.push({
      id: `gap-${topGap.field}`,
      icon: 'news',
      title: 'Fix data gaps',
      subtitle: `${topGap.missing} missing ${topGap.blankPhrase}`,
      question: `Which assets have ${topGap.blankPhrase}?`,
    })
  } else {
    cards.push({
      id: 'changes',
      icon: 'news',
      title: 'Recent changes',
      subtitle: 'Imports, edits, and audit events',
      question: 'What changed in my workspace in the last 7 days?',
    })
  }

  return cards.slice(0, 3)
}

function suggestFollowUp(question: string, answer: string): string | null {
  const lower = question.toLowerCase()
  if (lower.includes('maintenance')) return 'Which assets have been in maintenance the longest?'
  if (lower.includes('gap') || lower.includes('missing')) return 'Which fields have the most gaps?'
  if (lower.includes('location')) return 'Which location holds the most asset value?'
  if (lower.includes('assigned') || lower.includes('owner')) return 'Who has the most assets assigned?'
  if (answer.length > 120) return 'Can you break that down by category?'
  return 'What should I look at next in my workspace?'
}

const QUICK_ACTIONS = [
  { label: 'Asset summary', question: 'Give me a summary of my asset workspace.' },
  { label: 'Data gaps', question: 'Which records are missing important fields?' },
  { label: 'Recent changes', question: 'What changed in my workspace in the last 7 days?' },
  { label: 'Import status', question: 'What was added via import recently?' },
]

export function GriffinEyeAssistant({
  open,
  onClose,
  onOpenBilling,
  firstName,
  userInitials,
  totalAssets,
  maintenanceCount,
  inUsePercent,
  dataHealth,
  observations,
}: {
  open: boolean
  onClose: () => void
  onOpenBilling?: () => void
  firstName: string
  userInitials: string
  totalAssets: number
  maintenanceCount: number
  inUsePercent: number
  dataHealth: DataGapSummary[]
  observations: GriffinEyeObservation[]
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(false)
  const [revealedAnswerIds, setRevealedAnswerIds] = useState<Set<string>>(() => new Set())
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const gapCount = useMemo(
    () => dataHealth.reduce((sum, gap) => sum + gap.missing, 0),
    [dataHealth],
  )
  const topGap = dataHealth[0]
  const forYouCards = useMemo(
    () => buildForYouCards(totalAssets, maintenanceCount, inUsePercent, observations, topGap),
    [totalAssets, maintenanceCount, inUsePercent, observations, topGap],
  )
  const greeting = timeGreeting()
  const headline = contextHeadline(maintenanceCount, totalAssets, gapCount)
  const latestGriffineyeTurnId = useMemo(() => {
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index]?.role === 'griffineye') return turns[index].id
    }
    return null
  }, [turns])
  const contextLine =
    totalAssets > 0
      ? `Your workspace has ${totalAssets} assets · ${maintenanceCount} in maintenance`
      : 'Add or import assets to unlock personalized insights'

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const overlay = overlayRef.current
    const focusableSelector =
      'button:not([disabled]), textarea:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

    function focusableElements(): HTMLElement[] {
      if (!overlay) return []
      return Array.from(overlay.querySelectorAll<HTMLElement>(focusableSelector))
    }

    window.requestAnimationFrame(() => {
      const nodes = focusableElements()
      ;(nodes[0] ?? inputRef.current)?.focus()
    })

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !overlay) return
      const nodes = focusableElements()
      if (nodes.length === 0) return

      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      previousFocusRef.current?.focus()
    }
  }, [open, onClose])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [turns, pending])

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || pending) return

    const id = crypto.randomUUID()
    const answerId = `${id}-answer`
    setTurns((current) => [
      ...current,
      { role: 'user', id, text: trimmed },
      {
        role: 'griffineye',
        id: answerId,
        text: '',
        table: null,
        report: null,
        trace: [],
        followUp: null,
        thinking: true,
      },
    ])
    setValue('')
    setPending(true)

    try {
      const result = await askGriffinEye(trimmed)
      setTurns((current) =>
        current.map((turn) =>
          turn.id === answerId && turn.role === 'griffineye'
            ? {
                ...turn,
                text: result.answer,
                table: result.table,
                report: result.report,
                trace: result.trace,
                followUp: suggestFollowUp(trimmed, result.answer),
                thinking: false,
              }
            : turn,
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GriffinEye could not answer that question.'
      const atCap = (error as { code?: string }).code === 'VISION_CAP_EXCEEDED'
      setTurns((current) => [
        ...current.filter((turn) => turn.id !== answerId),
        { role: 'error', id: `${id}-error`, text: message, atCap },
      ])
    } finally {
      setPending(false)
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void ask(value)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void ask(value)
    }
  }

  function renderComposer(variant: 'home' | 'thread') {
    return (
      <form
        className={`ge-chat-composer ge-chat-composer-${variant}`}
        onSubmit={handleSubmit}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about assets, locations, gaps, or your workspace…"
          rows={variant === 'home' ? 4 : 2}
          aria-label="Ask GriffinEye a question"
          disabled={pending}
        />
        <div className="ge-chat-composer-bar">
          <button type="button" className="ge-chat-composer-addon" aria-label="Add attachment" disabled>
            <Plus size={20} />
          </button>
          <div className="ge-chat-composer-actions">
            <button type="button" className="ge-chat-composer-mic" aria-label="Voice input" disabled>
              <Mic size={20} />
            </button>
            <button
              type="submit"
              className="ge-chat-composer-send"
              disabled={!value.trim() || pending}
              aria-label="Send question"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </form>
    )
  }

  if (!open) return null

  const inConversation = turns.length > 0 || pending

  return (
    <div ref={overlayRef} className="ge-chat-overlay" role="dialog" aria-modal="true" aria-label="Ask GriffinEye">
      <header className="ge-chat-toolbar">
        <div className="ge-chat-toolbar-left">
          <button type="button" className="ge-chat-close" onClick={onClose} aria-label="Close GriffinEye">
            <X size={18} />
          </button>
          <span className="ge-chat-mark">
            <GriffinEyeIcon size={16} />
          </span>
          <div>
            <strong>GriffinEye</strong>
            <span>Your intelligent workspace assistant</span>
          </div>
        </div>
        <div className="ge-chat-toolbar-right">
          <button type="button" className="ge-chat-share" disabled aria-label="Share conversation (coming soon)">
            <Share2 size={14} />
            <span>Share</span>
          </button>
          {onOpenBilling ? (
            <button type="button" className="ge-chat-pro" onClick={onOpenBilling}>
              <Zap size={14} />
              Credits
            </button>
          ) : (
            <button type="button" className="ge-chat-pro" disabled aria-label="Credits">
              <Zap size={14} />
              Credits
            </button>
          )}
        </div>
      </header>

      <div className={`ge-chat-body${inConversation ? ' ge-chat-body-thread' : ''}`} ref={scrollRef}>
        {!inConversation ? (
          <div className="ge-chat-home">
            <div className="ge-chat-greeting">
              <h1>
                {greeting}
                {firstName ? `, ${firstName}` : ''} — {headline}
              </h1>
              <p>{contextLine}</p>
            </div>

            {renderComposer('home')}

            <section className="ge-chat-section">
              <h2>For you</h2>
              <div className="ge-chat-for-you">
                {forYouCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="ge-chat-for-you-card"
                    onClick={() => void ask(card.question)}
                  >
                    <span className="ge-chat-for-you-icon">
                      {card.icon === 'portfolio' && <PieChart size={18} />}
                      {card.icon === 'maintenance' && <TrendingDown size={18} />}
                      {card.icon === 'news' && <Newspaper size={18} />}
                    </span>
                    <strong>{card.title}</strong>
                    <span>{card.subtitle}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="ge-chat-section">
              <h2>Quick actions</h2>
              <div className="ge-chat-quick-actions">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className="ge-chat-quick-pill"
                    onClick={() => void ask(action.question)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="ge-chat-thread">
            {turns.map((turn) => {
              if (turn.role === 'user') {
                return (
                  <div key={turn.id} className="ge-chat-turn ge-chat-turn-user">
                    <div className="ge-chat-user-bubble">{turn.text}</div>
                    <span className="ge-chat-user-avatar" aria-hidden>
                      {userInitials}
                    </span>
                  </div>
                )
              }

              if (turn.role === 'error') {
                return (
                  <div key={turn.id} className="ge-chat-turn ge-chat-turn-error">
                    <p>{turn.text}</p>
                    {turn.atCap && onOpenBilling && (
                      <button type="button" className="button secondary small" onClick={onOpenBilling}>
                        View plan and billing
                      </button>
                    )}
                  </div>
                )
              }

              const isLatestGriffineyeTurn = turn.id === latestGriffineyeTurnId
              const answerRevealed =
                revealedAnswerIds.has(turn.id) || (!turn.thinking && turn.trace.length === 0)

              return (
                <div key={turn.id} className="ge-chat-turn ge-chat-turn-assistant">
                  <span className="ge-chat-assistant-avatar">
                    <GriffinEyeIcon size={14} />
                  </span>
                  <div className="ge-chat-assistant-content">
                    {(turn.thinking || turn.trace.length > 0) && (
                      <GriffinEyeThinkingSteps
                        steps={turn.trace}
                        loading={Boolean(turn.thinking)}
                        animate={isLatestGriffineyeTurn && !answerRevealed}
                        defaultExpanded
                        onRevealComplete={() => {
                          setRevealedAnswerIds((current) => {
                            if (current.has(turn.id)) return current
                            const next = new Set(current)
                            next.add(turn.id)
                            return next
                          })
                        }}
                      />
                    )}
                    {!turn.thinking && turn.text && (!isLatestGriffineyeTurn || answerRevealed) && (
                    <div className="ge-chat-answer-bubble">
                      <p>{turn.text}</p>
                      {turn.table && <GriffinEyeResultTable table={turn.table} />}
                      {turn.report && (
                        <button
                          type="button"
                          className="griffineye-report-download"
                          onClick={() => downloadGriffinEyeReport(turn.report!)}
                        >
                          <Download size={14} />
                          <span>
                            <strong>{turn.report.filename}</strong>
                            <small>
                              {turn.report.format.toUpperCase()} · {turn.report.rowCount}{' '}
                              {turn.report.rowCount === 1 ? 'row' : 'rows'} ·{' '}
                              {formatByteSize(turn.report.byteSize)}
                            </small>
                          </span>
                        </button>
                      )}
                    </div>
                    )}
                    {!turn.thinking && turn.followUp && (!isLatestGriffineyeTurn || answerRevealed) && (
                      <button
                        type="button"
                        className="ge-chat-follow-up"
                        onClick={() => void ask(turn.followUp!)}
                      >
                        <CornerDownRight size={14} />
                        {turn.followUp}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {inConversation && renderComposer('thread')}

      <p className="ge-chat-disclaimer">
        GriffinEye can make mistakes. Verify important information before acting on answers. Each question counts as one
        scan toward your monthly allowance.
      </p>
    </div>
  )
}
