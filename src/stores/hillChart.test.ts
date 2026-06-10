import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { BLOCKER_SNAP_POSITION } from '../domain/forceRules'
import { localDateString } from '../lib/localDate'
import { PALETTE_ORDER } from '../schema/palette'
import { MINIMAL_IMPORT_JSON } from '../schema/testFixtures'
import { validateHillChartJson } from '../schema/validate'
import { useHillChartStore } from './hillChart'

describe('hillChart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('seeds from the sample data', () => {
    const store = useHillChartStore()
    expect(store.projects.length).toBe(5)
    expect(store.projects[0].id).toBe('proj_1')
    expect(store.demo).toBe(true)
  })

  describe('addProject', () => {
    it('appends a project with defaults and returns its id', () => {
      const store = useHillChartStore()
      const before = store.projects.length

      const id = store.addProject()

      expect(store.projects.length).toBe(before + 1)
      const created = store.projects.find((p) => p.id === id)
      expect(created).toBeDefined()
      expect(id).toMatch(/^proj_/)
      expect(created!.name).toBe('New project')
      expect(created!.position).toBe(0)
      expect(created!.tasks).toEqual([])
      expect(created!.snapshots).toEqual([])
      expect(created!.source).toBeUndefined()
      expect(Date.now() - new Date(created!.lastMovedAt).getTime()).toBeLessThan(5000)
    })

    it('assigns color from PALETTE_ORDER by index before push', () => {
      const store = useHillChartStore()
      const index = store.projects.length

      store.addProject()

      const created = store.projects[store.projects.length - 1]
      expect(created.color).toBe(PALETTE_ORDER[index % PALETTE_ORDER.length])
    })

    it('creates exactly one primary Owner up force', () => {
      const store = useHillChartStore()

      store.addProject()

      const created = store.projects[store.projects.length - 1]
      expect(created.forces).toHaveLength(1)
      const owner = created.forces[0]
      expect(owner.direction).toBe('up')
      expect(owner.label).toBe('Owner')
      expect(owner.owner).toBeNull()
      expect(owner.isPrimary).toBe(true)
      expect(owner.status).toBe('active')
      expect(owner.id).toMatch(/^f_/)
      expect(owner.resolvedAt).toBeNull()
    })

    it('wraps color after eight projects', () => {
      const store = useHillChartStore()
      store.projects = []

      for (let i = 0; i < 9; i++) {
        store.addProject()
      }

      expect(store.projects[0].color).toBe('terracotta')
      expect(store.projects[8].color).toBe('terracotta')
    })
  })

  describe('addTask', () => {
    it('appends a task with defaults and returns its id', () => {
      const store = useHillChartStore()
      const project = store.projects[0]
      const before = project.tasks.length

      const id = store.addTask(project.id)

      expect(id).toMatch(/^task_/)
      expect(project.tasks.length).toBe(before + 1)
      const created = project.tasks.find((t) => t.id === id)
      expect(created).toBeDefined()
      expect(created!.name).toBe('New task')
      expect(created!.position).toBe(0)
      expect(created!.snapshots).toEqual([])
      expect(created!.source).toBeUndefined()
      expect(Date.now() - new Date(created!.lastMovedAt).getTime()).toBeLessThan(5000)
    })

    it('creates exactly one primary Owner up force', () => {
      const store = useHillChartStore()
      const project = store.projects[0]

      store.addTask(project.id)

      const created = project.tasks[project.tasks.length - 1]
      expect(created.forces).toHaveLength(1)
      const owner = created.forces[0]
      expect(owner.direction).toBe('up')
      expect(owner.label).toBe('Owner')
      expect(owner.owner).toBe('Alex')
      expect(owner.isPrimary).toBe(true)
      expect(owner.status).toBe('active')
      expect(owner.id).toMatch(/^f_/)
      expect(owner.resolvedAt).toBeNull()
    })

    it('inherits null when project Owner has no owner', () => {
      const store = useHillChartStore()
      const projectId = store.addProject()
      const project = store.projects.find((p) => p.id === projectId)!

      store.addTask(projectId)

      expect(project.tasks[0].forces[0].owner).toBeNull()
    })

    it('returns empty string for unknown projectId', () => {
      const store = useHillChartStore()
      const counts = store.projects.map((p) => p.tasks.length)

      const id = store.addTask('nope')

      expect(id).toBe('')
      store.projects.forEach((p, i) => {
        expect(p.tasks.length).toBe(counts[i])
      })
    })
  })

  it('setPosition updates a project position and lastMovedAt', () => {
    const store = useHillChartStore()
    const before = store.projects[2].lastMovedAt
    store.setPosition('proj_3', 55)
    expect(store.projects[2].position).toBe(55)
    expect(store.projects[2].lastMovedAt).not.toBe(before)
    expect(Date.now() - new Date(store.projects[2].lastMovedAt).getTime()).toBeLessThan(5000)
  })

  it('setPosition rounds and clamps to 0..100', () => {
    const store = useHillChartStore()
    store.setPosition('proj_1', 23.7)
    expect(store.projects[0].position).toBe(24)
    store.setPosition('proj_3', 150)
    expect(store.projects[2].position).toBe(100)
    store.setPosition('proj_3', -5)
    expect(store.projects[2].position).toBe(0)
  })

  it('setPosition is a no-op for an unknown id', () => {
    const store = useHillChartStore()
    expect(() => store.setPosition('nope', 10)).not.toThrow()
  })

  describe('setPosition peak clamp', () => {
    it('clamps crossing past peak when active downs exist', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 40)
      store.setPosition('proj_1', 55)
      expect(store.projects[0].position).toBe(50)
    })

    it('allows landing exactly on peak with active downs', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 48)
      store.setPosition('proj_1', 50)
      expect(store.projects[0].position).toBe(50)
    })

    it('allows crossing when no active downs', () => {
      const store = useHillChartStore()
      store.setPosition('proj_3', 40)
      store.setPosition('proj_3', 55)
      expect(store.projects[2].position).toBe(55)
    })

    it('allows moves while already downhill with active downs', () => {
      const store = useHillChartStore()
      store.projects[0].position = 60
      store.setPosition('proj_1', 80)
      expect(store.projects[0].position).toBe(80)
    })

    it('does not bump lastMovedAt when clamped at unchanged position', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 50)
      const before = store.projects[0].lastMovedAt
      store.setPosition('proj_1', 55)
      expect(store.projects[0].position).toBe(50)
      expect(store.projects[0].lastMovedAt).toBe(before)
    })

    it('allows cross after resolving all downs', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 50)
      const downs = store.projects[0].forces.filter(
        (f) => f.direction === 'down' && f.status === 'active',
      )
      for (const f of downs) {
        store.resolveForce('proj_1', f.id)
      }
      store.setPosition('proj_1', 55)
      expect(store.projects[0].position).toBe(55)
    })
  })

  describe('setPosition project done guard', () => {
    it('clamps project to 99 when any task is not done', () => {
      const store = useHillChartStore()
      const proj = store.projects.find((p) => p.id === 'proj_2')!
      const taskId = proj.tasks[0].id
      store.setPosition(taskId, 50)
      store.setPosition(proj.id, 100)
      expect(proj.position).toBe(99)
    })

    it('allows project at 100 when all tasks are done', () => {
      const store = useHillChartStore()
      const proj = store.projects.find((p) => p.id === 'proj_2')!
      for (const t of proj.tasks) {
        store.setPosition(t.id, 100)
      }
      store.setPosition(proj.id, 100)
      expect(proj.position).toBe(100)
    })

    it('allows tasks to reach 100 independently of project position', () => {
      const store = useHillChartStore()
      const proj = store.projects.find((p) => p.id === 'proj_2')!
      const taskId = proj.tasks[0].id
      store.setPosition(taskId, 100)
      expect(proj.tasks[0].position).toBe(100)
      expect(proj.position).not.toBe(100)
    })
  })

  describe('updateTrackable', () => {
    it('renames a project', () => {
      const store = useHillChartStore()
      store.updateTrackable('proj_1', { name: '  Renamed  ' })
      expect(store.projects[0].name).toBe('Renamed')
    })

    it('sets and clears source', () => {
      const store = useHillChartStore()
      store.updateTrackable('proj_1', {
        source: { url: 'https://github.com/a/b/issues/1', system: 'github' },
      })
      expect(store.projects[0].source?.system).toBe('github')

      store.updateTrackable('proj_1', { source: null })
      expect(store.projects[0].source).toBeUndefined()
    })

    it('rejects empty name and no-ops unknown id', () => {
      const store = useHillChartStore()
      const before = store.projects[0].name
      store.updateTrackable('proj_1', { name: '   ' })
      expect(store.projects[0].name).toBe(before)

      expect(() => store.updateTrackable('nope', { name: 'X' })).not.toThrow()
    })
  })

  describe('force mutations', () => {
    it('addForce up at position 70 keeps position', () => {
      const store = useHillChartStore()
      store.setPosition('proj_3', 70)
      const countBefore = store.projects[2].forces.length

      store.addForce('proj_3', 'up', 'Helper', 'Sam')

      expect(store.projects[2].position).toBe(70)
      expect(store.projects[2].forces.length).toBe(countBefore + 1)
      const added = store.projects[2].forces.at(-1)!
      expect(added.direction).toBe('up')
      expect(added.label).toBe('Helper')
      expect(added.owner).toBe('Sam')
      expect(added.isPrimary).toBe(false)
      expect(added.status).toBe('active')
    })

    it('addForce down at position 70 snaps to 45', () => {
      const store = useHillChartStore()
      store.setPosition('proj_3', 70)

      store.addForce('proj_3', 'down', 'New blocker')

      expect(store.projects[2].position).toBe(BLOCKER_SNAP_POSITION)
      expect(store.projects[2].forces.some((f) => f.label === 'New blocker')).toBe(true)
    })

    it('addForce down at position 40 does not move the dot', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 40)

      store.addForce('proj_1', 'down', 'Uphill blocker')

      expect(store.projects[0].position).toBe(40)
    })

    it('resolveForce does not resolve the primary force', () => {
      const store = useHillChartStore()
      const primary = store.projects[0].forces.find((f) => f.isPrimary)!

      store.resolveForce('proj_1', primary.id)

      expect(primary.status).toBe('active')
      expect(primary.resolvedAt).toBeNull()
    })

    it('resolveForce stores an optional reason', () => {
      const store = useHillChartStore()
      const force = store.projects[0].forces.find((f) => f.id === 'f_1c')!

      store.resolveForce('proj_1', force.id, 'cleared in standup')

      expect(force.status).toBe('resolved')
      expect(force.resolutionReason).toBe('cleared in standup')
      expect(force.resolvedAt).not.toBeNull()
    })

    it('unresolveForce down at position 60 snaps to 45', () => {
      const store = useHillChartStore()
      const force = store.projects[0].forces.find((f) => f.id === 'f_1c')!
      store.resolveForce('proj_1', force.id)
      store.projects[0].position = 60

      store.unresolveForce('proj_1', force.id)

      expect(force.status).toBe('active')
      expect(store.projects[0].position).toBe(BLOCKER_SNAP_POSITION)
    })

    it('updateForce patches label and owner', () => {
      const store = useHillChartStore()
      const force = store.projects[0].forces.find((f) => f.id === 'f_1b')!

      store.updateForce('proj_1', force.id, { label: 'Renamed', owner: 'Jo' })

      expect(force.label).toBe('Renamed')
      expect(force.owner).toBe('Jo')
      expect(force.direction).toBe('up')
    })

    it('force actions no-op for unknown ids', () => {
      const store = useHillChartStore()
      const count = store.projects[0].forces.length

      expect(() => {
        store.addForce('nope', 'up', 'x')
        store.updateForce('nope', 'f_x', { label: 'y' })
        store.resolveForce('nope', 'f_x')
        store.unresolveForce('nope', 'f_x')
        store.addForce('proj_1', 'up', 'x')
        store.updateForce('proj_1', 'nope', { label: 'y' })
      }).not.toThrow()

      expect(store.projects[0].forces.length).toBe(count + 1)
    })
  })

  describe('canImport getter', () => {
    it('returns true when demo is true', () => {
      const store = useHillChartStore()
      expect(store.canImport).toBe(true)
    })

    it('returns true when projects is empty', () => {
      const store = useHillChartStore()
      store.demo = false
      store.projects = []
      expect(store.canImport).toBe(true)
    })

    it('returns false when demo false and projects exist', () => {
      const store = useHillChartStore()
      store.demo = false
      expect(store.canImport).toBe(false)
    })
  })

  describe('demo flag', () => {
    it('setPosition does not clear demo', () => {
      const store = useHillChartStore()
      store.setPosition('proj_1', 40)
      expect(store.demo).toBe(true)
    })
  })

  describe('importState', () => {
    it('replaces projects and sets demo false when canImport', () => {
      const store = useHillChartStore()
      const parsed = validateHillChartJson(MINIMAL_IMPORT_JSON)
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return

      store.importState(parsed.state)

      expect(store.demo).toBe(false)
      expect(store.projects).toHaveLength(1)
      expect(store.projects[0].id).toBe('proj_import_1')
      expect(store.canImport).toBe(false)
    })

    it('no-ops when demo false and projects exist', () => {
      const store = useHillChartStore()
      store.demo = false
      const beforeId = store.projects[0].id
      const parsed = validateHillChartJson(MINIMAL_IMPORT_JSON)
      if (!parsed.ok) throw new Error('fixture')
      store.importState(parsed.state)
      expect(store.projects[0].id).toBe(beforeId)
    })

    it('imports when projects empty even if demo false', () => {
      const store = useHillChartStore()
      store.demo = false
      store.projects = []
      const parsed = validateHillChartJson(MINIMAL_IMPORT_JSON)
      if (!parsed.ok) throw new Error('fixture')
      store.importState(parsed.state)
      expect(store.projects).toHaveLength(1)
    })
  })

  describe('exportState', () => {
    it('sets exportedAt and returns a snapshot of root state', () => {
      const store = useHillChartStore()
      expect(store.exportedAt).toBeNull()

      const snapshot = store.exportState()

      expect(store.exportedAt).not.toBeNull()
      expect(snapshot.exportedAt).toBe(store.exportedAt)
      expect(snapshot.version).toBe(store.version)
      expect(snapshot.demo).toBe(store.demo)
      expect(snapshot.lastDailyDate).toBe(store.lastDailyDate)
      expect(snapshot.projects).toBe(store.projects)
      expect(snapshot.projects.length).toBe(5)
    })

    it('preserves demo true in snapshot while on sample data', () => {
      const store = useHillChartStore()
      expect(store.demo).toBe(true)

      const snapshot = store.exportState()

      expect(snapshot.demo).toBe(true)
    })
  })

  describe('cleanState', () => {
    it('empties projects, clears exportedAt, sets demo false, enables import', () => {
      const store = useHillChartStore()
      store.exportedAt = '2026-01-01T00:00:00.000Z'
      store.demo = true

      store.cleanState()

      expect(store.projects).toEqual([])
      expect(store.exportedAt).toBeNull()
      expect(store.demo).toBe(false)
      expect(store.version).toBe(1)
      expect(store.lastDailyDate).toBeNull()
      expect(store.canImport).toBe(true)
    })

    it('no-ops when projects already empty', () => {
      const store = useHillChartStore()
      store.projects = []
      store.demo = false
      store.exportedAt = null

      store.cleanState()

      expect(store.projects).toEqual([])
      expect(store.demo).toBe(false)
    })
  })

  describe('endDaily', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 5, 6, 12, 0, 0))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('sets snapshots on all projects and nested tasks', () => {
      const store = useHillChartStore()
      const today = localDateString()

      store.endDaily()

      expect(store.lastDailyDate).toBe(today)
      for (const project of store.projects) {
        expect(project.snapshots).toContainEqual({ date: today, position: project.position })
        for (const task of project.tasks) {
          expect(task.snapshots).toContainEqual({ date: today, position: task.position })
        }
      }
    })

    it('replaces existing snapshot when same date already present', () => {
      const store = useHillChartStore()
      const today = localDateString()
      const project = store.projects[0]
      project.snapshots = [{ date: today, position: 1 }]
      project.position = 99

      store.endDaily()

      expect(project.snapshots).toEqual([{ date: today, position: 99 }])
    })

    it('sorts snapshots newest-first after upsert', () => {
      const store = useHillChartStore()
      const project = store.projects[0]
      project.snapshots = [{ date: '2026-06-05', position: 10 }]

      store.endDaily()

      expect(project.snapshots[0].date).toBe('2026-06-06')
      expect(project.snapshots[1].date).toBe('2026-06-05')
    })

    it('no-ops when projects empty', () => {
      const store = useHillChartStore()
      store.projects = []

      store.endDaily()

      expect(store.lastDailyDate).toBeNull()
    })

    it('addTask after endDaily leaves new task without today snapshot', () => {
      const store = useHillChartStore()
      const today = localDateString()
      const project = store.projects[0]

      store.endDaily()
      const taskId = store.addTask(project.id)
      const task = project.tasks.find((t) => t.id === taskId)!

      expect(store.lastDailyDate).toBe(today)
      expect(task.snapshots).toEqual([])
    })

    it('cleanState clears lastDailyDate', () => {
      const store = useHillChartStore()
      store.endDaily()

      store.cleanState()

      expect(store.lastDailyDate).toBeNull()
    })

    it('exportState includes lastDailyDate', () => {
      const store = useHillChartStore()
      store.endDaily()

      const snapshot = store.exportState()

      expect(snapshot.lastDailyDate).toBe('2026-06-06')
    })

    it('preserves demo true after endDaily', () => {
      const store = useHillChartStore()
      expect(store.demo).toBe(true)

      store.endDaily()

      expect(store.demo).toBe(true)
    })
  })

  describe('removeProject', () => {
    it('removes the project from the store', () => {
      const store = useHillChartStore()
      const id = store.projects[0].id
      const before = store.projects.length

      store.removeProject(id)

      expect(store.projects.length).toBe(before - 1)
      expect(store.projects.some((p) => p.id === id)).toBe(false)
    })

    it('removes nested tasks with the project', () => {
      const store = useHillChartStore()
      const project = store.projects.find((p) => p.tasks.length > 0)!
      const taskId = project.tasks[0].id

      store.removeProject(project.id)

      expect(store.projects.some((p) => p.id === project.id)).toBe(false)
      expect(store.projects.some((p) => p.tasks.some((t) => t.id === taskId))).toBe(false)
    })

    it('no-ops for unknown project id', () => {
      const store = useHillChartStore()
      const before = store.projects.length

      store.removeProject('missing')

      expect(store.projects.length).toBe(before)
    })
  })

  describe('removeTask', () => {
    it('removes the task from its project', () => {
      const store = useHillChartStore()
      const project = store.projects.find((p) => p.tasks.length > 0)!
      const taskId = project.tasks[0].id
      const before = project.tasks.length

      store.removeTask(project.id, taskId)

      expect(project.tasks.length).toBe(before - 1)
      expect(project.tasks.some((t) => t.id === taskId)).toBe(false)
    })

    it('no-ops for unknown project id', () => {
      const store = useHillChartStore()
      const counts = store.projects.map((p) => p.tasks.length)

      store.removeTask('missing', 'task_1')

      store.projects.forEach((p, i) => {
        expect(p.tasks.length).toBe(counts[i])
      })
    })

    it('no-ops for unknown task id', () => {
      const store = useHillChartStore()
      const project = store.projects[0]
      const before = project.tasks.length

      store.removeTask(project.id, 'missing')

      expect(project.tasks.length).toBe(before)
    })
  })
})
