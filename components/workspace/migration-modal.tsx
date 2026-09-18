'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, CloudUpload, FileSpreadsheet } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinking } from '@/components/griffineye/griffineye-thinking'
import type { GriffinExtractTargetGroup } from '@/lib/group-import'
import type { ColumnMapping, GriffinImportExtraction, ImportAssetRecord } from '@/lib/griffineye-import'
import type { GriffinPeopleImportExtraction, ImportPeopleRecord, PeopleColumnMapping } from '@/lib/griffineye-people-import'
import { PEOPLE_IMPORT_FIELD_LABELS } from '@/lib/griffineye-people-import-labels'

export type ImportTargetGroup = GriffinExtractTargetGroup

type Stage = 'upload' | 'extracting' | 'review' | 'importing'

const ACCEPT = '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

type ImportPhotoSummary = {
  attached: number
  skipped: number
  failed: Array<{ assetTag: string; reason: string }>
}

type MigrationCopy = {
  uploadTitle: string
  uploadDescription: string
  dropHint: string
  recordNoun: string
  importingMessage: string
  importEndpoint: string
}

const COPY: Record<ImportTargetGroup, MigrationCopy> = {
  assets: {
    uploadTitle: 'Bring your existing inventory.',
    uploadDescription: 'Upload a CSV or Excel export and GriffinEye will map columns to AssetGriffin fields.',
    dropHint: 'Excel, Google Sheets CSV, or any asset inventory export.',
    recordNoun: 'records',
    importingMessage: 'Importing assets and downloading photos from spreadsheet URLs…',
    importEndpoint: '/api/assets/import',
  },
  people: {
    uploadTitle: 'Import your people directory.',
    uploadDescription:
      'Upload an HR export (Zoho, BambooHR, Gusto, etc.) and GriffinEye will map relevant columns to People & teams.',
    dropHint: 'HR roster CSV or Excel — messy exports with dozens of columns are fine.',
    recordNoun: 'people',
    importingMessage: 'Importing people into your organization…',
    importEndpoint: '/api/groups/people/import',
  },
}

