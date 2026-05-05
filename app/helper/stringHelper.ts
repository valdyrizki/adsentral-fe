// helper/stringHelper.ts
export function stripHtml(html: string): string {
  if (!html) return ''
  if (typeof document !== 'undefined') {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  // SSR fallback — simple regex
  return html.replace(/<[^>]*>/g, '')
}