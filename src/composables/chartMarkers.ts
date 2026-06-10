import type { Force, ForceDirection, Project } from '../schema/types'
import { PALETTE } from '../schema/palette'
import { localDateString } from '../lib/localDate'
import { trailGhosts, type TrailGhost } from '../domain/trailGhosts'
import { stalenessSatelliteCount, DONE_POSITION } from '../domain/staleness'

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

export function activeCount(forces: Force[], direction: ForceDirection): number {
  return forces.filter((f) => f.direction === direction && f.status === 'active').length
}

export function overviewMarkers(projects: Project[]): ChartMarker[] {
  const today = localDateString()
  return projects.map((p) => ({
    id: p.id,
    position: p.position,
    color: PALETTE[p.color],
    radius: OVERVIEW_RADIUS,
    name: p.name,
    up: activeCount(p.forces, 'up'),
    down: activeCount(p.forces, 'down'),
    stalenessSatellites: stalenessSatelliteCount(p.lastMovedAt, p.position),
    ghosts: trailGhosts(p.snapshots, today),
  }))
}

export function markersForProject(project: Project): ChartMarker[] {
  const today = localDateString()
  const color = PALETTE[project.color]
  const projectMarker: ChartMarker = {
    id: project.id,
    position: project.position,
    color,
    radius: PROJECT_RADIUS,
    name: project.name,
    up: activeCount(project.forces, 'up'),
    down: activeCount(project.forces, 'down'),
    stalenessSatellites: stalenessSatelliteCount(project.lastMovedAt, project.position),
    ghosts: trailGhosts(project.snapshots, today),
  }
  const taskMarkers: ChartMarker[] = project.tasks.map((t) => ({
    id: t.id,
    position: t.position,
    color,
    radius: TASK_RADIUS,
    name: t.name,
    up: activeCount(t.forces, 'up'),
    down: activeCount(t.forces, 'down'),
    stalenessSatellites: stalenessSatelliteCount(t.lastMovedAt, t.position),
    ghosts: trailGhosts(t.snapshots, today),
  }))
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
