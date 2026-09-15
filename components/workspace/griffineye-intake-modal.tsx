'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CloudUpload, ImagePlus, PencilLine, ShieldCheck, X } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinking } from '@/components/griffineye/griffineye-thinking'
import { GriffinCreditPurchase } from '@/components/workspace/griffin-credit-purchase'
import { GriffinEyeUsageIndicator } from '@/components/workspace/griffineye-usage-indicator'
import {
  ASSET_CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_INTAKE_PHOTOS,
  MIN_DESCRIPTION_LENGTH,
  type AssetCategory,
  type AssetIntakeDraft,
  type GriffinEyeFieldConflict,
  type GriffinEyeVisionErrorResponse,
  type GriffinEyeVisionFields,
  type GriffinEyeVisionResult,
} from '@/lib/griffineye-intake'
import {
  dismissBulkImportNudge,
  recordVisionCallLocally,
  shouldShowBulkImportNudge,
} from '@/lib/griffin-vision-burst-nudge'
import type { GriffinVisionUsageSnapshot } from '@/lib/griffin-vision-usage'

type Stage = 'upload' | 'processing' | 'review'

/** Photos and plain-language descriptions both feed the same review screen. */
type IntakeMode = 'photo' | 'text'

type AttachedPhoto = {
  id: string
  file: File
  previewUrl: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'
const MAX_BYTES = 10 * 1024 * 1024

const DESCRIPTION_EXAMPLES = [
  'Dell Latitude 5440 laptop for Maya in New York HQ, serial 7XK91P2',
  'Milwaukee cordless drill, warehouse A, small dent on the casing',
  'iPad Pro 12.9 inch assigned to the field ops team',
]

type ReviewFields = GriffinEyeVisionFields

const EMPTY_REVIEW_FIELDS: ReviewFields = {
  manufacturer: '',
  model: '',
  sku: '',
  serialNumber: '',
  manufactureDate: '',
  category: 'Other',
  assetTag: '',
  assignedTo: '',
  location: '',
  conditionNotes: '',
  safetyNotes: '',
}

function FieldLabel({
  label,
  suggested,
  conflict,
}: {
  label: string
  suggested?: boolean
  conflict?: GriffinEyeFieldConflict
}) {
  return (
    <span className="extracted-field-label">
      {label}
      {suggested ? (
        <GriffinEyeIcon size={12} className="extracted-field-ai" aria-label="Suggested by GriffinEye" />
      ) : null}
      {conflict ? (
        <span className="extracted-field-conflict">
          Conflicting readings: {conflict.values.join(' · ')} — confirm below
        </span>
      ) : null}
    </span>
  )
}

function VisionCapNotice({
  cap,
  creditBalance,
  onOpenSpreadsheetImport,
}: {
  cap: number
  creditBalance: number
  onOpenSpreadsheetImport?: () => void
}) {
  const [showPurchase, setShowPurchase] = useState(false)

  return (
    <div className="workflow-note vision-cap-notice" style={{ color: '#8A4B00', background: '#FFF4E5' }}>
      <div>
        <strong>You&apos;ve used all {cap} of your included GriffinEye AI actions this month.</strong>
        <p style={{ margin: '8px 0 0' }}>
          {creditBalance > 0
            ? `${creditBalance} purchased credits are still available and will be used automatically.`
            : 'Buy more credits, upgrade your plan, or use spreadsheet import to continue adding assets.'}
        </p>
      </div>
      {creditBalance === 0 ? (
        <>
          <div className="vision-cap-actions">
            <button type="button" className="button primary small" onClick={() => setShowPurchase((open) => !open)}>
              Buy more credits
            </button>
            <Link href="/#pricing" className="button secondary small">
              Upgrade your plan
            </Link>
            {onOpenSpreadsheetImport ? (
              <button type="button" className="button secondary small" onClick={onOpenSpreadsheetImport}>
                Use spreadsheet import instead
              </button>
            ) : null}
          </div>
          {showPurchase ? (
            <div className="vision-cap-purchase">
              <GriffinCreditPurchase compact />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function GriffinEyeIntakeModal({
  onComplete,
  onOpenSpreadsheetImport,
}: {
  onComplete: (draft: AssetIntakeDraft) => Promise<void> | void
  onOpenSpreadsheetImport?: () => void
}) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [mode, setMode] = useState<IntakeMode>('photo')
  const [description, setDescription] = useState('')
  /** Kept separate from `description` so the review screen shows what was sent. */
  const [reviewedDescription, setReviewedDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<AttachedPhoto[]>([])
  const [extraction, setExtraction] = useState<GriffinEyeVisionResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [usage, setUsage] = useState<GriffinVisionUsageSnapshot | null>(null)
  const [usageRefreshKey, setUsageRefreshKey] = useState(0)
  const [capExceeded, setCapExceeded] = useState<{ cap: number; creditBalance: number } | null>(null)
  const [showBulkNudge, setShowBulkNudge] = useState(false)
  const [suggestedFields, setSuggestedFields] = useState<Set<keyof ReviewFields>>(new Set())
  const [fieldConflicts, setFieldConflicts] = useState<GriffinEyeFieldConflict[]>([])
  const [fields, setFields] = useState<ReviewFields>(EMPTY_REVIEW_FIELDS)

  const conflictByField = useMemo(() => {
    const map = new Map<keyof ReviewFields, GriffinEyeFieldConflict>()
    for (const conflict of fieldConflicts) {
      map.set(conflict.field, conflict)
    }
    return map
  }, [fieldConflicts])

  useEffect(() => {
    return () => {
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    }
  }, [photos])

  /**
   * Photo and text intake differ only in what they send: both meter usage the
   * same way, surface the same cap notice, and land on the same review screen.
   */
  const runExtraction = useCallback(async (send: () => Promise<Response>, failureMessage: string) => {
    setError(null)
    setStage('processing')

    try {
      const response = await send()
      const data = (await response.json()) as GriffinEyeVisionResult & GriffinEyeVisionErrorResponse

      if (response.status === 429 && data.code === 'VISION_CAP_EXCEEDED') {
        const creditBalance = data.creditBalance ?? 0
        setCapExceeded({ cap: data.cap ?? usage?.cap ?? 0, creditBalance })
        setUsage((current) =>
          data.cap != null && data.used != null
            ? {
                tier: (data.tier as GriffinVisionUsageSnapshot['tier']) ?? current?.tier ?? 'free',
                used: data.used,
                cap: data.cap,
                remaining: 0,
                monthKey: current?.monthKey ?? '',
                atCap: true,
                creditBalance,
                canScan: creditBalance > 0,
                willUseCredit: creditBalance > 0,
              }
            : current,
        )
        setStage('upload')
        setError(null)
        return
      }

      if (!response.ok) {
        throw new Error(data.error ?? failureMessage)
      }

      recordVisionCallLocally()
      if (data.usage) setUsage(data.usage)
      setUsageRefreshKey((key) => key + 1)
      setCapExceeded(null)
      setShowBulkNudge(shouldShowBulkImportNudge())

      setExtraction(data)
      setSuggestedFields(new Set(data.suggestedFields))
      setFieldConflicts(data.fieldConflicts ?? [])
      setFields({
        manufacturer: data.manufacturer,
        model: data.model,
        sku: data.sku,
        serialNumber: data.serialNumber,
        manufactureDate: data.manufactureDate,
        category: data.category,
        assetTag: data.assetTag,
        assignedTo: data.assignedTo,
        location: data.location,
        conditionNotes: data.conditionNotes,
        safetyNotes: data.safetyNotes,
      })
      setStage('review')
    } catch (err) {
      setStage('upload')
      setError(err instanceof Error ? err.message : failureMessage)
    }
  }, [usage?.cap])

  const processPhotos = useCallback(
    async (attached: AttachedPhoto[]) => {
      const body = new FormData()
      for (const photo of attached) {
        body.append('photos', photo.file)
      }

      await runExtraction(
        () => fetch('/api/griffin-vision', { method: 'POST', body }),
        'GriffinEye could not read these photos.',
      )
    },
    [runExtraction],
  )

  const processDescription = useCallback(
    async (text: string) => {
      setReviewedDescription(text)
      await runExtraction(
        () =>
          fetch('/api/griffineye-describe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: text }),
          }),
        'GriffinEye could not read that description.',
      )
    },
    [runExtraction],
  )

  function validateFile(file: File): string | null {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
      return 'Upload a JPG, PNG, WebP, or HEIC image.'
    }
    if (file.size > MAX_BYTES) return 'Each photo must be 10 MB or smaller.'
    return null
  }

  function addPhotos(incoming: File[]) {
    if (!incoming.length) return

    const valid: File[] = []
    for (const file of incoming) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        return
      }
      valid.push(file)
    }

    setPhotos((current) => {
      const remaining = MAX_INTAKE_PHOTOS - current.length
      if (remaining <= 0) return current

      const accepted = valid.slice(0, remaining)
      if (valid.length > remaining) {
        setError(`Only ${MAX_INTAKE_PHOTOS} photos can be attached per asset. Extra files were skipped.`)
      } else {
        setError(null)
      }

      return [
        ...current,
        ...accepted.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        })),
      ]
    })
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((photo) => photo.id !== id)
    })
    setError(null)
  }

  function updateField<K extends keyof ReviewFields>(key: K, value: ReviewFields[K]) {
    setFields((current) => ({ ...current, [key]: value }))
    setSuggestedFields((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
    setFieldConflicts((current) => current.filter((conflict) => conflict.field !== key))
  }

  async function handleExtract() {
    if (mode === 'text') {
      if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
        setError('Describe the asset in a few words first.')
        return
      }
      await processDescription(description.trim())
      return
    }

    if (!photos.length) {
      setError('Add at least one photo of the device.')
      return
    }
    await processPhotos(photos)
  }

  const processingMessage =
    mode === 'text'
      ? 'GriffinEye is reading your description…'
      : photos.length > 1
        ? `GriffinEye is reading ${photos.length} photos…`
        : 'GriffinEye is reading the device…'

  const atPhotoCap = photos.length >= MAX_INTAKE_PHOTOS

  if (stage === 'review' && extraction) {
    const fieldLabel = extraction.populatedFieldCount === 1 ? '1 field' : `${extraction.populatedFieldCount} fields`

    return (
      <div className="modal-body">
        <div className="review-preview">
          {mode === 'text' ? (
            <blockquote className="intake-description-echo">{reviewedDescription}</blockquote>
          ) : (
            <div className="intake-photo-thumbs">
              {photos.map((photo, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.id}
                  src={photo.previewUrl}
                  alt={`Attached photo ${index + 1}`}
                  className="intake-photo-thumb"
                />
              ))}
            </div>
          )}
          <div>
            <span className="eyebrow">
              {mode === 'text' ? 'SUGGESTED FROM YOUR DESCRIPTION' : 'SUGGESTED FROM PHOTOS'}
            </span>
            <h3>{extraction.summary}</h3>
            <p>
              {extraction.populatedFieldCount === 0
                ? 'GriffinEye couldn’t fill in any fields confidently — enter the details below.'
                : `GriffinEye suggested ${fieldLabel}${
                    extraction.confidence > 0 ? ` · ${extraction.confidence}% confidence` : ''
                  }. Review and edit before saving.`}
            </p>
          </div>
        </div>

        <div className="extracted-fields">
          <label>
            <FieldLabel
              label="Manufacturer"
              suggested={suggestedFields.has('manufacturer')}
              conflict={conflictByField.get('manufacturer')}
            />
            <input
              value={fields.manufacturer}
              onChange={(event) => updateField('manufacturer', event.target.value)}
            />
          </label>
          <label>
            <FieldLabel label="Model" suggested={suggestedFields.has('model')} conflict={conflictByField.get('model')} />
            <input value={fields.model} onChange={(event) => updateField('model', event.target.value)} />
          </label>
          <label>
            <FieldLabel label="SKU / product ID" suggested={suggestedFields.has('sku')} conflict={conflictByField.get('sku')} />
            <input value={fields.sku} onChange={(event) => updateField('sku', event.target.value)} />
          </label>
          <label>
            <FieldLabel
              label="Serial number"
              suggested={suggestedFields.has('serialNumber')}
              conflict={conflictByField.get('serialNumber')}
            />
            <input
              value={fields.serialNumber}
              onChange={(event) => updateField('serialNumber', event.target.value)}
            />
          </label>
          <label>
            <FieldLabel
              label="Manufacture date"
              suggested={suggestedFields.has('manufactureDate')}
              conflict={conflictByField.get('manufactureDate')}
            />
            <input
              value={fields.manufactureDate}
              onChange={(event) => updateField('manufactureDate', event.target.value)}
              placeholder="YYYY-MM or as printed on label"
            />
          </label>
          <label>
            <FieldLabel label="Asset tag" suggested={suggestedFields.has('assetTag')} conflict={conflictByField.get('assetTag')} />
            <input value={fields.assetTag} onChange={(event) => updateField('assetTag', event.target.value)} />
          </label>
          <label>
            <FieldLabel label="Asset category" suggested={suggestedFields.has('category')} conflict={conflictByField.get('category')} />
            <select
              value={fields.category}
              onChange={(event) => updateField('category', event.target.value as AssetCategory)}
            >
              {ASSET_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <FieldLabel
              label="Assigned to"
              suggested={suggestedFields.has('assignedTo')}
              conflict={conflictByField.get('assignedTo')}
            />
            <input
              value={fields.assignedTo}
              onChange={(event) => updateField('assignedTo', event.target.value)}
              placeholder="Unassigned"
            />
          </label>
          <label>
            <FieldLabel label="Location" suggested={suggestedFields.has('location')} conflict={conflictByField.get('location')} />
            <input value={fields.location} onChange={(event) => updateField('location', event.target.value)} />
          </label>
          <label className="extracted-field-full">
            <FieldLabel
              label="Condition notes"
              suggested={suggestedFields.has('conditionNotes')}
              conflict={conflictByField.get('conditionNotes')}
            />
            <input
              value={fields.conditionNotes}
              onChange={(event) => updateField('conditionNotes', event.target.value)}
            />
          </label>
          <label className="extracted-field-full">
            <FieldLabel
              label="Safety / warning label"
              suggested={suggestedFields.has('safetyNotes')}
              conflict={conflictByField.get('safetyNotes')}
            />
            <input
              value={fields.safetyNotes}
              onChange={(event) => updateField('safetyNotes', event.target.value)}
              placeholder="Hazard or compliance text from device labels"
            />
          </label>
        </div>

        {extraction.notes ? (
          <div className="workflow-note" style={{ marginTop: 12 }}>
            <GriffinEyeIcon size={16} />
            <span>{extraction.notes}</span>
          </div>
        ) : null}

        {showBulkNudge ? (
          <div className="workflow-note">
            <GriffinEyeIcon size={16} />
            <div>
              <strong>Adding a lot of assets?</strong>
              <p style={{ margin: '6px 0 10px' }}>
                Spreadsheet import can bring in hundreds at once — want to try that instead?
              </p>
              <div className="vision-cap-actions">
                {onOpenSpreadsheetImport ? (
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() => {
                      dismissBulkImportNudge()
                      setShowBulkNudge(false)
                      onOpenSpreadsheetImport()
                    }}
                  >
                    Try spreadsheet import
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    dismissBulkImportNudge()
                    setShowBulkNudge(false)
                  }}
                >
                  Keep adding one at a time
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {suggestedFields.size > 0 ? (
          <div className="workflow-note intake-ai-trust-banner" style={{ background: '#FFF8E8', color: '#8A4B00' }}>
            <GriffinEyeIcon size={16} />
            <span>
              <strong>{suggestedFields.size} AI-suggested field{suggestedFields.size === 1 ? '' : 's'} unconfirmed.</strong>{' '}
              Edit any value or clear it before saving — nothing is written until you click Save asset.
            </span>
          </div>
        ) : null}

        <div className="workflow-note">
          <ShieldCheck size={16} />
          <span>
            Review suggested fields before saving — nothing is written to your organization until you confirm.
          </span>
        </div>

        <button
          className="button primary full-width"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            setError(null)
            try {
              await onComplete({
                manufacturer: fields.manufacturer,
                model: fields.model,
                sku: fields.sku,
                serialNumber: fields.serialNumber,
                manufactureDate: fields.manufactureDate,
                category: fields.category,
                assetTag: fields.assetTag,
                summary: extraction.summary,
                notes: extraction.notes,
                conditionNotes: fields.conditionNotes,
                safetyNotes: fields.safetyNotes,
                assignedTo: fields.assignedTo,
                location: fields.location,
              })
            } catch (err) {
              setSaving(false)
              setError(err instanceof Error ? err.message : 'Could not save asset.')
            }
          }}
        >
          <Check size={16} /> {saving ? 'Saving asset…' : 'Save asset'}
        </button>

        {error ? (
          <div className="workflow-note" style={{ color: '#B23B3B', background: '#FBE7E7' }}>
            <span>{error}</span>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="modal-body">
      <input
        ref={photoInputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files
          if (selected?.length) addPhotos(Array.from(selected))
          event.target.value = ''
        }}
      />

      <div className="intake-mode-tabs" role="tablist" aria-label="How to add this asset">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'photo'}
          className={`intake-mode-tab ${mode === 'photo' ? 'active' : ''}`}
          disabled={stage === 'processing'}
          onClick={() => {
            setMode('photo')
            setError(null)
          }}
        >
          <ImagePlus size={15} /> Take a photo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          className={`intake-mode-tab ${mode === 'text' ? 'active' : ''}`}
          disabled={stage === 'processing'}
          onClick={() => {
            setMode('text')
            setError(null)
          }}
        >
          <PencilLine size={15} /> Describe it
        </button>
      </div>

      {mode === 'photo' ? (
        <div className="intake-photo-upload">
          {photos.length ? (
            <div className="intake-photo-gallery">
              {photos.map((photo, index) => (
                <div key={photo.id} className="intake-photo-thumb-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.previewUrl} alt={`Attached photo ${index + 1}`} className="intake-photo-preview" />
                  <button
                    type="button"
                    className="intake-photo-remove"
                    aria-label={`Remove photo ${index + 1}`}
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="dropzone intake-photo-slot intake-photo-slot-empty"
              role="button"
              tabIndex={0}
              onClick={() => stage !== 'processing' && photoInputRef.current?.click()}
              onKeyDown={(event) => {
                if (stage !== 'processing' && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  photoInputRef.current?.click()
                }
              }}
            >
              <div className="drop-icon">
                <ImagePlus size={22} />
              </div>
              <strong>Add photos of this device</strong>
              <span>Full device, label close-up, serial sticker, or barcode — up to {MAX_INTAKE_PHOTOS} photos</span>
            </div>
          )}

          {!atPhotoCap ? (
            <button
              type="button"
              className="button secondary small intake-photo-add"
              disabled={stage === 'processing'}
              onClick={() => photoInputRef.current?.click()}
            >
              <CloudUpload size={15} />
              {photos.length ? 'Add another photo' : 'Choose photos'}
            </button>
          ) : (
            <p className="intake-photo-cap-note">Up to {MAX_INTAKE_PHOTOS} photos</p>
          )}
        </div>
      ) : (
        <div className="intake-describe">
          <label className="intake-describe-label" htmlFor="griffineye-description">
            Describe the asset in your own words
          </label>
          <textarea
            id="griffineye-description"
            className="intake-describe-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Dell Latitude 5440 laptop for Maya in New York HQ, serial 7XK91P2"
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
            disabled={stage === 'processing'}
          />
          <div className="intake-describe-examples">
            <span className="table-muted">Try one of these:</span>
            {DESCRIPTION_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="intake-describe-example"
                disabled={stage === 'processing'}
                onClick={() => {
                  setDescription(example)
                  setError(null)
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <GriffinEyeUsageIndicator compact refreshKey={usageRefreshKey} />

      <button
        type="button"
        className="button primary full-width"
        disabled={
          (mode === 'photo' ? photos.length === 0 : description.trim().length < MIN_DESCRIPTION_LENGTH) ||
          stage === 'processing' ||
          (capExceeded != null && capExceeded.creditBalance === 0)
        }
        onClick={() => void handleExtract()}
      >
        <GriffinEyeIcon size={16} /> {stage === 'processing' ? processingMessage : 'Extract with GriffinEye'}
      </button>

      {stage === 'processing' ? <GriffinEyeThinking message={processingMessage} /> : null}

      {capExceeded ? (
        <VisionCapNotice
          cap={capExceeded.cap}
          creditBalance={capExceeded.creditBalance}
          onOpenSpreadsheetImport={onOpenSpreadsheetImport}
        />
      ) : null}

      {showBulkNudge ? (
        <div className="workflow-note">
          <GriffinEyeIcon size={16} />
          <div>
            <strong>Adding a lot of assets?</strong>
            <p style={{ margin: '6px 0 10px' }}>
              Spreadsheet import can bring in hundreds at once — want to try that instead?
            </p>
            <div className="vision-cap-actions">
              {onOpenSpreadsheetImport ? (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => {
                    dismissBulkImportNudge()
                    setShowBulkNudge(false)
                    onOpenSpreadsheetImport()
                  }}
                >
                  Try spreadsheet import
                </button>
              ) : null}
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  dismissBulkImportNudge()
                  setShowBulkNudge(false)
                }}
              >
                Keep adding one at a time
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="workflow-note" style={{ color: '#B23B3B', background: '#FBE7E7' }}>
          <span>{error}</span>
        </div>
      ) : null}

      <div className="workflow-note">
        <GriffinEyeIcon size={16} />
        <span>
          <strong>GriffinEye suggests, you confirm.</strong> Up to {MAX_INTAKE_PHOTOS} photos count as one extraction
          credit. Review fields before saving.
        </span>
      </div>
    </div>
  )
}
