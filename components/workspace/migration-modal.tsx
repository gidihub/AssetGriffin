'use client'

import { useCallback, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, CloudUpload, FileSpreadsheet } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinking } from '@/components/griffineye/griffineye-thinking'
import type { ColumnMapping, GriffinImportExtraction, ImportAssetRecord } from '@/lib/griffineye-import'

type Stage = 'upload' | 'extracting' | 'review' | 'importing'

const ACCEPT = '.csv,text/csv'

export function MigrationModal({
  onComplete,
}: {
  onComplete: (result: { imported: number }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('upload')
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<GriffinImportExtraction | null>(null)
  const [records, setRecords] = useState<ImportAssetRecord[]>([])

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setFileName(file.name)
    setStage('extracting')

    const body = new FormData()
    body.append('file', file)

    try {
      const response = await fetch('/api/griffin-extract', { method: 'POST', body })
      const data = (await response.json()) as GriffinImportExtraction & { error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? 'GriffinEye could not read this spreadsheet.')
      }

      setExtraction(data)
      setRecords(data.records)
      setStage('review')
    } catch (err) {
      setStage('upload')
      setError(err instanceof Error ? err.message : 'GriffinEye could not read this spreadsheet.')
    }
  }, [])

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
      const response = await fetch('/api/assets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const data = (await response.json()) as { imported?: number; error?: string }

      if (!response.ok) {
        throw new Error(data.error ?? 'Import failed.')
      }

      onComplete({ imported: data.imported ?? records.length })
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
            <span>{extraction?.summary ?? `Prepared ${records.length} records for review.`}</span>
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
              <small>{fileName ?? 'CSV uploaded'}</small>
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
                GriffinEye mapped {extraction?.columnMappings.filter((m) => m.target).length ?? 0} columns ·{' '}
                {records.length} records ready
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

        <MappingPreview mappings={extraction?.columnMappings ?? []} />
        <RecordPreview records={records.slice(0, 5)} total={records.length} />

        {error && (
          <div className="workflow-note" style={{ color: '#B23B3B', background: '#FBE7E7' }}>
            <span>{error}</span>
          </div>
        )}

        {stage === 'importing' ? (
          <GriffinEyeThinking message="GriffinEye is writing assets to your organization…" />
        ) : (
          <button className="button primary full-width" onClick={handleImport} disabled={!records.length}>
            <Check size={16} /> Import {records.length} records
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
          <strong>Bring your existing inventory.</strong>
          <span>Upload a CSV export and GriffinEye will map columns to AssetGriffin fields.</span>
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
        <strong>{stage === 'extracting' ? 'GriffinEye is mapping your columns…' : 'Drop a CSV export here'}</strong>
        <span>AssetTiger, Excel-as-CSV, or any comma-separated asset export.</span>
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
        <small>CSV up to 5 MB</small>
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

function MappingPreview({ mappings }: { mappings: ColumnMapping[] }) {
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
          <b>{mapping.target}</b>
        </p>
      ))}
    </div>
  )
}

function RecordPreview({ records, total }: { records: ImportAssetRecord[]; total: number }) {
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
