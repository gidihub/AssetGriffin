/** Parse/save select & status field options without hand-editing JSON. */

export function parseFieldOptionsText(optionsText: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(optionsText || '{}')
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}

export function choicesFromOptionsText(optionsText: string): string[] {
  const options = parseFieldOptionsText(optionsText)
  const choices = options.choices
  if (!Array.isArray(choices)) return []
  return choices.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

export function optionsTextWithChoices(optionsText: string, choices: string[]): string {
  return optionsTextWithStringArray(optionsText, 'choices', choices)
}

export function stringArrayFromOptionsText(optionsText: string, key: string): string[] {
  const options = parseFieldOptionsText(optionsText)
  const values = options[key]
  if (!Array.isArray(values)) return []
  return values.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

export function optionsTextWithStringArray(optionsText: string, key: string, values: string[]): string {
  const options = parseFieldOptionsText(optionsText)
  const normalized = [...new Set(values.map((value) => value.trim()).filter(Boolean))]
  return JSON.stringify({ ...options, [key]: normalized })
}

export function descriptionFromOptionsText(optionsText: string): string {
  const description = parseFieldOptionsText(optionsText).description
  return typeof description === 'string' ? description : ''
}

export function optionsTextWithDescription(optionsText: string, description: string): string {
  const options = parseFieldOptionsText(optionsText)
  const trimmed = description.trim()
  if (trimmed) return JSON.stringify({ ...options, description: trimmed })
  const { description: _removed, ...rest } = options
  return JSON.stringify(rest)
}

export function isDeprecatedFieldOptions(optionsText: string): boolean {
  return parseFieldOptionsText(optionsText).deprecated === true
}
