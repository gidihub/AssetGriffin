'use client'

import {
  BRAND_CHOICES,
  DEVICE_TYPE_CHOICES,
  OPERATING_SYSTEM_CHOICES,
  RAM_CHOICES,
  type AssetSpecFieldKey,
} from '@/lib/asset-spec-fields'
import type { SpecReviewFields } from '@/lib/asset-spec-review'

function FieldLabel({ label, suggested }: { label: string; suggested?: boolean }) {
  return (
    <span className="extracted-field-label">
      {label}
      {suggested ? <span className="ai-suggested-pill">AI suggested</span> : null}
    </span>
  )
}

export function SpecReviewPanel({
  review,
  suggestedFields,
  onChange,
  originalLabel = 'Parsed from the original value',
}: {
  review: SpecReviewFields
  suggestedFields: Set<AssetSpecFieldKey>
  onChange: (next: SpecReviewFields) => void
  originalLabel?: string
}) {
  const patch = (partial: Partial<SpecReviewFields>) => onChange({ ...review, ...partial })

  return (
    <div className="extracted-spec-panel">
      <div className="extracted-spec-header">
        <span className="eyebrow">SPECIFICATIONS (AI-SUGGESTED)</span>
        <p>
          {originalLabel}: <strong>{review.originalName}</strong>. Edit any field before saving — nothing is
          written until you confirm.
        </p>
      </div>
      <div className="extracted-fields">
        <label>
          <FieldLabel label="Clean name" />
          <input value={review.cleanName} onChange={(event) => patch({ cleanName: event.target.value })} />
        </label>
        <label>
          <FieldLabel label="Brand" suggested={suggestedFields.has('brand')} />
          <select value={review.brand} onChange={(event) => patch({ brand: event.target.value })}>
            <option value="">Select…</option>
            {BRAND_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel label="Device type" suggested={suggestedFields.has('device_type')} />
          <select value={review.device_type} onChange={(event) => patch({ device_type: event.target.value })}>
            <option value="">Select…</option>
            {DEVICE_TYPE_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel label="Model" suggested={suggestedFields.has('model')} />
          <input value={review.model} onChange={(event) => patch({ model: event.target.value })} />
        </label>
        <label>
          <FieldLabel label="Operating system" suggested={suggestedFields.has('operating_system')} />
          <select
            value={review.operating_system}
            onChange={(event) => patch({ operating_system: event.target.value })}
          >
            <option value="">Select…</option>
            {OPERATING_SYSTEM_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel label="Processor" suggested={suggestedFields.has('processor')} />
          <input value={review.processor} onChange={(event) => patch({ processor: event.target.value })} />
        </label>
        <label>
          <FieldLabel label="RAM" suggested={suggestedFields.has('ram')} />
          <select value={review.ram} onChange={(event) => patch({ ram: event.target.value })}>
            <option value="">Select…</option>
            {RAM_CHOICES.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel label="Storage" suggested={suggestedFields.has('storage')} />
          <input value={review.storage} onChange={(event) => patch({ storage: event.target.value })} />
        </label>
        <label>
          <FieldLabel label="Color" suggested={suggestedFields.has('color')} />
          <input value={review.color} onChange={(event) => patch({ color: event.target.value })} />
        </label>
        <label>
          <FieldLabel label="Security & monitoring software" suggested={suggestedFields.has('security_monitoring_software')} />
          <input
            value={review.security_monitoring_software.join(', ')}
            onChange={(event) =>
              patch({
                security_monitoring_software: event.target.value
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Comma-separated"
          />
        </label>
      </div>
    </div>
  )
}
