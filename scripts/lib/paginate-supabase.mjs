/** Fetch all rows from a Supabase query using .range() pagination. */

export const DEFAULT_PAGE_SIZE = 1000

/**
 * @param {(from: number, to: number) => Promise<{ data: unknown[] | null; error: { message: string } | null }>} fetchPage
 * @param {number} [pageSize]
 */
export async function fetchAllPages(fetchPage, pageSize = DEFAULT_PAGE_SIZE) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) throw new Error(error.message)

    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < pageSize) break
    from += pageSize
  }

  return rows
}
