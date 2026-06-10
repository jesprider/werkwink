import { describe, it, expect, vi, afterEach } from 'vitest'
import type { Force, HillTrackable } from '../schema/types'
import {
  BLOCKER_SNAP_POSITION,
  PEAK_POSITION,
  canCrossPeak,
  hasActiveDownForces,
  isPeakCrossingBlocked,
  snapIfDownhillWithBlockers,
} from './forceRules'

function trackable(overrides: Partial<HillTrackable> = {}): HillTrackable {
  return {
    id: 't_1',
    name: 'Test',
    position: 40,
    lastMovedAt: '2026-05-01T10:00:00Z',
    forces: [],
    snapshots: [],
    ...overrides,
  }
}

function downForce(status: Force['status'] = 'active'): Force {
  return {
    id: 'f_down',
    direction: 'down',
    label: 'Blocker',
    owner: null,
    isPrimary: false,
    status,
    createdAt: '2026-05-01T10:00:00Z',
    resolvedAt: status === 'resolved' ? '2026-05-02T10:00:00Z' : null,
    resolutionReason: null,
  }
}

describe('hasActiveDownForces', () => {
  it('is false with no forces', () => {
    expect(hasActiveDownForces([])).toBe(false)
  })

  it('is true with an active down force', () => {
    expect(hasActiveDownForces([downForce('active')])).toBe(true)
  })

  it('is false when down forces are resolved', () => {
    expect(hasActiveDownForces([downForce('resolved')])).toBe(false)
  })
})

describe('snapIfDownhillWithBlockers', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('snaps to 45 when downhill with active downs', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T12:00:00Z'))

    const t = trackable({ position: 70, forces: [downForce()] })
    snapIfDownhillWithBlockers(t)

    expect(t.position).toBe(BLOCKER_SNAP_POSITION)
    expect(t.lastMovedAt).toBe('2026-06-03T12:00:00.000Z')
  })

  it('does not snap when uphill with active downs', () => {
    const t = trackable({ position: 40, forces: [downForce()] })
    snapIfDownhillWithBlockers(t)
    expect(t.position).toBe(40)
  })

  it('does not snap when downhill without active downs', () => {
    const t = trackable({ position: 70, forces: [downForce('resolved')] })
    snapIfDownhillWithBlockers(t)
    expect(t.position).toBe(70)
  })
})

describe('canCrossPeak', () => {
  it('blocks crossing right past peak with active downs', () => {
    expect(canCrossPeak([downForce()], 55, 48)).toBe(false)
  })

  it('allows crossing when no active downs', () => {
    expect(canCrossPeak([], 55, 48)).toBe(true)
  })

  it('allows moves that stay on the uphill', () => {
    expect(canCrossPeak([downForce()], 45, 40)).toBe(true)
  })

  it('allows moves already on the downhill', () => {
    expect(canCrossPeak([downForce()], 80, 60)).toBe(true)
  })

  it('allows landing exactly on the peak', () => {
    expect(canCrossPeak([downForce()], PEAK_POSITION, 48)).toBe(true)
  })
})

describe('isPeakCrossingBlocked', () => {
  it('is true when crossing past peak with active downs', () => {
    expect(isPeakCrossingBlocked([downForce()], 55, 48)).toBe(true)
  })

  it('is false when move stays uphill', () => {
    expect(isPeakCrossingBlocked([downForce()], 45, 40)).toBe(false)
  })

  it('is false when already downhill', () => {
    expect(isPeakCrossingBlocked([downForce()], 80, 60)).toBe(false)
  })
})
