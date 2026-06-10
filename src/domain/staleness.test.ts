import { describe, it, expect } from 'vitest'
import {
  STALENESS_MAX_SATELLITES,
  STALENESS_SATELLITE_START_DAY,
  daysSinceLastMove,
  daysWithoutMovement,
  stalenessSatelliteCount,
} from './staleness'

const TODAY = new Date(2026, 5, 7, 15, 0, 0) // local 2026-06-07

function isoOnLocalDay(y: number, m: number, d: number, hour = 10): string {
  return new Date(y, m - 1, d, hour, 0, 0).toISOString()
}

describe('daysSinceLastMove', () => {
  it('returns 0 when lastMovedAt is on the same local calendar day', () => {
    expect(daysSinceLastMove(isoOnLocalDay(2026, 6, 7, 9), TODAY)).toBe(0)
    expect(daysSinceLastMove(isoOnLocalDay(2026, 6, 7, 23), TODAY)).toBe(0)
  })

  it('returns 1 for yesterday', () => {
    expect(daysSinceLastMove(isoOnLocalDay(2026, 6, 6), TODAY)).toBe(1)
  })

  it('returns 5 for five local days ago', () => {
    expect(daysSinceLastMove(isoOnLocalDay(2026, 6, 2), TODAY)).toBe(5)
  })

  it('clamps future lastMovedAt to 0 days', () => {
    expect(daysSinceLastMove(isoOnLocalDay(2026, 6, 8), TODAY)).toBe(0)
  })
})

describe('stalenessSatelliteCount', () => {
  it('returns 0 when moved today', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 7), 50, TODAY)).toBe(0)
  })

  it('returns 0 when moved yesterday (grace day)', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 6), 50, TODAY)).toBe(0)
  })

  it('returns 1 on the second day without movement', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 5), 50, TODAY)).toBe(1)
  })

  it('adds one satellite per day up to the cap', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 4), 50, TODAY)).toBe(2)
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 3), 50, TODAY)).toBe(3)
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 6, 2), 50, TODAY)).toBe(4)
  })

  it('caps at STALENESS_MAX_SATELLITES', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 5, 28), 50, TODAY)).toBe(
      STALENESS_MAX_SATELLITES,
    )
  })

  it('returns 0 when done at position 100', () => {
    expect(stalenessSatelliteCount(isoOnLocalDay(2026, 5, 28), 100, TODAY)).toBe(0)
  })

  it('starts showing satellites at STALENESS_SATELLITE_START_DAY', () => {
    expect(STALENESS_SATELLITE_START_DAY).toBe(2)
  })
})

describe('daysWithoutMovement', () => {
  it('returns 0 when done at position 100', () => {
    expect(daysWithoutMovement(isoOnLocalDay(2026, 5, 28), 100, TODAY)).toBe(0)
  })

  it('returns calendar days otherwise', () => {
    expect(daysWithoutMovement(isoOnLocalDay(2026, 6, 4), 50, TODAY)).toBe(3)
  })
})
