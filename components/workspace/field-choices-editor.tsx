'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  choicesFromOptionsText,
  optionsTextWithChoices,
  optionsTextWithStringArray,
  stringArrayFromOptionsText,
} from '@/lib/field-choices-editor'

export function FieldChoicesEditor({
  optionsText,
  onChange,
  placeholder = 'Add choice…',
  arrayKey = 'choices',
  emptyLabel = 'No choices yet',
}: {
  optionsText: string
  onChange: (optionsText: string) => void
  placeholder?: string
  /** Options JSON array key — `choices` for select/status, `suggested` for tag fields. */
  arrayKey?: 'choices' | 'suggested'
  emptyLabel?: string
}) {
  const choices =
    arrayKey === 'choices'
      ? choicesFromOptionsText(optionsText)
      : stringArrayFromOptionsText(optionsText, arrayKey)
  const [draft, setDraft] = useState('')

  function setChoices(next: string[]) {
    onChange(
      arrayKey === 'choices'
        ? optionsTextWithChoices(optionsText, next)
        : optionsTextWithStringArray(optionsText, arrayKey, next),
    )
  }

  function addChoice() {
    const value = draft.trim()
    if (!value) return
    if (choices.some((choice) => choice.toLowerCase() === value.toLowerCase())) {
      setDraft('')
      return
    }
    setChoices([...choices, value])
    setDraft('')
  }

  return (
    <div className="field-choices-editor">
      <div className="field-choices-list">
        {choices.length ? (
          choices.map((choice) => (
            <span key={choice} className="field-choice-pill">
              {choice}
              <button
                type="button"
                className="field-choice-remove"
                aria-label={`Remove ${choice}`}
                onClick={() => setChoices(choices.filter((entry) => entry !== choice))}
              >
                <X size={12} />
              </button>
            </span>
          ))
        ) : (
          <span className="field-choices-empty">{emptyLabel}</span>
        )}
      </div>
      <div className="field-choices-add">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label="New choice"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addChoice()
            }
          }}
        />
        <button type="button" className="button secondary small" onClick={addChoice} disabled={!draft.trim()}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  )
}
