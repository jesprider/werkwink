import type { DailyNote } from '../schema/types'

/**
 * Append `text` to the note for `date` (newline-joined), or create the entry when
 * none exists yet. Keeps the list sorted newest date first.
 */
export function appendDailyNote(notes: DailyNote[], date: string, text: string): DailyNote[] {
  const next = [...notes]
  const idx = next.findIndex((n) => n.date === date)
  if (idx >= 0) {
    next[idx] = { date, text: `${next[idx].text}\n${text}` }
  } else {
    next.push({ date, text })
  }
  next.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return next
}
