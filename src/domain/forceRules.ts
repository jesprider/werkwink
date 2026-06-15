import type { Force, ForceDirection, HillTrackable } from '../schema/types'

export const PEAK_POSITION = 50
export const BLOCKER_SNAP_POSITION = 45

export const PEAK_CROSSING_BLOCKED_MESSAGE = 'Resolve active down forces before moving downhill.'

export function activeForceCount(forces: Force[], direction: ForceDirection): number {
  return forces.filter((f) => f.direction === direction && f.status === 'active').length
}

export function hasActiveDownForces(forces: Force[]): boolean {
  return activeForceCount(forces, 'down') > 0
}

export function snapIfDownhillWithBlockers(trackable: HillTrackable): void {
  if (trackable.position > PEAK_POSITION && hasActiveDownForces(trackable.forces)) {
    trackable.position = BLOCKER_SNAP_POSITION
    trackable.lastMovedAt = new Date().toISOString()
  }
}

export function canCrossPeak(
  forces: Force[],
  newPosition: number,
  currentPosition: number,
): boolean {
  const crossingRightPastPeak = newPosition > PEAK_POSITION && currentPosition <= PEAK_POSITION
  if (crossingRightPastPeak && hasActiveDownForces(forces)) {
    return false
  }
  return true
}

/** True when a move would be clamped at the peak due to active down forces. */
export function isPeakCrossingBlocked(
  forces: Force[],
  requestedPosition: number,
  currentPosition: number,
): boolean {
  return !canCrossPeak(forces, requestedPosition, currentPosition)
}
