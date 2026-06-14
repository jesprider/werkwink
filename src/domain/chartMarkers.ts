import type { HillTrackable, Project } from '../schema/types'
import { PALETTE } from '../schema/palette'
import { localDateString } from '../lib/localDate'
import { activeForceCount } from './forceRules'
import { trailGhosts, type TrailGhost } from './trailGhosts'
import { stalenessSatelliteCount, DONE_POSITION } from './staleness'

export type { TrailGhost }

export interface ChartMarker {
  id: string
  position: number
  color: string
  radius: number
  name: string
  up: number
  down: number
  stalenessSatellites: number
  ghosts: TrailGhost[]
}

const OVERVIEW_RADIUS = 16
const PROJECT_RADIUS = 22
const TASK_RADIUS = 11

function buildChartMarker(
  trackable: HillTrackable,
  color: string,
  radius: number,
  today: string,
): ChartMarker {
  return {
    id: trackable.id,
    position: trackable.position,
    color,
    radius,
    name: trackable.name,
    up: activeForceCount(trackable.forces, 'up'),
    down: activeForceCount(trackable.forces, 'down'),
    stalenessSatellites: stalenessSatelliteCount(trackable.lastMovedAt, trackable.position),
    ghosts: trailGhosts(trackable.snapshots, today),
  }
}

export function overviewMarkers(projects: Project[]): ChartMarker[] {
  const today = localDateString()
  return projects.map((p) => buildChartMarker(p, PALETTE[p.color], OVERVIEW_RADIUS, today))
}

export function markersForProject(project: Project): ChartMarker[] {
  const today = localDateString()
  const color = PALETTE[project.color]
  const projectMarker = buildChartMarker(project, color, PROJECT_RADIUS, today)
  const taskMarkers = project.tasks.map((t) => buildChartMarker(t, color, TASK_RADIUS, today))
  return [projectMarker, ...taskMarkers]
}

export function partitionMarkers(markers: ChartMarker[]): {
  active: ChartMarker[]
  done: ChartMarker[]
} {
  const active: ChartMarker[] = []
  const done: ChartMarker[] = []
  for (const m of markers) {
    if (m.position === DONE_POSITION) done.push(m)
    else active.push(m)
  }
  done.sort((a, b) => a.name.localeCompare(b.name))
  return { active, done }
}

/** Project view: done tasks stack; the project dot stays on the hill even at 100. */
export function partitionMarkersForProjectView(
  markers: ChartMarker[],
  projectId: string,
): { active: ChartMarker[]; done: ChartMarker[] } {
  const { active, done } = partitionMarkers(markers)
  const projectMarker = markers.find((m) => m.id === projectId)
  if (!projectMarker || projectMarker.position !== DONE_POSITION) {
    return { active, done }
  }
  return {
    active: [...active, projectMarker],
    done: done.filter((m) => m.id !== projectId),
  }
}
