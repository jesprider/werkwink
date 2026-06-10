import { PALETTE_ORDER } from './palette'
import type {
  Force,
  ForceDirection,
  ForceStatus,
  HillChartState,
  Project,
  ProjectColor,
  Snapshot,
  Source,
  Task,
} from './types'

export type ValidateResult = { ok: true; state: HillChartState } | { ok: false; errors: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isIsoDateString(value: string): boolean {
  return !Number.isNaN(Date.parse(value))
}

function pushError(errors: string[], path: string, message: string) {
  errors.push(`${path}: ${message}`)
}

function requireString(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
): string | null {
  const value = obj[key]
  if (typeof value !== 'string' || value.trim() === '') {
    pushError(errors, path, `${key} must be a non-empty string`)
    return null
  }
  return value
}

function requireInteger(
  obj: Record<string, unknown>,
  key: string,
  path: string,
  errors: string[],
  min: number,
  max: number,
): number | null {
  const value = obj[key]
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    pushError(errors, path, `${key} must be an integer`)
    return null
  }
  if (value < min || value > max) {
    pushError(errors, path, `${key} must be between ${min} and ${max}`)
    return null
  }
  return value
}

function parseSource(raw: unknown, path: string, errors: string[]): Source | undefined {
  if (raw === undefined) return undefined
  if (!isRecord(raw)) {
    pushError(errors, path, 'source must be an object')
    return undefined
  }
  const source: Source = {}
  for (const key of ['system', 'id', 'url'] as const) {
    const value = raw[key]
    if (value === undefined) continue
    if (typeof value !== 'string') {
      pushError(errors, `${path}.${key}`, 'must be a string')
      continue
    }
    source[key] = value
  }
  return Object.keys(source).length > 0 ? source : undefined
}

function parseSnapshot(raw: unknown, path: string, errors: string[]): Snapshot | null {
  if (!isRecord(raw)) {
    pushError(errors, path, 'must be an object')
    return null
  }
  const date = requireString(raw, 'date', path, errors)
  const position = requireInteger(raw, 'position', path, errors, 0, 100)
  if (date === null || position === null) return null
  if (!isIsoDateString(date)) {
    pushError(errors, path, 'date must be a valid date string')
    return null
  }
  return { date, position }
}

function countPrimaryActiveUp(forces: Force[]): number {
  return forces.filter((f) => f.isPrimary && f.direction === 'up' && f.status === 'active').length
}

