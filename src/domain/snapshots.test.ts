import { describe, it, expect } from 'vitest'
import { upsertSnapshot } from './snapshots'
import type { Snapshot } from '../schema/types'

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
