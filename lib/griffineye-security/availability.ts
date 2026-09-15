/** Structured honesty contract for tools and extraction paths. */
export type GriffinEyeAvailability<T = unknown> =
  | { available: true; data: T }
  | { available: false; reason: string }

export function available<T>(data: T): GriffinEyeAvailability<T> {
  return { available: true, data }
}

export function unavailable(reason: string): GriffinEyeAvailability<never> {
  return { available: false, reason }
}

/** What the model sees from a tool — never omit the availability envelope. */
export function toModelToolPayload<T>(result: GriffinEyeAvailability<T>): Record<string, unknown> {
  if (!result.available) {
    return { available: false, reason: result.reason }
  }
  return { available: true, ...wrapData(result.data) }
}

function wrapData(data: unknown): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return { value: data }
}