export function MigrationModal({
  targetGroup = 'assets',
  onComplete,
}: {
  targetGroup?: ImportTargetGroup
  onComplete: (result: { imported: number; photos?: ImportPhotoSummary; targetGroup: ImportTargetGroup }) => void
}) {
  const copy = COPY[targetGroup]
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [assetExtraction, setAssetExtraction] = useState<GriffinImportExtraction | null>(null)
  const [peopleExtraction, setPeopleExtraction] = useState<GriffinPeopleImportExtraction | null>(null)
  const [assetRecords, setAssetRecords] = useState<ImportAssetRecord[]>([])
  const [peopleRecords, setPeopleRecords] = useState<ImportPeopleRecord[]>([])

  const records = targetGroup === 'people' ? peopleRecords : assetRecords
  const extraction = targetGroup === 'people' ? peopleExtraction : assetExtraction
  const mappedColumnCount =
    targetGroup === 'people'
      ? (peopleExtraction?.columnMappings.filter((mapping) => mapping.target).length ?? 0)
      : (assetExtraction?.columnMappings.filter((mapping) => mapping.target).length ?? 0)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    const lower = file.name.toLowerCase()
    const supported =
      lower.endsWith('.csv') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      lower.endsWith('.txt')
    if (!supported) {
      setError('Upload a CSV or Excel file (.csv, .xlsx, .xls).')
      return
    }

    setFileName(file.name)
    setStage('extracting')
    setAssetExtraction(null)
    setPeopleExtraction(null)
    setAssetRecords([])
    setPeopleRecords([])

    const body = new FormData()
    body.append('file', file)
    body.append('targetGroup', targetGroup)

    try {
      const response = await fetch('/api/griffin-extract', { method: 'POST', body })
      const data = (await response.json()) as (GriffinImportExtraction | GriffinPeopleImportExtraction) & {
        error?: string
        targetGroup?: ImportTargetGroup
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'GriffinEye could not read this spreadsheet.')
      }

      if (targetGroup === 'people') {
        const peopleData = data as GriffinPeopleImportExtraction
        setPeopleExtraction(peopleData)
        setPeopleRecords(peopleData.records)
      } else {
        const assetData = data as GriffinImportExtraction
        setAssetExtraction(assetData)
        setAssetRecords(assetData.records)
      }

      setStage('review')
    } catch (err) {
      setStage('upload')
      setError(err instanceof Error ? err.message : 'GriffinEye could not read this spreadsheet.')
    }
  }, [targetGroup])

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void processFile(file)
    event.target.value = ''
  }

  async function handleImport() {
    if (!records.length) return
    setStage('importing')
    setError(null)

    try {
      const response = await fetch(copy.importEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const data = (await response.json()) as {
        imported?: number
        photos?: ImportPhotoSummary
        error?: string
      }

      if (!response.ok) {
        throw new Error(data.error ?? 'Import failed.')
      }

      onComplete({
        imported: data.imported ?? records.length,
        photos: data.photos,
        targetGroup,
      })
    } catch (err) {
      setStage('review')
      setError(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  if (stage === 'review' || stage === 'importing') {
    return (
      <div className="modal-body">
        <div className="migration-callout">
          <GriffinEyeIcon size={22} />
          <div>
            <strong>Review with GriffinEye</strong>
            <span>{extraction?.summary ?? `Prepared ${records.length} ${copy.recordNoun} for review.`}</span>
          </div>
        </div>

        {extraction?.warnings?.length ? (
          <div className="workflow-note" style={{ marginTop: 12 }}>
            <span>{extraction.warnings.join(' ')}</span>
          </div>
        ) : null}

        <div className="migration-steps">
          <div className="migration-step complete">
            <span>1</span>
            <div>
              <strong>Upload your export</strong>
              <small>{fileName ?? 'Spreadsheet uploaded'}</small>
            </div>
            <Check size={17} />
          </div>
          <div className="migration-step active-step">
            <span className="migration-step-griffineye">
              <GriffinEyeIcon size={15} />
            </span>
            <div>
              <strong>Review with GriffinEye</strong>
              <small>
                GriffinEye mapped {mappedColumnCount} columns · {records.length} {copy.recordNoun} ready
              </small>
            </div>
            <ChevronDown size={17} />
          </div>
          <div className="migration-step">
            <span>3</span>
            <div>
              <strong>Validate and import</strong>
              <small>Preview before anything is saved</small>
            </div>
          </div>
        </div>

        {targetGroup === 'people' ? (
          <PeopleMappingPreview mappings={peopleExtraction?.columnMappings ?? []} />
        ) : (
          <AssetMappingPreview mappings={assetExtraction?.columnMappings ?? []} />
        )}

        {targetGroup === 'people' ? (
          <PeopleRecordPreview records={peopleRecords.slice(0, 5)} total={peopleRecords.length} />
        ) : (
          <AssetRecordPreview records={assetRecords.slice(0, 5)} total={assetRecords.length} />
        )}

        {targetGroup === 'assets' && assetRecords.some((record) => record.photo_url) ? (
          <div className="workflow-note" style={{ marginTop: 12 }}>
            <span>
              {assetRecords.filter((record) => record.photo_url).length} record
              {assetRecords.filter((record) => record.photo_url).length === 1 ? '' : 's'} include a photo URL.
              Images will be downloaded and attached during import.
            </span>
          </div>
        ) : null}

        {targetGroup === 'people' ? (
          <div className="workflow-note" style={{ marginTop: 12 }}>
            <span>People imports create directory records only — no login accounts or invites are sent.</span>
          </div>
        ) : null}

        {error && (
          <div className="workflow-note" style={{ color: '#B23B3B', background: '#FBE7E7' }}>
            <span>{error}</span>
          </div>
        )}

        {stage === 'importing' ? (
          <GriffinEyeThinking message={copy.importingMessage} />
        ) : (
          <button className="button primary full-width" onClick={() => void handleImport()} disabled={!records.length}>
            <Check size={16} /> Import {records.length} {copy.recordNoun}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="modal-body">
      <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={onInputChange} />

      <div className="migration-callout">
        <FileSpreadsheet size={22} />
        <div>
          <strong>{copy.uploadTitle}</strong>
          <span>{copy.uploadDescription}</span>
        </div>
      </div>

      <div
        className="dropzone"
        style={stage === 'extracting' ? { pointerEvents: 'none', opacity: 0.75 } : undefined}
        role="button"
        tabIndex={0}
        onClick={() => stage !== 'extracting' && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (stage !== 'extracting' && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <div className="drop-icon">
          <CloudUpload size={24} />
        </div>
        <strong>{stage === 'extracting' ? 'GriffinEye is mapping your columns…' : 'Drop a spreadsheet export here'}</strong>
        <span>{copy.dropHint}</span>
        <button
          type="button"
          className="button primary small"
          disabled={stage === 'extracting'}
          onClick={(event) => {
            event.stopPropagation()
            inputRef.current?.click()
          }}
        >
          <CloudUpload size={15} /> Choose file
        </button>
        <small>CSV or Excel up to 5 MB</small>
      </div>

      {stage === 'extracting' && <GriffinEyeThinking message="GriffinEye is reviewing column mappings…" />}

      {error && (
        <div className="workflow-note" style={{ color: '#B23B3B', background: '#FBE7E7' }}>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function AssetMappingPreview({ mappings }: { mappings: ColumnMapping[] }) {
  const mapped = mappings.filter((mapping) => mapping.target)
  if (!mapped.length) return null

  return (
    <div className="mapping-preview">
      <div>
        <span>YOUR COLUMN</span>
        <span />
        <span>ASSETGRIFFIN FIELD</span>
      </div>
      {mapped.slice(0, 6).map((mapping) => (
        <p key={`${mapping.source}-${mapping.target}`}>
          <strong>{mapping.source}</strong>
          <ArrowUpRight size={13} />
          <b>{mapping.target === 'photo_url' ? 'Photo URL' : mapping.target}</b>
        </p>
      ))}
    </div>
  )
}

function PeopleMappingPreview({ mappings }: { mappings: PeopleColumnMapping[] }) {
  const mapped = mappings.filter((mapping) => mapping.target)
  if (!mapped.length) return null

  return (
    <div className="mapping-preview">
      <div>
        <span>YOUR COLUMN</span>
        <span />
        <span>PEOPLE FIELD</span>
      </div>
      {mapped.slice(0, 8).map((mapping) => (
        <p key={`${mapping.source}-${mapping.target}`}>
          <strong>{mapping.source}</strong>
          <ArrowUpRight size={13} />
          <b>
            {mapping.target === 'first_name' || mapping.target === 'last_name'
              ? mapping.target.replace('_', ' ')
              : PEOPLE_IMPORT_FIELD_LABELS[mapping.target as keyof typeof PEOPLE_IMPORT_FIELD_LABELS] ?? mapping.target}
          </b>
        </p>
      ))}
    </div>
  )
}

function AssetRecordPreview({ records, total }: { records: ImportAssetRecord[]; total: number }) {
  if (!records.length) return null

  return (
    <div className="import-preview-table-wrap">
      <p className="import-preview-caption">
        Previewing {records.length} of {total} records
      </p>
      <table className="import-preview-table">
        <thead>
          <tr>
            <th>Asset tag</th>
            <th>Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.asset_tag}-${record.name}`}>
              <td>{record.asset_tag}</td>
              <td>{record.name}</td>
              <td>{record.category}</td>
              <td>{record.location || '—'}</td>
              <td>{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PeopleRecordPreview({ records, total }: { records: ImportPeopleRecord[]; total: number }) {
  if (!records.length) return null

  return (
    <div className="import-preview-table-wrap">
      <p className="import-preview-caption">
        Previewing {records.length} of {total} people
      </p>
      <table className="import-preview-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Title</th>
            <th>Department</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.employee_id || record.email || record.name}`}>
              <td>{record.name}</td>
              <td>{record.email || '—'}</td>
              <td>{record.title || record.role || '—'}</td>
              <td>{record.department || '—'}</td>
              <td>{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
