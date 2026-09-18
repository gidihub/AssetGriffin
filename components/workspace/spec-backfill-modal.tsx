'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { AssetSpecFieldKey } from '@/lib/asset-spec-fields'
import type { SpecBackfillProposal } from '@/lib/asset-spec-backfill'
import type { SpecReviewFields } from '@/lib/asset-spec-review'
import { SpecReviewPanel } from '@/components/workspace/spec-review-panel'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'

type ProposalState = SpecBackfillProposal & {
  status: 'pending' | 'accepted' | 'skipped'
  review: SpecReviewFields
}

export function SpecBackfillModal({
  onClose,
  onApplied,
  onAnnounce,
}: {
  onClose: () => void
  onApplied: (record: WorkspaceRecordRow) => void
  onAnnounce: (message: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proposals, setProposals] = useState<ProposalState[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [acceptingAll, setAcceptingAll] = useState(false)

  const loadProposals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/groups/assets/spec-backfill')
      const payload = (await response.json()) as {
        proposals?: SpecBackfillProposal[]
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? 'Could not load proposals.')
      const next = (payload.proposals ?? []).map((proposal) => ({
        ...proposal,
        status: 'pending' as const,
        review: proposal.review,
      }))
      setProposals(next)
      setExpandedId(next[0]?.recordId ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load proposals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProposals()
  }, [loadProposals])

  const pending = proposals.filter((proposal) => proposal.status === 'pending')

  async function applyProposal(proposal: ProposalState) {
    setApplyingId(proposal.recordId)
    try {
      const response = await fetch('/api/groups/assets/spec-backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: proposal.recordId,
          review: proposal.review,
        }),
      })
      const payload = (await response.json()) as { record?: WorkspaceRecordRow; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not apply proposal.')
      setProposals((current) =>
        current.map((entry) =>
          entry.recordId === proposal.recordId ? { ...entry, status: 'accepted' } : entry,
        ),
      )
      if (payload.record) onApplied(payload.record)
      onAnnounce(`Updated ${proposal.assetTag || proposal.currentName.slice(0, 32)}.`)
    } catch (err) {
      onAnnounce(err instanceof Error ? err.message : 'Could not apply proposal.')
    } finally {
      setApplyingId(null)
    }
  }

  async function skipProposal(recordId: string) {
    setProposals((current) =>
      current.map((entry) => (entry.recordId === recordId ? { ...entry, status: 'skipped' } : entry)),
    )
    onAnnounce('Skipped record.')
  }

  async function acceptAllPending() {
    if (!pending.length) return
    if (!window.confirm(`Apply specification splits to ${pending.length} remaining record(s)?`)) return
    setAcceptingAll(true)
    for (const proposal of pending) {
      await applyProposal(proposal)
    }
    setAcceptingAll(false)
  }

  function patchReview(recordId: string, review: SpecReviewFields) {
    setProposals((current) =>
      current.map((entry) => (entry.recordId === recordId ? { ...entry, review } : entry)),
    )
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-panel spec-backfill-modal"
        role="dialog"
        aria-labelledby="spec-backfill-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">DATA CLEANUP</span>
            <h2 id="spec-backfill-title">Review specification name splits</h2>
            <p>
              {loading
                ? 'Loading affected records…'
                : `${pending.length} of ${proposals.length} record(s) still need review. Nothing is saved until you accept.`}
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="spec-backfill-actions">
          <button
            type="button"
            className="button secondary small"
            disabled={loading || acceptingAll || pending.length === 0}
            onClick={() => void acceptAllPending()}
          >
            {acceptingAll ? 'Applying…' : `Accept all (${pending.length})`}
          </button>
        </div>

        <div className="spec-backfill-list">
          {loading ? (
            <p className="muted-copy">Loading proposals…</p>
          ) : proposals.length === 0 ? (
            <p className="muted-copy">No spec-dump records need backfill.</p>
          ) : (
            proposals.map((proposal) => {
              const expanded = expandedId === proposal.recordId
              const suggested = new Set(proposal.suggestedFields as AssetSpecFieldKey[])
              return (
                <article
                  key={proposal.recordId}
                  className={`spec-backfill-item ${proposal.status !== 'pending' ? 'is-resolved' : ''}`}
                >
                  <button
                    type="button"
                    className="spec-backfill-item-header"
                    onClick={() => setExpandedId(expanded ? null : proposal.recordId)}
                  >
                    <div>
                      <strong>{proposal.assetTag || proposal.recordId.slice(0, 8)}</strong>
                      <span className="muted-copy">{proposal.currentName.slice(0, 96)}{proposal.currentName.length > 96 ? '…' : ''}</span>
                    </div>
                    <div className="spec-backfill-item-meta">
                      {proposal.status === 'accepted' ? (
                        <span className="ai-suggested-pill"><Check size={12} /> Accepted</span>
                      ) : proposal.status === 'skipped' ? (
                        <span className="muted-copy">Skipped</span>
                      ) : (
                        <span className="ai-suggested-pill">Needs review</span>
                      )}
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expanded ? (
                    <div className="spec-backfill-item-body">
                      <SpecReviewPanel
                        review={proposal.review}
                        suggestedFields={suggested}
                        onChange={(review) => patchReview(proposal.recordId, review)}
                      />
                      {proposal.status === 'pending' ? (
                        <div className="spec-backfill-item-actions">
                          <button
                            type="button"
                            className="button primary small"
                            disabled={applyingId === proposal.recordId || acceptingAll}
                            onClick={() => void applyProposal(proposal)}
                          >
                            {applyingId === proposal.recordId ? 'Saving…' : 'Accept split'}
                          </button>
                          <button
                            type="button"
                            className="button secondary small"
                            disabled={applyingId === proposal.recordId || acceptingAll}
                            onClick={() => void skipProposal(proposal.recordId)}
                          >
                            Skip
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
