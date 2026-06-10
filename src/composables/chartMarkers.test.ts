import { describe, it, expect } from 'vitest'
import type { Project } from '../schema/types'
import {
  activeCount,
  overviewMarkers,
  markersForProject,
  partitionMarkers,
  partitionMarkersForProjectView,
} from './chartMarkers'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj_1',
    name: 'Alpha',
    color: 'terracotta',
    position: 30,
    lastMovedAt: new Date().toISOString(),
    forces: [],
    snapshots: [],
    tasks: [],
    ...overrides,
  }
}

describe('activeCount', () => {
  it('counts only active forces in the given direction', () => {
    expect(
      activeCount(
        [
          {
            id: 'f1',
            direction: 'up',
            label: 'A',
            owner: null,
            isPrimary: false,
            status: 'active',
            createdAt: '',
            resolvedAt: null,
            resolutionReason: null,
          },
          {
            id: 'f2',
            direction: 'up',
            label: 'B',
            owner: null,
            isPrimary: false,
            status: 'resolved',
            createdAt: '',
            resolvedAt: '',
            resolutionReason: null,
          },
          {
            id: 'f3',
            direction: 'down',
            label: 'C',
            owner: null,
            isPrimary: false,
            status: 'active',
            createdAt: '',
            resolvedAt: null,
            resolutionReason: null,
          },
        ],
        'up',
      ),
    ).toBe(1)
  })
})

describe('overviewMarkers', () => {
  it('maps each project to a radius-16 marker in its palette color with active counts', () => {
    const markers = overviewMarkers([
      project({
        forces: [
          {
            id: 'f1',
            direction: 'up',
            label: 'Boost',
            owner: null,
            isPrimary: false,
            status: 'active',
            createdAt: '',
            resolvedAt: null,
            resolutionReason: null,
          },
        ],
      }),
    ])
    expect(markers).toHaveLength(1)
    expect(markers[0]).toMatchObject({
      id: 'proj_1',
      radius: 16,
      color: '#C56B4A',
      up: 1,
      down: 0,
    })
  })

  it('keeps palette color and sets staleness satellites when stale', () => {
    const oldMove = new Date()
    oldMove.setDate(oldMove.getDate() - 10)
    const markers = overviewMarkers([project({ lastMovedAt: oldMove.toISOString() })])
    expect(markers[0].color).toBe('#C56B4A')
    expect(markers[0].stalenessSatellites).toBe(4)
  })

  it('skips staleness satellites when done at position 100', () => {
    const oldMove = new Date()
    oldMove.setDate(oldMove.getDate() - 10)
    const markers = overviewMarkers([
      project({ lastMovedAt: oldMove.toISOString(), position: 100 }),
    ])
    expect(markers[0].stalenessSatellites).toBe(0)
  })

  it('includes trail ghosts from project snapshots excluding today', () => {
    const markers = overviewMarkers([
      project({
        snapshots: [
          { date: '2020-01-03', position: 50 },
          { date: '2020-01-01', position: 30 },
          { date: '2020-01-02', position: 40 },
        ],
      }),
    ])
    expect(markers[0].ghosts).toEqual([
      { position: 30, opacity: 0.1 },
      { position: 40, opacity: 0.4 },
      { position: 50, opacity: 0.7 },
    ])
  })
})

describe('markersForProject', () => {
  it('returns the project marker first (radius 22) then each task (radius 11), all in project color', () => {
    const markers = markersForProject(
      project({
        tasks: [
          {
            id: 'task_a',
            name: 'Task A',
            position: 40,
            lastMovedAt: new Date().toISOString(),
            forces: [
              {
                id: 'f1',
                direction: 'down',
                label: 'Block',
                owner: null,
                isPrimary: false,
                status: 'active',
                createdAt: '',
                resolvedAt: null,
                resolutionReason: null,
              },
            ],
            snapshots: [],
          },
        ],
      }),
    )
    expect(markers).toHaveLength(2)
    expect(markers[0]).toMatchObject({
      id: 'proj_1',
      radius: 22,
      color: '#C56B4A',
      up: 0,
      down: 0,
    })
    expect(markers[1]).toMatchObject({
      id: 'task_a',
      radius: 11,
      color: '#C56B4A',
      up: 0,
      down: 1,
    })
  })

  it('returns just the project marker when there are no tasks', () => {
    const markers = markersForProject(project({ tasks: [] }))
    expect(markers).toHaveLength(1)
    expect(markers[0].radius).toBe(22)
  })

  it('includes trail ghosts on task markers in project view', () => {
    const markers = markersForProject(
      project({
        tasks: [
          {
            id: 'task_a',
            name: 'Task A',
            position: 40,
            lastMovedAt: new Date().toISOString(),
            forces: [],
            snapshots: [{ date: '2020-01-01', position: 22 }],
          },
        ],
      }),
    )
    expect(markers[1].ghosts).toEqual([{ position: 22, opacity: 0.7 }])
  })
})

describe('partitionMarkers', () => {
  it('keeps active markers on the curve and moves done to stack', () => {
    const markers = overviewMarkers([
      project({ id: 'a', name: 'Active', position: 50 }),
      project({ id: 'b', name: 'Done', position: 100 }),
    ])
    const { active, done } = partitionMarkers(markers)
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('a')
    expect(done).toHaveLength(1)
    expect(done[0].id).toBe('b')
  })

  it('sorts done markers by name ascending', () => {
    const markers = overviewMarkers([
      project({ id: 'z', name: 'Zulu', position: 100 }),
      project({ id: 'a', name: 'Alpha', position: 100 }),
    ])
    const { done } = partitionMarkers(markers)
    expect(done.map((m) => m.name)).toEqual(['Alpha', 'Zulu'])
  })

  it('returns empty done when none at 100', () => {
    const { active, done } = partitionMarkers(overviewMarkers([project()]))
    expect(active).toHaveLength(1)
    expect(done).toHaveLength(0)
  })
})

describe('partitionMarkersForProjectView', () => {
  it('keeps the project dot on the hill at 100 and stacks done tasks', () => {
    const markers = markersForProject(
      project({
        position: 100,
        tasks: [
          {
            id: 'task_a',
            name: 'Task A',
            position: 100,
            lastMovedAt: new Date().toISOString(),
            forces: [],
            snapshots: [],
          },
          {
            id: 'task_b',
            name: 'Task B',
            position: 40,
            lastMovedAt: new Date().toISOString(),
            forces: [],
            snapshots: [],
          },
        ],
      }),
    )
    const { active, done } = partitionMarkersForProjectView(markers, 'proj_1')
    expect(active.map((m) => m.id).sort()).toEqual(['proj_1', 'task_b'])
    expect(active.find((m) => m.id === 'proj_1')?.radius).toBe(22)
    expect(done.map((m) => m.id)).toEqual(['task_a'])
  })

  it('matches partitionMarkers when the project is not done', () => {
    const markers = markersForProject(
      project({
        position: 50,
        tasks: [
          {
            id: 'task_a',
            name: 'Task A',
            position: 100,
            lastMovedAt: new Date().toISOString(),
            forces: [],
            snapshots: [],
          },
        ],
      }),
    )
    expect(partitionMarkersForProjectView(markers, 'proj_1')).toEqual(partitionMarkers(markers))
  })
})
