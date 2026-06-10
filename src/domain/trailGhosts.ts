import type { Snapshot } from '../schema/types'

export interface TrailGhost {
  position: number
  opacity: number
}

const DEFAULT_MAX = 7

function ghostOpacity(index: number, count: number): number {
  if (count <= 1) return 0.7
  return 0.1 + (0.6 * index) / (count - 1)
}

export function trailGhosts(
  snapshots: Snapshot[],
  today: string,
  maxCount = DEFAULT_MAX,
): TrailGhost[] {
  const prior = snapshots.filter((s) => s.date !== today).slice(0, maxCount)
  if (prior.length === 0) return []

  const oldestFirst = [...prior].sort((a, b) => a.date.localeCompare(b.date))
  return oldestFirst.map((s, i) => ({
    position: s.position,
    opacity: ghostOpacity(i, oldestFirst.length),
  }))
}
