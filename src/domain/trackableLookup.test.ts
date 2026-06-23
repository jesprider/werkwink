import { describe, it, expect } from 'vitest'
import type { Force, Project } from '../schema/types'
import { findTrackableInProjects, lookupInProject, forcesByStatus } from './trackableLookup'

const project: Project = {
  id: 'proj_1',
  name: 'Alpha',
  color: 'terracotta',
  position: 30,
  lastMovedAt: '2026-05-01T10:00:00Z',
  forces: [
    {
      id: 'f_up',
      direction: 'up',
      label: 'Boost',
      owner: null,
      isPrimary: false,
      status: 'active',
      createdAt: '2026-05-10T10:00:00Z',
      resolvedAt: null,
      resolutionReason: null,
    },
    {
      id: 'f_past',
      direction: 'up',
      label: 'Old boost',
      owner: null,
      isPrimary: false,
      status: 'resolved',
      createdAt: '2026-05-01T10:00:00Z',
      resolvedAt: '2026-05-20T10:00:00Z',
      resolutionReason: null,
    },
  ],
  snapshots: [],
  dailyNoteDraft: '',
  notes: [],
  tasks: [
    {
      id: 'task_1',
      name: 'Task one',
      position: 10,
      lastMovedAt: '2026-05-01T10:00:00Z',
      forces: [],
      snapshots: [],
      dailyNoteDraft: '',
      notes: [],
    },
  ],
}

describe('findTrackableInProjects', () => {
  it('finds a project by id', () => {
    expect(findTrackableInProjects([project], 'proj_1')?.name).toBe('Alpha')
  })

  it('finds a nested task by id', () => {
    expect(findTrackableInProjects([project], 'task_1')?.name).toBe('Task one')
  })

  it('returns undefined for an unknown id', () => {
    expect(findTrackableInProjects([project], 'missing')).toBeUndefined()
  })
})

describe('lookupInProject', () => {
  it('finds the project trackable', () => {
    const result = lookupInProject(project, 'proj_1')
    expect(result?.kind).toBe('project')
    expect(result?.trackable.name).toBe('Alpha')
  })

  it('finds a task trackable', () => {
    const result = lookupInProject(project, 'task_1')
    expect(result?.kind).toBe('task')
    expect(result?.trackable.name).toBe('Task one')
  })

  it('returns null for an unknown id', () => {
    expect(lookupInProject(project, 'missing')).toBeNull()
  })
})

describe('forcesByStatus', () => {
  it('returns active up forces newest first', () => {
    const forces = forcesByStatus(project.forces, 'up', 'active')
    expect(forces).toHaveLength(1)
    expect(forces[0].id).toBe('f_up')
  })

  it('returns resolved forces sorted by resolvedAt desc', () => {
    const forces = forcesByStatus(project.forces, 'up', 'resolved')
    expect(forces).toHaveLength(1)
    expect(forces[0].id).toBe('f_past')
  })

  it('pins primary active up force first, then newest non-primary', () => {
    const forces: Force[] = [
      {
        id: 'f_primary',
        direction: 'up',
        label: 'Owner',
        owner: 'Alex',
        isPrimary: true,
        status: 'active',
        createdAt: '2026-05-01T10:00:00Z',
        resolvedAt: null,
        resolutionReason: null,
      },
      {
        id: 'f_newer',
        direction: 'up',
        label: 'Boost',
        owner: null,
        isPrimary: false,
        status: 'active',
        createdAt: '2026-06-01T10:00:00Z',
        resolvedAt: null,
        resolutionReason: null,
      },
      {
        id: 'f_older',
        direction: 'up',
        label: 'Earlier boost',
        owner: null,
        isPrimary: false,
        status: 'active',
        createdAt: '2026-05-15T10:00:00Z',
        resolvedAt: null,
        resolutionReason: null,
      },
    ]
    const result = forcesByStatus(forces, 'up', 'active')
    expect(result.map((f) => f.id)).toEqual(['f_primary', 'f_newer', 'f_older'])
  })
})
