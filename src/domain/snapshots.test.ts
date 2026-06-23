import { describe, it, expect } from 'vitest'
import { isPositionDirty, upsertSnapshot } from './snapshots'
import type { HillTrackable, Snapshot } from '../schema/types'

function trackable(position: number, snapshots: Snapshot[]): HillTrackable {
  return {
    id: 't',
    name: 't',
    position,
    lastMovedAt: '2026-06-06T10:00:00.000Z',
    forces: [],
    snapshots,
    dailyNoteDraft: '',
    notes: [],
  }
}

describe('upsertSnapshot', () => {
  it('appends a new snapshot sorted newest-first', () => {
    const result = upsertSnapshot([], '2026-06-06', 42)
    expect(result).toEqual([{ date: '2026-06-06', position: 42 }])
  })

  it('replaces position when date already exists', () => {
    const existing: Snapshot[] = [{ date: '2026-06-06', position: 10 }]
    const result = upsertSnapshot(existing, '2026-06-06', 55)
    expect(result).toEqual([{ date: '2026-06-06', position: 55 }])
  })

  it('sorts descending by date', () => {
    const existing: Snapshot[] = [{ date: '2026-06-05', position: 10 }]
    const result = upsertSnapshot(existing, '2026-06-06', 20)
    expect(result).toEqual([
      { date: '2026-06-06', position: 20 },
      { date: '2026-06-05', position: 10 },
    ])
  })
})

describe('isPositionDirty', () => {
  it('is true when there are no snapshots', () => {
    expect(isPositionDirty(trackable(30, []))).toBe(true)
  })

  it('is true when position differs from the latest snapshot', () => {
    expect(isPositionDirty(trackable(42, [{ date: '2026-06-06', position: 30 }]))).toBe(true)
  })

  it('is false when position equals the latest snapshot', () => {
    expect(isPositionDirty(trackable(30, [{ date: '2026-06-06', position: 30 }]))).toBe(false)
  })

  it('compares against the newest snapshot (index 0)', () => {
    const snapshots: Snapshot[] = [
      { date: '2026-06-06', position: 50 },
      { date: '2026-06-05', position: 20 },
    ]
    expect(isPositionDirty(trackable(50, snapshots))).toBe(false)
    expect(isPositionDirty(trackable(20, snapshots))).toBe(true)
  })
})