function parseForce(raw: unknown, path: string, errors: string[]): Force | null {
  if (!isRecord(raw)) {
    pushError(errors, path, 'must be an object')
    return null
  }

  const id = requireString(raw, 'id', path, errors)
  const label = requireString(raw, 'label', path, errors)
  const direction = raw.direction
  const status = raw.status
  const createdAt = requireString(raw, 'createdAt', path, errors)

  if (direction !== 'up' && direction !== 'down') {
    pushError(errors, path, 'direction must be "up" or "down"')
  }
  if (status !== 'active' && status !== 'resolved') {
    pushError(errors, path, 'status must be "active" or "resolved"')
  }

  if (typeof raw.isPrimary !== 'boolean') {
    pushError(errors, path, 'isPrimary must be a boolean')
  }

  const ownerRaw = raw.owner
  if (ownerRaw !== null && ownerRaw !== undefined && typeof ownerRaw !== 'string') {
    pushError(errors, path, 'owner must be null or a string')
  }
  const ownerOut = typeof ownerRaw === 'string' ? ownerRaw : null

  const resolvedAt = raw.resolvedAt
  if (resolvedAt !== null && resolvedAt !== undefined && typeof resolvedAt !== 'string') {
    pushError(errors, path, 'resolvedAt must be null or a string')
  }

  const resolutionReason = raw.resolutionReason
  if (
    resolutionReason !== null &&
    resolutionReason !== undefined &&
    typeof resolutionReason !== 'string'
  ) {
    pushError(errors, path, 'resolutionReason must be null or a string')
  }

  if (
    id === null ||
    label === null ||
    createdAt === null ||
    (direction !== 'up' && direction !== 'down') ||
    (status !== 'active' && status !== 'resolved') ||
    typeof raw.isPrimary !== 'boolean'
  ) {
    return null
  }

  if (!isIsoDateString(createdAt)) {
    pushError(errors, path, 'createdAt must be a valid date string')
    return null
  }

  const resolvedAtOut =
    typeof resolvedAt === 'string' ? resolvedAt : resolvedAt === null ? null : undefined
  const resolutionReasonOut =
    typeof resolutionReason === 'string'
      ? resolutionReason
      : resolutionReason === null
        ? null
        : undefined

  if (status === 'resolved') {
    if (resolvedAtOut === null || resolvedAtOut === undefined) {
      pushError(errors, path, 'resolved forces require resolvedAt')
    } else if (!isIsoDateString(resolvedAtOut)) {
      pushError(errors, path, 'resolvedAt must be a valid date string')
    }
  }

  if (status === 'active' && resolvedAtOut != null) {
    pushError(errors, path, 'active forces must have resolvedAt null')
  }

  if (resolvedAtOut === undefined || resolutionReasonOut === undefined) {
    return null
  }

  return {
    id,
    label,
    direction: direction as ForceDirection,
    owner: ownerOut,
    isPrimary: raw.isPrimary,
    status: status as ForceStatus,
    createdAt,
    resolvedAt: resolvedAtOut,
    resolutionReason: resolutionReasonOut,
  }
}

function parseForces(raw: unknown, path: string, errors: string[]): Force[] {
  if (!Array.isArray(raw)) {
    pushError(errors, path, 'forces must be an array')
    return []
  }
  const forces: Force[] = []
  raw.forEach((item, index) => {
    const force = parseForce(item, `${path}[${index}]`, errors)
    if (force) forces.push(force)
  })
  const primaryCount = countPrimaryActiveUp(forces)
  if (primaryCount !== 1) {
    pushError(errors, path, `expected exactly one active primary up force, found ${primaryCount}`)
  }
  return forces
}

function parseSnapshots(raw: unknown, path: string, errors: string[]): Snapshot[] {
  if (!Array.isArray(raw)) {
    pushError(errors, path, 'snapshots must be an array')
    return []
  }
  const snapshots: Snapshot[] = []
  raw.forEach((item, index) => {
    const snapshot = parseSnapshot(item, `${path}[${index}]`, errors)
    if (snapshot) snapshots.push(snapshot)
  })
  return snapshots
}

function parseTask(raw: unknown, path: string, errors: string[]): Task | null {
  if (!isRecord(raw)) {
    pushError(errors, path, 'must be an object')
    return null
  }

  const id = requireString(raw, 'id', path, errors)
  const name = requireString(raw, 'name', path, errors)
  const position = requireInteger(raw, 'position', path, errors, 0, 100)
  const lastMovedAt = requireString(raw, 'lastMovedAt', path, errors)

  if (id === null || name === null || position === null || lastMovedAt === null) {
    return null
  }

  if (!isIsoDateString(lastMovedAt)) {
    pushError(errors, path, 'lastMovedAt must be a valid date string')
    return null
  }

  const source = parseSource(raw.source, `${path}.source`, errors)
  const forces = parseForces(raw.forces, `${path}.forces`, errors)
  const snapshots = parseSnapshots(raw.snapshots, `${path}.snapshots`, errors)

  return { id, name, position, lastMovedAt, forces, snapshots, ...(source ? { source } : {}) }
}

