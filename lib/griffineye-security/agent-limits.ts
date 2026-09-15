export const MAX_TOOL_ROUNDS = 3
export const MAX_TOOL_CALLS_PER_QUERY = 15
export const TOOL_TIMEOUT_MS = 8_000

export async function withToolTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${TOOL_TIMEOUT_MS / 1000}s`))
        }, TOOL_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
