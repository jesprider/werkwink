/** Local calendar date as YYYY-MM-DD (zero-padded). */
export function localDateString(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** True when dateStr is the same local calendar day as d (default now). */
export function isSameLocalDay(dateStr: string, d = new Date()): boolean {
  return dateStr === localDateString(d)
}
