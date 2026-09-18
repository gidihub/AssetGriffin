'use client'

import {
  descriptionFromOptionsText,
  isDeprecatedFieldOptions,
  optionsTextWithDescription,
  parseFieldOptionsText,
} from '@/lib/field-choices-editor'
import type { FieldType } from '@/lib/schema-types'
import { FieldChoicesEditor } from './field-choices-editor'

function FieldOptionsDescription({
  optionsText,
  onChange,
  placeholder,
}: {
  optionsText: string
  onChange: (optionsText: string) => void
  placeholder?: string
}) {
  const description = descriptionFromOptionsText(optionsText)
  return (
    <label className="field-options-description">
      <span>Description</span>
      <input
        value={description}
        onChange={(event) => onChange(optionsTextWithDescription(optionsText, event.target.value))}
        placeholder={placeholder ?? 'Optional helper text for this field'}
      />
    </label>
  )
}

export function FieldOptionsEditor({
  fieldKey,
  fieldType,
  optionsText,
  onChange,
}: {
  fieldKey: string
  fieldType: FieldType
  optionsText: string
  onChange: (optionsText: string) => void
}) {
  const options = parseFieldOptionsText(optionsText)
  const hasSuggested = Array.isArray(options.suggested) || fieldKey === 'security_monitoring_software'
  const deprecated = isDeprecatedFieldOptions(optionsText) || fieldKey === 'it_details'

  if (fieldType === 'select' || fieldType === 'status') {
    return (
      <FieldChoicesEditor
        optionsText={optionsText}
        onChange={onChange}
        placeholder="Add choice…"
      />
    )
  }

  if (fieldType === 'json' && deprecated) {
    return (
      <div className="field-options-stack field-options-deprecated">
        <span className="field-options-badge">Deprecated field</span>
        <p className="field-options-deprecated-copy">
          Legacy data may still exist on old records. This field is hidden when empty and is not used for new
          imports.
        </p>
        <FieldOptionsDescription
          optionsText={optionsText}
          onChange={onChange}
          placeholder="Why this field is deprecated"
        />
      </div>
    )
  }

  if (fieldType === 'json' && hasSuggested) {
    return (
      <div className="field-options-stack">
        <div className="field-options-section">
          <span className="field-options-section-label">Suggested values</span>
          <FieldChoicesEditor
            optionsText={optionsText}
            onChange={onChange}
            arrayKey="suggested"
            placeholder="Add suggested tag…"
            emptyLabel="No suggested values"
          />
        </div>
        <FieldOptionsDescription
          optionsText={optionsText}
          onChange={onChange}
          placeholder="Shown as helper text when editing this field"
        />
      </div>
    )
  }

  if (fieldType === 'json' && typeof options.description === 'string') {
    return (
      <FieldOptionsDescription
        optionsText={optionsText}
        onChange={onChange}
      />
    )
  }

  if (fieldType === 'json' && Object.keys(options).length === 0) {
    return (
      <span className="field-options-empty-json">No extra options — users enter structured JSON on each record.</span>
    )
  }

  return (
    <details className="field-options-advanced">
      <summary>Advanced JSON</summary>
      <textarea
        value={optionsText}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        spellCheck={false}
        aria-label={`${fieldKey} options JSON`}
      />
    </details>
  )
}
