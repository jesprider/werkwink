import type { HillTrackable, Snapshot } from '../schema/types'

/**
 * True when the trackable's current position differs from its latest snapshot, or it
 * has never been captured. Snapshots are sorted newest-first, so `snapshots[0]` is the
 * most recent. Drives the delta-armed Capture button.
 */
export function isPositionDirty(trackable: HillTrackable): boolean {
  const latest = trackable.snapshots[0]
  return latest === undefined || latest.position !== trackable.position
}

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
