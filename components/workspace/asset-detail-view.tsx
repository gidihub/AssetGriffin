'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  ClipboardCheck,
  ImagePlus,
  Link2,
  Package,
  Printer,
  Shield,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { RecordFieldInput, LifecycleDatesEditor } from './record-field-input'
import { assetPhotoDisplayUrl, stripPhotoForStorage, type StoredAssetPhoto } from '@/lib/asset-photo-storage'
import {
  ASSET_DETAIL_TABS,
  type AssetDetailTab,
  type AssetPhoto,
  type WarrantyRecord,
  auditRowToAssetLink,
  auditRowToEvent,
  actionEventToFeedItem,
  assetDisplayRef,
  fieldHistoryFromActionEvents,
  formatRelativeAssetTime,
  maintenanceRowToDisplay,
  parseAssetPhotos,
  parseWarrantyRecords,
  primaryPhoto,
  recordMatchesAsset,
} from '@/lib/asset-detail-data'
import type { DbAuditLogRow } from '@/lib/griffineye-audit'
import type { ActionEventRow } from '@/lib/actions-db'
import {
  ASSET_SPEC_FIELD_KEYS,
  isItSpecCategory,
  parseSecurityMonitoringSoftware,
} from '@/lib/asset-spec-fields'
import { lifecycleStageOrder } from '@/lib/workspace-data'
import {
  EmptyState,
  FieldGrid,
  HistoryList,
  LifecycleStepper,
  QRCodePlaceholder,
  StatusBadge,
} from './primitives'
import { RecordActionsPanel } from './record-actions-panel'
import { RecordFormDrawer } from './record-form-drawer'
import {
  assetDetailMetaParts,
  formatFieldValue,
  formatOptionalValue,
  getPrimaryStatusField,
  recordDisplayLabel,
  recordDisplaySubtitle,
  renderFieldValue,
} from '@/lib/field-ui'
import type { DbActionType, DbField } from '@/lib/schema-types'
import type { WorkspaceRecordRow } from '@/lib/record-mappers'
import { isSpecDumpName, parseSpecDump } from '@/lib/asset-spec-normalization'
import type { AssetSpecFieldKey } from '@/lib/asset-spec-fields'
import { mergeSpecReviewIntoRecordData, specReviewFromParsed, type SpecReviewFields } from '@/lib/asset-spec-review'
import { SpecReviewPanel } from '@/components/workspace/spec-review-panel'

type Announce = (message: string) => void

const MAX_ASSET_PHOTOS = 4
const MAX_PHOTO_BYTES = 2 * 1024 * 1024
const IDENTIFICATION_KEYS = new Set(['asset_tag', 'serial'])

function ComingSoonTab({ title, description }: { title: string; description: string }) {
  return (
    <EmptyState
      icon={Link2}
      title={title}
      description={description}
    />
  )
}

