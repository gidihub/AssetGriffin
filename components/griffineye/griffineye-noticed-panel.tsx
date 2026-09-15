'use client'

import { ArrowUpRight } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { type GriffinEyeNavTarget, type GriffinEyeObservation } from '@/lib/griffineye-insights'

export function GriffinEyeNoticedPanel({
  observations,
  onNavigate,
}: {
  observations: GriffinEyeObservation[]
  onNavigate: (target: GriffinEyeNavTarget) => void
}) {
  if (observations.length === 0) return null

  return (
    <section className="panel griffineye-noticed-panel">
      <div className="panel-header">
        <div>
          <div className="griffineye-panel-title">
            <GriffinEyeIcon size={15} />
            <h2>GriffinEye noticed</h2>
          </div>
          <p>Observations from your asset data — no search required.</p>
        </div>
        <span className="griffineye-noticed-count">{observations.length}</span>
      </div>
      <div className="griffineye-noticed-list">
        {observations.map((observation) => (
          <button
            key={observation.id}
            type="button"
            className="griffineye-noticed-row"
            onClick={() => onNavigate(observation.nav)}
          >
            <span className="griffineye-noticed-icon">
              <GriffinEyeIcon size={14} />
            </span>
            <span className="griffineye-noticed-copy">{observation.message}</span>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
    </section>
  )
}
