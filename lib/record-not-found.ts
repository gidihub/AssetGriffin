/** Maps Supabase empty-row / missing-record errors to a stable not-found message. */
export function isRecordNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  const code = (error as { code?: string }).code
  return (
    error.message === 'Record not found.' ||
    code === 'PGRST116' ||
    message.includes('0 rows') ||
    message.includes('row not found')
  )
}

export function recordNotFoundMessage(): string {
  return 'Record not found.'
}