function AssetDetailTabs({
  active,
  onChange,
}: {
  active: AssetDetailTab
  onChange: (tab: AssetDetailTab) => void
}) {
  return (
    <div className="asset-detail-tabs intake-mode-tabs" role="tablist" aria-label="Asset sections">
      {ASSET_DETAIL_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`intake-mode-tab asset-detail-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function AssetDetailView({
  record,
  fields,
  actionTypes,
  onClose,
  onUpdated,
  onDelete,
  onAnnounce,
}: {
  record: WorkspaceRecordRow
  fields: DbField[]
  actionTypes: DbActionType[]
  onClose: () => void
  onUpdated: (row: WorkspaceRecordRow) => void
  onDelete: () => void
  onAnnounce: Announce
}) {
  const [activeTab, setActiveTab] = useState<AssetDetailTab>('details')
  const [localRecord, setLocalRecord] = useState(record)
  const [photos, setPhotos] = useState<AssetPhoto[]>(() => parseAssetPhotos(record.data))
  const [warranties, setWarranties] = useState<WarrantyRecord[]>(() => parseWarrantyRecords(record.data))
  const [auditEvents, setAuditEvents] = useState<DbAuditLogRow[]>([])
  const [actionEvents, setActionEvents] = useState<ActionEventRow[]>([])
  const [maintenanceRows, setMaintenanceRows] = useState<WorkspaceRecordRow[]>([])
  const [auditRows, setAuditRows] = useState<WorkspaceRecordRow[]>([])
  const [maintenanceFields, setMaintenanceFields] = useState<DbField[]>([])
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false)
  const [showAuditForm, setShowAuditForm] = useState(false)
  const [showWarrantyForm, setShowWarrantyForm] = useState(false)
  const [savingPhotos, setSavingPhotos] = useState(false)
  const [editingDetails, setEditingDetails] = useState(false)
  const [draftData, setDraftData] = useState<Record<string, unknown>>({})
  const [savingDetails, setSavingDetails] = useState(false)
  const [specReview, setSpecReview] = useState<SpecReviewFields | null>(null)
  const [specSuggested, setSpecSuggested] = useState<Set<AssetSpecFieldKey>>(new Set())
  const [reviewedSpecName, setReviewedSpecName] = useState<string | null>(null)

  const statusField = useMemo(() => getPrimaryStatusField(fields), [fields])
  const identificationFields = useMemo(
    () => fields.filter((field) => IDENTIFICATION_KEYS.has(field.key)),
    [fields],
  )
  const lifecycleStageField = useMemo(
    () => fields.find((field) => field.key === 'lifecycle_stage'),
    [fields],
  )
  const specificationFields = useMemo(
    () =>
      fields.filter((field) =>
        (ASSET_SPEC_FIELD_KEYS as readonly string[]).includes(field.key),
      ),
    [fields],
  )
  const recordDetailFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          !IDENTIFICATION_KEYS.has(field.key) &&
          field.key !== 'lifecycle_stage' &&
          field.type !== 'json' &&
          !(ASSET_SPEC_FIELD_KEYS as readonly string[]).includes(field.key),
      ),
    [fields],
  )
  const itDetailsField = useMemo(() => fields.find((field) => field.key === 'it_details'), [fields])
  const detailsData = editingDetails ? draftData : localRecord.data
  const hasSpecValues = useMemo(
    () =>
      specificationFields.some((field) => {
        const value = localRecord.data[field.key]
        if (field.key === 'security_monitoring_software') {
          return parseSecurityMonitoringSoftware(value).tags.length > 0
        }
        return value !== null && value !== undefined && String(value).trim() !== ''
      }),
    [localRecord.data, specificationFields],
  )
  const showSpecifications =
    specificationFields.length > 0 &&
    (editingDetails || hasSpecValues || isItSpecCategory(localRecord.data.category))
  const showLegacyItDetails =
    Boolean(itDetailsField) &&
    !itDetailsField?.options?.deprecated &&
    typeof localRecord.data.it_details === 'object' &&
    localRecord.data.it_details !== null &&
    Object.keys(localRecord.data.it_details as Record<string, unknown>).length > 0
  const headerPhoto = primaryPhoto(photos)
  const assetRef = assetDisplayRef(localRecord)

  useEffect(() => {
    setLocalRecord(record)
    setWarranties(parseWarrantyRecords(record.data))
    setEditingDetails(false)
    const parsed = parseAssetPhotos(record.data)
    setPhotos(parsed)
    const stored = parsed
      .filter((photo) => photo.storagePath)
      .map(({ id, storagePath, name, primary, addedAt }) => ({
        id,
        storagePath,
        name,
        primary,
        addedAt,
      }))
    void resolvePhotoPreviewUrls(record.id, stored, parsed)
      .then(setPhotos)
      .catch(() => {
        // Keep parsed photos; preview URLs fall back to the display proxy route.
      })
  }, [record])

  function startEditingDetails() {
    setDraftData({ ...localRecord.data })
    setSpecReview(null)
    setSpecSuggested(new Set())
    setReviewedSpecName(null)
    setEditingDetails(true)
  }

  function cancelEditingDetails() {
    setDraftData({ ...localRecord.data })
    setSpecReview(null)
    setSpecSuggested(new Set())
    setReviewedSpecName(null)
    setEditingDetails(false)
  }

  const persistRecordData = useCallback(
    async (nextData: Record<string, unknown>) => {
      const response = await fetch(`/api/groups/assets/records/${localRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: nextData }),
      })
      const payload = (await response.json()) as { record?: WorkspaceRecordRow; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not save asset.')
      if (payload.record) {
        setLocalRecord(payload.record)
        onUpdated(payload.record)
      }
      return payload.record
    },
    [localRecord.id, onUpdated],
  )

  async function persistDraftDetails(nextData: Record<string, unknown>) {
    const pendingReview = specReview
    setSavingDetails(true)
    try {
      const saved = await persistRecordData({
        ...nextData,
        asset_photos: localRecord.data.asset_photos ?? nextData.asset_photos,
        warranty_records: localRecord.data.warranty_records ?? nextData.warranty_records,
      })
      if (saved) {
        if (pendingReview) {
          setReviewedSpecName(pendingReview.originalName.trim())
        }
        setEditingDetails(false)
        setSpecReview(null)
        setSpecSuggested(new Set())
        onAnnounce('Asset details updated.')
      }
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save asset details.')
    } finally {
      setSavingDetails(false)
    }
  }

  async function saveDetails() {
    const newName = String(draftData.name ?? '').trim()
    if (isSpecDumpName(newName) && reviewedSpecName !== newName && !specReview) {
      const parsed = parseSpecDump(newName)
      if (parsed.wasSpecDump) {
        setSpecReview(specReviewFromParsed(parsed))
        setSpecSuggested(new Set(parsed.suggestedFields))
        onAnnounce('Review the suggested specification split before saving.')
        return
      }
    }

    if (specReview) {
      onAnnounce('Apply or dismiss the specification review before saving.')
      return
    }

    await persistDraftDetails(draftData)
  }

  async function applySpecReviewAndSave(keepOriginalName = false) {
    if (!specReview) return
    const merged = mergeSpecReviewIntoRecordData(
      {
        ...draftData,
        asset_photos: localRecord.data.asset_photos ?? draftData.asset_photos,
        warranty_records: localRecord.data.warranty_records ?? draftData.warranty_records,
      },
      specReview,
      { keepOriginalName },
    )
    await persistDraftDetails(merged)
  }

  const savePhotos = useCallback(
    async (nextPhotos: AssetPhoto[]) => {
      setSavingPhotos(true)
      try {
        const normalized = nextPhotos.map((photo, index) => ({
          ...photo,
          primary: nextPhotos.some((p) => p.primary) ? photo.primary : index === 0,
        }))
        setPhotos(normalized)
        const stored = normalized
          .map(stripPhotoForStorage)
          .filter((photo): photo is StoredAssetPhoto => photo !== null)
        const nextData = { ...localRecord.data, asset_photos: stored }
        await persistRecordData(nextData)
        try {
          setPhotos(await resolvePhotoPreviewUrls(localRecord.id, stored, normalized))
        } catch (signError) {
          onAnnounce(
            signError instanceof Error
              ? signError.message
              : 'Photos saved, but previews could not be refreshed.',
          )
        }
        onAnnounce('Photos updated.')
      } catch (error) {
        onAnnounce(error instanceof Error ? error.message : 'Could not save photos.')
        setPhotos(parseAssetPhotos(localRecord.data))
        void resolvePhotoPreviewUrls(localRecord.id, parseAssetPhotos(localRecord.data)).then(setPhotos).catch(() => {})
      } finally {
        setSavingPhotos(false)
      }
    },
    [localRecord.data, localRecord.id, onAnnounce, persistRecordData],
  )

  const saveWarranties = useCallback(
    async (nextWarranties: WarrantyRecord[]) => {
      try {
        const primary = nextWarranties[0]
        const nextData = {
          ...localRecord.data,
          warranty_records: nextWarranties,
          warranty_expiration: primary?.expiration ?? localRecord.data.warranty_expiration ?? null,
        }
        await persistRecordData(nextData)
        setWarranties(nextWarranties)
        onAnnounce('Warranty records updated.')
      } catch (error) {
        onAnnounce(error instanceof Error ? error.message : 'Could not save warranty.')
      }
    },
    [localRecord.data, onAnnounce, persistRecordData],
  )

  useEffect(() => {
    if (activeTab !== 'events' && activeTab !== 'history') return
    void (async () => {
      try {
        const [auditRes, actionsRes] = await Promise.all([
          fetch(`/api/audit-log?entity_id=${encodeURIComponent(localRecord.id)}&limit=100`),
          fetch(`/api/groups/assets/records/${localRecord.id}/actions`),
        ])
        if (auditRes.ok) {
          const payload = (await auditRes.json()) as { events?: DbAuditLogRow[] }
          setAuditEvents(payload.events ?? [])
        }
        if (actionsRes.ok) {
          const payload = (await actionsRes.json()) as { events?: ActionEventRow[] }
          setActionEvents(payload.events ?? [])
        }
      } catch {
        onAnnounce('Could not load activity for this asset.')
      }
    })()
  }, [activeTab, localRecord.id, onAnnounce])

  useEffect(() => {
    if (activeTab !== 'maintenance' && activeTab !== 'audit') return
    void (async () => {
      try {
        const slug = activeTab === 'maintenance' ? 'maintenance' : 'audits'
        const response = await fetch(`/api/groups/${slug}`)
        const payload = (await response.json()) as {
          records?: WorkspaceRecordRow[]
          fields?: DbField[]
          error?: string
        }
        if (!response.ok) throw new Error(payload.error ?? `Could not load ${slug}.`)
        const matched = (payload.records ?? []).filter((row) => recordMatchesAsset(row.data, localRecord))
        if (slug === 'maintenance') {
          setMaintenanceRows(matched)
          setMaintenanceFields(payload.fields ?? [])
        } else {
          setAuditRows(matched)
        }
      } catch (error) {
        onAnnounce(error instanceof Error ? error.message : 'Could not load related records.')
      }
    })()
  }, [activeTab, localRecord, onAnnounce])

  const feedEvents = useMemo(() => {
    const combined = [
      ...auditEvents.map(auditRowToEvent),
      ...actionEvents.map(actionEventToFeedItem),
    ]
    return combined.sort((a, b) => b.when.localeCompare(a.when))
  }, [auditEvents, actionEvents])

  const historyRows = useMemo(() => fieldHistoryFromActionEvents(actionEvents), [actionEvents])

  async function handlePhotoUpload(files: FileList | null) {
    if (!files?.length || savingPhotos) return
    const remaining = MAX_ASSET_PHOTOS - photos.length
    if (remaining <= 0) {
      onAnnounce(`Up to ${MAX_ASSET_PHOTOS} photos per asset.`)
      return
    }

    setSavingPhotos(true)
    const blobUrls: string[] = []
    const additions: AssetPhoto[] = []
    let persisted = false

    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        if (file.size > MAX_PHOTO_BYTES) {
          onAnnounce('Each photo must be 2 MB or smaller.')
          continue
        }

        const previewUrl = URL.createObjectURL(file)
        blobUrls.push(previewUrl)

        const formData = new FormData()
        formData.append('photo', file)
        const response = await fetch(`/api/assets/records/${localRecord.id}/photos`, {
          method: 'POST',
          body: formData,
        })
        const payload = (await response.json()) as { photo?: StoredAssetPhoto; error?: string }
        if (!response.ok || !payload.photo) {
          URL.revokeObjectURL(previewUrl)
          const index = blobUrls.indexOf(previewUrl)
          if (index >= 0) blobUrls.splice(index, 1)
          onAnnounce(payload.error ?? 'Could not upload photo. Apply the asset-photos storage migration if this persists.')
          continue
        }

        additions.push({
          ...payload.photo,
          previewUrl,
          primary: photos.length === 0 && additions.length === 0,
        })
      }

      if (!additions.length) return
      persisted = true
      await savePhotos([...photos, ...additions])
    } finally {
      for (const url of blobUrls) URL.revokeObjectURL(url)
      if (!persisted) setSavingPhotos(false)
    }
  }

  async function setPrimaryPhoto(photoId: string) {
    await savePhotos(photos.map((photo) => ({ ...photo, primary: photo.id === photoId })))
  }

  async function removePhoto(photo: AssetPhoto) {
    try {
      if (photo.storagePath) {
        const response = await fetch(
          `/api/assets/records/${localRecord.id}/photos?path=${encodeURIComponent(photo.storagePath)}`,
          { method: 'DELETE' },
        )
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string }
          throw new Error(payload.error ?? 'Could not delete photo file.')
        }
      }
      await savePhotos(photos.filter((entry) => entry.id !== photo.id))
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not remove photo.')
    }
  }

  return (
    <div className="asset-detail-page">
      <div className="asset-detail-toolbar">
        <button type="button" className="button secondary small" onClick={onClose}>
          <ArrowLeft size={14} /> Back to assets
        </button>
        <div className="asset-detail-toolbar-actions">
          <button type="button" className="button secondary small" onClick={onDelete}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <header className="asset-detail-header panel">
        <div className="asset-detail-header-main">
          <div className="asset-detail-thumb">
            {headerPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoDisplaySrc(localRecord.id, headerPhoto)} alt="" className="asset-detail-thumb-image" />
            ) : (
              <div className="asset-detail-thumb-placeholder"><Package size={28} /></div>
            )}
            {headerPhoto?.primary ? <span className="asset-detail-primary-badge">Primary</span> : null}
          </div>
          <div className="asset-detail-header-copy">
            <div className="asset-detail-title-row">
              <h1>{recordDisplayLabel(fields, localRecord.data, localRecord.id)}</h1>
              {statusField && localRecord.data[statusField.key] ? (
                <StatusBadge status={String(localRecord.data[statusField.key])} />
              ) : null}
            </div>
            <p className="asset-detail-subtitle">
              {recordDisplaySubtitle(fields, localRecord.data, localRecord.id)}
            </p>
            <div className="asset-detail-id-row">
              {assetDetailMetaParts(localRecord.data, localRecord.id).map((part, index) => (
                <span key={`${part.kind}-${index}`}>
                  {index > 0 ? <span className="asset-detail-id-sep">·</span> : null}
                  <span className={part.kind === 'tag' || part.kind === 'serial' ? 'mono-muted' : undefined}>
                    {part.text}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <AssetDetailTabs active={activeTab} onChange={setActiveTab} />

      <div className="asset-detail-body panel">
        {activeTab === 'details' && (
          <div className="asset-detail-tab-panel">
            <div className="asset-detail-tab-toolbar">
              <p>{editingDetails ? 'Edit fields below, then save your changes.' : 'Core asset fields and lifecycle.'}</p>
              {editingDetails ? (
                <div className="asset-detail-edit-actions">
                  <button type="button" className="button secondary small" onClick={cancelEditingDetails} disabled={savingDetails}>
                    Cancel
                  </button>
                  <button type="button" className="button primary small" onClick={() => void saveDetails()} disabled={savingDetails}>
                    {savingDetails ? 'Saving…' : 'Save details'}
                  </button>
                </div>
              ) : (
                <button type="button" className="button secondary small" onClick={startEditingDetails}>
                  Edit details
                </button>
              )}
            </div>

            <section className="drawer-section">
              <h3>Identification</h3>
              <div className="identification-row">
                <QRCodePlaceholder seed={String(detailsData.asset_tag ?? localRecord.id)} size={68} />
                <div className="identification-copy">
                  {editingDetails ? (
                    <div className="field-grid">
                      {identificationFields.map((field) => (
                        <label key={field.id} className="editable-field-item">
                          <span>{field.label}</span>
                          <RecordFieldInput field={field} data={draftData} onChange={setDraftData} />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="field-item"><span>Asset ID</span><strong className="mono-muted">{String(localRecord.data.asset_tag ?? localRecord.id)}</strong></div>
                      <div className="field-item"><span>Serial number</span><strong className="mono-muted">{formatOptionalValue(localRecord.data.serial)}</strong></div>
                    </>
                  )}
                </div>
                {!editingDetails ? (
                  <button type="button" className="button secondary small" onClick={() => onAnnounce(`Label queued for printing · ${localRecord.data.asset_tag}`)}>
                    <Printer size={14} /> Print label
                  </button>
                ) : null}
              </div>
            </section>

            {(localRecord.data.lifecycle_stage || editingDetails) && lifecycleStageField ? (
              <section className="drawer-section">
                <h3>Lifecycle stage</h3>
                {editingDetails ? (
                  <div className="asset-detail-lifecycle-edit">
                    <label className="editable-field-item">
                      <span>{lifecycleStageField.label}</span>
                      <RecordFieldInput field={lifecycleStageField} data={draftData} onChange={setDraftData} />
                    </label>
                    <LifecycleDatesEditor data={draftData} onChange={setDraftData} />
                  </div>
                ) : (
                  <LifecycleStepper
                    stages={lifecycleStageOrder}
                    current={String(localRecord.data.lifecycle_stage)}
                    dates={Object.fromEntries(
                      Object.entries((localRecord.data.lifecycle_dates as Record<string, string>) ?? {}).map(([k, v]) => [
                        k,
                        formatFieldValue({ key: k, label: k, type: 'date', options: {}, sort_order: 0, required: false, id: '', group_id: '', created_at: '' }, v),
                      ]),
                    )}
                  />
                )}
              </section>
            ) : null}

            <section className="drawer-section">
              <h3>Record details</h3>
              {editingDetails ? (
                <div className="field-grid">
                  {recordDetailFields.map((field) => (
                    <label key={field.id} className="editable-field-item">
                      <span>{field.label}</span>
                      <RecordFieldInput field={field} data={draftData} onChange={setDraftData} />
                    </label>
                  ))}
                </div>
              ) : (
                <FieldGrid
                  fields={recordDetailFields.map((field) => ({
                    label: field.label,
                    value: renderFieldValue(field, localRecord.data[field.key]),
                  }))}
                />
              )}
            </section>

            {editingDetails && specReview ? (
              <section className="drawer-section">
                <SpecReviewPanel
                  review={specReview}
                  suggestedFields={specSuggested}
                  onChange={setSpecReview}
                />
                <div className="asset-detail-edit-actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="button primary small"
                    disabled={savingDetails}
                    onClick={() => void applySpecReviewAndSave(false)}
                  >
                    Apply split &amp; save
                  </button>
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={savingDetails}
                    onClick={() => void applySpecReviewAndSave(true)}
                  >
                    Keep original name
                  </button>
                  <button
                    type="button"
                    className="button secondary small"
                    disabled={savingDetails}
                    onClick={() => setSpecReview(null)}
                  >
                    Dismiss review
                  </button>
                </div>
              </section>
            ) : null}

            {showSpecifications ? (
              <section className="drawer-section">
                <h3>Specifications</h3>
                {editingDetails ? (
                  <div className="field-grid">
                    {specificationFields.map((field) => (
                      <label key={field.id} className="editable-field-item">
                        <span>{field.label}</span>
                        <RecordFieldInput field={field} data={draftData} onChange={setDraftData} />
                      </label>
                    ))}
                  </div>
                ) : (
                  <FieldGrid
                    fields={specificationFields.map((field) => ({
                      label: field.label,
                      value:
                        field.key === 'security_monitoring_software' ? (
                          <span className="security-tags-list">
                            {parseSecurityMonitoringSoftware(localRecord.data[field.key]).tags.map((tag) => (
                              <span key={tag} className="tag-pill security-tag-pill">
                                {tag}
                              </span>
                            ))}
                            {!parseSecurityMonitoringSoftware(localRecord.data[field.key]).tags.length ? '—' : null}
                          </span>
                        ) : (
                          renderFieldValue(field, localRecord.data[field.key])
                        ),
                    }))}
                  />
                )}
              </section>
            ) : null}

            {showLegacyItDetails && itDetailsField ? (
              <section className="drawer-section">
                <h3>IT details (legacy)</h3>
                {editingDetails ? (
                  <RecordFieldInput field={itDetailsField} data={draftData} onChange={setDraftData} />
                ) : (
                  <FieldGrid
                    fields={Object.entries(localRecord.data.it_details as Record<string, unknown>).map(([key, value]) => ({
                      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                      value: Array.isArray(value) ? value.join(', ') : String(value ?? '—'),
                    }))}
                  />
                )}
              </section>
            ) : null}

            <RecordActionsPanel
              slug="assets"
              record={localRecord}
              fields={fields}
              actionTypes={actionTypes}
              onPerformed={(updated) => {
                setLocalRecord(updated)
                onUpdated(updated)
              }}
              onAnnounce={onAnnounce}
            />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="asset-detail-tab-panel">
            <div className="asset-detail-tab-toolbar">
              <p>{photos.length} of {MAX_ASSET_PHOTOS} photos</p>
              {photos.length < MAX_ASSET_PHOTOS ? (
                <label className="button secondary small asset-photo-add">
                  <ImagePlus size={14} /> Add photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    multiple
                    hidden
                    disabled={savingPhotos}
                    onChange={(event) => void handlePhotoUpload(event.target.files)}
                  />
                </label>
              ) : null}
            </div>
            {photos.length ? (
              <div className="intake-photo-gallery asset-photo-gallery">
                {photos.map((photo, index) => (
                  <div key={photo.id} className={`intake-photo-card ${photo.primary ? 'is-primary' : ''}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoDisplaySrc(localRecord.id, photo)} alt={`Asset photo ${index + 1}`} />
                    {photo.primary ? <span className="intake-photo-primary">Primary</span> : null}
                    <div className="asset-photo-card-actions">
                      {!photo.primary ? (
                        <button
                          type="button"
                          className="text-button"
                          disabled={savingPhotos}
                          onClick={() => void setPrimaryPhoto(photo.id)}
                        >
                          Set as primary
                        </button>
                      ) : (
                        <span className="asset-photo-primary-label">Header photo</span>
                      )}
                      <button
                        type="button"
                        className="intake-photo-remove"
                        aria-label={`Remove ${photo.name}`}
                        onClick={() => void removePhoto(photo)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Camera}
                title="No photos yet"
                description="Add up to four photos for this asset. The primary photo appears in the summary header."
                ctaLabel="Add photo"
                onCta={() => document.querySelector<HTMLInputElement>('.asset-photo-add input')?.click()}
              />
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="asset-detail-tab-panel">
            {feedEvents.length ? (
              <HistoryList
                items={feedEvents.map((event) => ({
                  what: event.title,
                  who: `${event.actor} · ${event.source}`,
                  when: formatRelativeAssetTime(event.when),
                }))}
              />
            ) : (
              <EmptyState
                title="No events yet"
                description="Check-out, transfer, status changes, and other actions on this asset will appear here."
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="asset-detail-tab-panel">
            {historyRows.length ? (
              <div className="asset-table-wrap">
                <table className="asset-table data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Field</th>
                      <th>Changed from</th>
                      <th>Changed to</th>
                      <th>Action by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row) => (
                      <tr key={row.id}>
                        <td>{formatRelativeAssetTime(row.date)}</td>
                        <td>{row.event}</td>
                        <td>{row.field}</td>
                        <td>{row.from}</td>
                        <td>{row.to}</td>
                        <td>{row.actor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No field history yet"
                description="Granular field-level changes will appear here after actions update this asset."
              />
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="asset-detail-tab-panel">
            <div className="asset-detail-tab-toolbar">
              <p>Work orders from Maintenance, filtered to this asset.</p>
              <button type="button" className="button secondary small" onClick={() => setShowMaintenanceForm(true)}>
                Add New
              </button>
            </div>
            {maintenanceRows.length ? (
              <div className="asset-table-wrap">
                <table className="asset-table data-table">
                  <thead>
                    <tr>
                      <th>Issue</th>
                      <th>Priority</th>
                      <th>Technician</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRows.map((row) => {
                      const item = maintenanceRowToDisplay(row)
                      return (
                        <tr key={row.id}>
                          <td><strong>{item.issueType || item.description || 'Maintenance'}</strong></td>
                          <td>{item.priority}</td>
                          <td>{item.technician || '—'}</td>
                          <td>{item.dueDate || '—'}</td>
                          <td><StatusBadge status={item.status} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Wrench}
                title="No maintenance has been added."
                description="Create a work order tied to this asset. It will also appear on the Maintenance page."
                ctaLabel="Add New"
                onCta={() => setShowMaintenanceForm(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'warranty' && (
          <div className="asset-detail-tab-panel">
            <div className="asset-detail-tab-toolbar">
              <p>Warranty coverage for this asset.</p>
              <button type="button" className="button secondary small" onClick={() => setShowWarrantyForm(true)}>
                Add New
              </button>
            </div>
            {warranties.length ? (
              <div className="asset-warranty-list">
                {warranties.map((warranty) => (
                  <div key={warranty.id} className="asset-warranty-card">
                    <strong>{warranty.provider || 'Warranty'}</strong>
                    <span>Expires {warranty.expiration || '—'}</span>
                    {warranty.coverageNotes ? <p>{warranty.coverageNotes}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Shield}
                title="No warranty has been added."
                description="Track provider, expiration, and coverage notes for this asset."
                ctaLabel="Add New"
                onCta={() => setShowWarrantyForm(true)}
              />
            )}
          </div>
        )}

        {activeTab === 'linking' && (
          <ComingSoonTab
            title="Asset linking coming soon"
            description="Parent/child relationships will use the relation field type from Groups/Fields/Records once that picker is ready."
          />
        )}

        {activeTab === 'reserve' && (
          <ComingSoonTab
            title="Reservations coming soon"
            description="A per-asset calendar view will reuse the org-wide Reservations feature once that module ships."
          />
        )}

        {activeTab === 'audit' && (
          <div className="asset-detail-tab-panel">
            <div className="asset-detail-tab-toolbar">
              <p>Checkpoint audits tied to this asset (same data as the Audits page).</p>
              <button type="button" className="button secondary small" onClick={() => setShowAuditForm(true)}>
                Add Audit
              </button>
            </div>
            {auditRows.length ? (
              <div className="asset-table-wrap">
                <table className="asset-table data-table">
                  <thead>
                    <tr>
                      <th>Audit name</th>
                      <th>Last audited by</th>
                      <th>Audit date</th>
                      <th>Site</th>
                      <th>Location</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => {
                      const item = auditRowToAssetLink(row)
                      return (
                        <tr key={row.id}>
                          <td><strong>{item.name}</strong></td>
                          <td>{item.auditor || '—'}</td>
                          <td>{item.auditDate || '—'}</td>
                          <td>{item.site || '—'}</td>
                          <td>{item.location || '—'}</td>
                          <td>{item.notes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="No audits recorded for this asset"
                description="Log checkpoint audits here. They also appear on the org-wide Audits page."
                ctaLabel="Add Audit"
                onCta={() => setShowAuditForm(true)}
              />
            )}
          </div>
        )}
      </div>

      {showMaintenanceForm && maintenanceFields.length ? (
        <RecordFormDrawer
          slug="maintenance"
          fields={maintenanceFields}
          initialData={{
            asset: assetRef,
            asset_record_id: localRecord.id,
            asset_tag: String(localRecord.data.asset_tag ?? ''),
            status: 'Open',
            priority: 'Medium',
          }}
          onClose={() => setShowMaintenanceForm(false)}
          onSaved={(saved) => {
            setMaintenanceRows((current) => [saved, ...current])
            setShowMaintenanceForm(false)
            onAnnounce('Maintenance record created.')
          }}
          onAnnounce={onAnnounce}
        />
      ) : null}

      {showAuditForm ? (
        <AssetAuditFormModal
          assetRef={assetRef}
          assetRecordId={localRecord.id}
          assetTag={String(localRecord.data.asset_tag ?? '')}
          onClose={() => setShowAuditForm(false)}
          onSaved={(saved) => {
            setAuditRows((current) => [saved, ...current])
            setShowAuditForm(false)
            onAnnounce('Audit recorded for this asset.')
          }}
          onAnnounce={onAnnounce}
        />
      ) : null}

      {showWarrantyForm ? (
        <WarrantyFormModal
          onClose={() => setShowWarrantyForm(false)}
          onSave={(warranty) => {
            void saveWarranties([...warranties, warranty])
            setShowWarrantyForm(false)
          }}
        />
      ) : null}
    </div>
  )
}

function WarrantyFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (warranty: WarrantyRecord) => void
}) {
  const [provider, setProvider] = useState('')
  const [expiration, setExpiration] = useState('')
  const [coverageNotes, setCoverageNotes] = useState('')

  return (
    <div className="action-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="action-modal" role="dialog" aria-modal="true">
        <h3>Add warranty</h3>
        <div className="extracted-fields">
          <label>
            Provider
            <input value={provider} onChange={(e) => setProvider(e.target.value)} />
          </label>
          <label>
            Expiration date
            <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
          </label>
          <label className="extracted-fields-full">
            Coverage notes
            <textarea value={coverageNotes} onChange={(e) => setCoverageNotes(e.target.value)} rows={3} />
          </label>
        </div>
        <div className="action-modal-actions">
          <button type="button" className="button secondary small" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="button primary small"
            onClick={() =>
              onSave({
                id: crypto.randomUUID(),
                provider: provider.trim(),
                expiration,
                coverageNotes: coverageNotes.trim(),
              })
            }
          >
            Save warranty
          </button>
        </div>
      </div>
    </div>
  )
}

function AssetAuditFormModal({
  assetRef,
  assetRecordId,
  assetTag,
  onClose,
  onSaved,
  onAnnounce,
}: {
  assetRef: string
  assetRecordId: string
  assetTag: string
  onClose: () => void
  onSaved: (row: WorkspaceRecordRow) => void
  onAnnounce: Announce
}) {
  const [name, setName] = useState('')
  const [site, setSite] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 10))
  const [recordGps, setRecordGps] = useState(false)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const data: Record<string, unknown> = {
        name: name.trim() || `Audit · ${assetTag || assetRef}`,
        scope: assetRef,
        asset: assetRef,
        asset_record_id: assetRecordId,
        asset_tag: assetTag,
        auditor: 'You',
        start_date: auditDate,
        status: 'Complete',
        audit_site: site.trim(),
        audit_location: location.trim(),
        notes: notes.trim(),
        record_gps: recordGps,
      }
      const response = await fetch('/api/groups/audits/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const payload = (await response.json()) as { record?: WorkspaceRecordRow; error?: string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not save audit.')
      if (payload.record) onSaved(payload.record)
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Could not save audit.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="action-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="action-modal" role="dialog" aria-modal="true">
        <h3>Add audit</h3>
        <p className="action-modal-sub">Saved to the Audits group and linked to this asset.</p>
        <div className="extracted-fields">
          <label>
            Audit name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`Audit · ${assetTag || 'asset'}`} />
          </label>
          <label>
            Site
            <input value={site} onChange={(e) => setSite(e.target.value)} />
          </label>
          <label>
            Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label>
            Audit date
            <input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} />
          </label>
          <label className="extracted-fields-full">
            Audit notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>
          <label className="setting-row">
            <div>
              <strong>Record GPS coordinates</strong>
              <span>Capture device location when supported.</span>
            </div>
            <button
              type="button"
              className={`fake-switch ${recordGps ? 'on' : ''}`}
              role="switch"
              aria-checked={recordGps}
              onClick={() => setRecordGps((current) => !current)}
            />
          </label>
        </div>
        <div className="action-modal-actions">
          <button type="button" className="button secondary small" onClick={onClose}>Cancel</button>
          <button type="button" className="button primary small" disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save audit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function photoDisplaySrc(recordId: string, photo: AssetPhoto): string {
  if (
    photo.previewUrl &&
    (photo.previewUrl.startsWith('blob:') ||
      photo.previewUrl.startsWith('data:') ||
      photo.previewUrl.startsWith('http'))
  ) {
    return photo.previewUrl
  }
  if (photo.storagePath) return assetPhotoDisplayUrl(recordId, photo.storagePath)
  return photo.previewUrl
}

async function resolvePhotoPreviewUrls(
  recordId: string,
  photos: StoredAssetPhoto[],
  fallback: AssetPhoto[] = [],
): Promise<AssetPhoto[]> {
  if (!photos.length) return []

  const fallbackById = new Map(fallback.map((photo) => [photo.id, photo.previewUrl]))
  const paths = photos.map((photo) => photo.storagePath).filter(Boolean)
  if (!paths.length) {
    return photos.map((photo) => ({
      ...photo,
      previewUrl: fallbackById.get(photo.id) ?? '',
    }))
  }

  const response = await fetch(`/api/assets/records/${recordId}/photos/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  })
  const payload = (await response.json()) as { urls?: Record<string, string>; error?: string }
  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load photo previews.')
  }

  const urls = payload.urls ?? {}
  return photos.map((photo) => ({
    ...photo,
    previewUrl: urls[photo.storagePath] ?? fallbackById.get(photo.id) ?? '',
  }))
}
