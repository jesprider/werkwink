import { describe, it, expect } from 'vitest'
import { trailGhosts } from './trailGhosts'
import type { Snapshot } from '../schema/types'

describe('trailGhosts', () => {
  it('returns empty when there are no snapshots', () => {
    expect(trailGhosts([], '2026-06-07')).toEqual([])
  })

  it("excludes today's snapshot", () => {
    const snapshots: Snapshot[] = [
      { date: '2026-06-07', position: 50 },
      { date: '2026-06-06', position: 40 },
    ]
    expect(trailGhosts(snapshots, '2026-06-07')).toEqual([{ position: 40, opacity: 0.7 }])
  })

  it('caps at 7 prior-day snapshots', () => {
    const snapshots: Snapshot[] = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, '0')}`,
      position: i * 10,
    })).reverse() // newest-first
    const result = trailGhosts(snapshots, '2026-06-10')
    expect(result).toHaveLength(7)
    expect(result.map((g) => g.position)).toEqual([20, 30, 40, 50, 60, 70, 80])
  })

  it('assigns opacity 0.7 for a single ghost', () => {
    const snapshots: Snapshot[] = [{ date: '2026-06-05', position: 25 }]
    expect(trailGhosts(snapshots, '2026-06-07')).toEqual([{ position: 25, opacity: 0.7 }])
  })

  it('ramps opacity from 0.1 (oldest) to 0.7 (newest) for two ghosts', () => {
    const snapshots: Snapshot[] = [
      { date: '2026-06-06', position: 60 },
      { date: '2026-06-05', position: 40 },
    ]
    expect(trailGhosts(snapshots, '2026-06-07')).toEqual([
      { position: 40, opacity: 0.1 },
      { position: 60, opacity: 0.7 },
    ])
  })

  it('returns ghosts oldest-first regardless of input order', () => {
    const snapshots: Snapshot[] = [
      { date: '2026-06-04', position: 10 },
      { date: '2026-06-06', position: 30 },
      { date: '2026-06-05', position: 20 },
    ]
    const result = trailGhosts(snapshots, '2026-06-07')
    expect(result.map((g) => g.position)).toEqual([10, 20, 30])
  })
})
