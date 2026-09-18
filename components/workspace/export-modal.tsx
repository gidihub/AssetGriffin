'use client'

import { useState, type ReactNode } from 'react'
import { ArrowUpFromLine, FileSpreadsheet, X } from 'lucide-react'
import {
  RECORD_EXPORT_FORMATS,
  type RecordExportFormat,
  type RecordExportOptions,
} from '@/lib/record-export'

const FORMAT_LABELS: Record<RecordExportFormat, string> = {
  xls: 'XLS',
  xlsx: 'XLSX',
  csv: 'CSV',
  tsv: 'TSV',
}

export function ExportModal({
  title = 'Export',
  summary,
  includeTabularOption = true,
  includeFilesOption = false,
  onClose,
  onExport,
}: {
  title?: string
  summary: ReactNode
  includeTabularOption?: boolean
  includeFilesOption?: boolean
  onClose: () => void
  onExport: (options: RecordExportOptions) => Promise<void>
}) {
  const [format, setFormat] = useState<RecordExportFormat>('xlsx')
  const [includeTabular, setIncludeTabular] = useState(false)
  const [includeFiles, setIncludeFiles] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setSubmitting(true)
    setError(null)
    try {
      await onExport({
        format,
        includeTabular: includeTabularOption ? includeTabular : false,
        includeFiles: includeFilesOption ? includeFiles : false,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const showOptions = includeTabularOption || includeFilesOption

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal export-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">EXPORT</span>
            <h2 id="export-modal-title">{title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="export-modal-hero" aria-hidden="true">
            <div className="export-modal-docs">
              <FileSpreadsheet size={28} />
              <FileSpreadsheet size={34} />
              <FileSpreadsheet size={28} />
            </div>
            <span className="export-modal-badge">
              <ArrowUpFromLine size={16} />
            </span>
          </div>

          <p className="export-modal-summary">{summary}</p>

          <fieldset className="export-format-fieldset">
            <legend>Choose file format</legend>
            <div className="export-format-grid">
              {RECORD_EXPORT_FORMATS.map((option) => (
                <label key={option} className={`export-format-option ${format === option ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="export-format"
                    value={option}
                    checked={format === option}
                    onChange={() => setFormat(option)}
                  />
                  <span>{FORMAT_LABELS[option]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {showOptions ? (
            <div className="export-option-list">
              {includeTabularOption ? (
                <label className="export-option-row">
                  <input
                    type="checkbox"
                    checked={includeTabular}
                    onChange={(event) => setIncludeTabular(event.target.checked)}
                  />
                  <span>Include tabular section data</span>
                </label>
              ) : null}
              {includeFilesOption ? (
                <label className="export-option-row">
                  <input
                    type="checkbox"
                    checked={includeFiles}
                    onChange={(event) => setIncludeFiles(event.target.checked)}
                  />
                  <span>Include files &amp; images</span>
                </label>
              ) : null}
            </div>
          ) : null}

          {error && <p className="export-modal-error">{error}</p>}

          <div className="export-modal-actions">
            <button type="button" className="button primary" onClick={() => void handleExport()} disabled={submitting}>
              {submitting ? 'Exporting…' : 'Export'}
            </button>
            <button type="button" className="button secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
