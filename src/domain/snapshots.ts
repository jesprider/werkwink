import type { Snapshot } from '../schema/types'

export function upsertSnapshot(snapshots: Snapshot[], date: string, position: number): Snapshot[] {
  const next = [...snapshots]
  const idx = next.findIndex((s) => s.date === date)
  if (idx >= 0) {
    next[idx] = { date, position }
  } else {
    next.push({ date, position })
  }
  next.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  return next
}