function parseProject(raw: unknown, path: string, errors: string[]): Project | null {
  if (!isRecord(raw)) {
    pushError(errors, path, 'must be an object')
    return null
  }

  const id = requireString(raw, 'id', path, errors)
  const name = requireString(raw, 'name', path, errors)
  const position = requireInteger(raw, 'position', path, errors, 0, 100)
  const lastMovedAt = requireString(raw, 'lastMovedAt', path, errors)
  const colorRaw = raw.color

  if (id === null || name === null || position === null || lastMovedAt === null) {
    return null
  }

  if (typeof colorRaw !== 'string' || !PALETTE_ORDER.includes(colorRaw as ProjectColor)) {
    pushError(errors, path, 'color must be a known project color')
    return null
  }

  if (!isIsoDateString(lastMovedAt)) {
    pushError(errors, path, 'lastMovedAt must be a valid date string')
    return null
  }

  const source = parseSource(raw.source, `${path}.source`, errors)
  const forces = parseForces(raw.forces, `${path}.forces`, errors)
  const snapshots = parseSnapshots(raw.snapshots, `${path}.snapshots`, errors)

  let tasks: Task[] = []
  if (raw.tasks === undefined) {
    tasks = []
  } else if (!Array.isArray(raw.tasks)) {
    pushError(errors, `${path}.tasks`, 'must be an array')
  } else {
    raw.tasks.forEach((item, index) => {
      const task = parseTask(item, `${path}.tasks[${index}]`, errors)
      if (task) tasks.push(task)
    })
  }

  return {
    id,
    name,
    color: colorRaw as ProjectColor,
    position,
    lastMovedAt,
    forces,
    snapshots,
    tasks,
    ...(source ? { source } : {}),
  }
}

function validateUniqueIds(projects: Project[], errors: string[]) {
  const seen = new Set<string>()
  for (const project of projects) {
    if (seen.has(project.id)) {
      pushError(errors, 'projects', `duplicate id "${project.id}"`)
    }
    seen.add(project.id)
    for (const task of project.tasks) {
      if (seen.has(task.id)) {
        pushError(errors, 'projects', `duplicate id "${task.id}"`)
      }
      seen.add(task.id)
    }
  }
}

export function validateHillChartObject(data: unknown): ValidateResult {
  const errors: string[] = []

  if (!isRecord(data)) {
    return { ok: false, errors: ['Root must be a JSON object'] }
  }

  if (data.version !== 1) {
    pushError(errors, 'version', 'must be 1')
  }

  let exportedAt: string | null = null
  if (data.exportedAt === undefined || data.exportedAt === null) {
    exportedAt = null
  } else if (typeof data.exportedAt === 'string') {
    exportedAt = data.exportedAt
  } else {
    pushError(errors, 'exportedAt', 'must be null or a string')
  }

  let demo = false
  if (data.demo !== undefined && typeof data.demo !== 'boolean') {
    pushError(errors, 'demo', 'must be a boolean')
  } else if (typeof data.demo === 'boolean') {
    demo = data.demo
  }

  let lastDailyDate: string | null = null
  if (data.lastDailyDate === undefined || data.lastDailyDate === null) {
    lastDailyDate = null
  } else if (typeof data.lastDailyDate === 'string') {
    if (!isIsoDateString(data.lastDailyDate)) {
      pushError(errors, 'lastDailyDate', 'must be a valid date string')
    } else {
      lastDailyDate = data.lastDailyDate
    }
  } else {
    pushError(errors, 'lastDailyDate', 'must be null or a string')
  }

  let projects: Project[] = []
  if (data.projects === undefined) {
    projects = []
  } else if (!Array.isArray(data.projects)) {
    pushError(errors, 'projects', 'must be an array')
  } else {
    data.projects.forEach((item, index) => {
      const project = parseProject(item, `projects[${index}]`, errors)
      if (project) projects.push(project)
    })
  }

  if (errors.length === 0) {
    validateUniqueIds(projects, errors)
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    state: {
      version: 1,
      exportedAt,
      demo,
      lastDailyDate,
      projects,
    },
  }
}

export function validateHillChartJson(raw: string): ValidateResult {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, errors: [`Invalid JSON: ${msg}`] }
  }
  return validateHillChartObject(data)
}
