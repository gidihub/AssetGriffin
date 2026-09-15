'use client'

import { useState } from 'react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinking } from '@/components/griffineye/griffineye-thinking'

export function GriffinEyeSearchBar({
  onSubmit,
  disabled,
}: {
  onSubmit: (query: string) => void | Promise<void>
  disabled?: boolean
}) {
  const [value, setValue] = useState('')
  const [thinking, setThinking] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const query = value.trim()
    if (!query || thinking || disabled) return

    setThinking(true)
    try {
      await onSubmit(query)
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="griffineye-search-wrap">
      <form className="griffin-eye-bar" onSubmit={handleSubmit}>
        <GriffinEyeIcon size={16} />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Ask GriffinEye anything about your assets…"
          disabled={thinking || disabled}
          aria-label="Ask GriffinEye"
        />
        <button type="submit" className="button dark small" disabled={!value.trim() || thinking || disabled}>
          Ask
        </button>
      </form>
      {thinking && <GriffinEyeThinking message="GriffinEye is reviewing your assets…" />}
    </div>
  )
}
