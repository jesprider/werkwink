import type { DailyNote } from '../schema/types'

export function upsertDailyNote(notes: DailyNote[], date: string, text: string): DailyNote[] {
  const next = [...notes]
  const idx = next.findIndex((n) => n.date === date)
  if (idx >= 0) {
    next[idx] = { date, text }
  } else {
    next.push({ date, text })
  }
  next.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return next
}
