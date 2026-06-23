import type { HillTrackable, Project } from '../schema/types'
import { PALETTE } from '../schema/palette'
import { localDateString } from '../lib/localDate'
import { curveX, curveY, estimateLabelWidth } from '../lib/hillCurve'
import { computeLabelLayout, type LabelBox, type LabelSide } from '../lib/labelLayout'
import { activeForceCount } from './forceRules'
import { trailGhosts, type TrailGhost } from './trailGhosts'
import { stalenessSatelliteCount, DONE_POSITION } from './staleness'

export type { TrailGhost }
export type { LabelSide }

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
const PROJECT_RADIUS = 16
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

/** Placements tried in order; first one that clears all collisions wins. */
const LABEL_SIDE_PRIORITY: LabelSide[] = ['below', 'above', 'right', 'left']

function rectsOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * De-collide labels: scan markers left → right and, for each, pick the first
 * placement (below → above → right → left) whose box clears every label already
 * placed and every other dot. Falls back to below when nothing fits.
 */
export function labelSides(markers: ChartMarker[]): Map<string, LabelSide> {
  const sides = new Map<string, LabelSide>()
  const ordered = [...markers].sort((a, b) => a.position - b.position)
  const dotBoxes: LabelBox[] = ordered.map((m) => {
    const cx = curveX(m.position)
    const cy = curveY(m.position)
    return { x: cx - m.radius, y: cy - m.radius, width: m.radius * 2, height: m.radius * 2 }
  })
  const placed: LabelBox[] = []

  ordered.forEach((m, i) => {
    const cx = curveX(m.position)
    const cy = curveY(m.position)
    const width = estimateLabelWidth(m.name, `↑${m.up} ↓${m.down}`)

    let chosen: LabelSide | null = null
    for (const side of LABEL_SIDE_PRIORITY) {
      const box = computeLabelLayout(cx, cy, m.radius, width, side).bg
      const hitsLabel = placed.some((b) => rectsOverlap(box, b))
      const hitsDot = dotBoxes.some((d, di) => di !== i && rectsOverlap(box, d))
      if (!hitsLabel && !hitsDot) {
        chosen = side
        placed.push(box)
        break
      }
    }
    if (chosen === null) {
      chosen = 'below'
      placed.push(computeLabelLayout(cx, cy, m.radius, width, 'below').bg)
    }
    sides.set(m.id, chosen)
  })

  return sides
}

export function markersInPaintOrder(
  markers: ChartMarker[],
  foregroundId: string | null,
): ChartMarker[] {
  if (!foregroundId) return markers
  const index = markers.findIndex((m) => m.id === foregroundId)
  if (index === -1) return markers
  const foreground = markers[index]!
  const others = markers.filter((m) => m.id !== foregroundId)
  return [...others, foreground]
}
