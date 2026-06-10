import type { Force, HillTrackable } from '../schema/types'

export const PEAK_POSITION = 50
export const BLOCKER_SNAP_POSITION = 45

export const PEAK_CROSSING_BLOCKED_MESSAGE =
  'Active blockers must be resolved before moving downhill.'

export function hasActiveDownForces(forces: Force[]): boolean {
  return forces.some((f) => f.direction === 'down' && f.status === 'active')
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
