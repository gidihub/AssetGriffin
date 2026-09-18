/** Scroll the main workspace pane so newly opened views (e.g. asset detail) are visible. */
export function scrollPageContentToTop() {
  if (typeof document === 'undefined') return
  document.querySelector('.page-content')?.scrollTo({ top: 0, behavior: 'auto' })
}
