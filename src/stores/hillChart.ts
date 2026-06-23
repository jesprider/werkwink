import { defineStore } from 'pinia'
import type {
  Force,
  ForceDirection,
  HillChartState,
  HillTrackable,
  Project,
  Source,
  Task,
} from '../schema/types'
import { sampleState } from '../data/sample'
import { clampProjectDonePosition } from '../domain/doneRules'
import { canCrossPeak, PEAK_POSITION, snapIfDownhillWithBlockers } from '../domain/forceRules'
import { createPrimaryOwnerForce } from '../domain/primaryOwnerForce'
import { findTrackableInProjects } from '../domain/trackableLookup'
import { appendDailyNote } from '../domain/dailyNotes'
import { isPositionDirty, upsertSnapshot } from '../domain/snapshots'
import { localDateString } from '../lib/localDate'
import { PALETTE_ORDER } from '../schema/palette'
import { WERKWINK_STORAGE_KEY } from '../storage/loadState'

function findForce(trackable: HillTrackable, forceId: string): Force | undefined {
  return trackable.forces.find((f) => f.id === forceId)
}

export const useHillChartStore = defineStore('hillChart', {
  state: (): HillChartState => structuredClone(sampleState),
  persist: {
    key: WERKWINK_STORAGE_KEY,
  },
  getters: {
    canImport(state): boolean {
      return state.demo === true || state.projects.length === 0
    },
    canCapture(state): boolean {
      if (state.projects.length === 0) return false
      const draftPending = (t: HillTrackable) => (t.dailyNoteDraft ?? '').trim() !== ''
      for (const project of state.projects) {
        if (isPositionDirty(project) || draftPending(project)) return true
        for (const task of project.tasks) {
          if (isPositionDirty(task) || draftPending(task)) return true
        }
      }
      return false
    },
  },
  actions: {
    importState(state: HillChartState): void {
      if (!this.canImport) return
      this.version = state.version
      this.exportedAt = state.exportedAt
      this.projects = state.projects
      this.demo = false
    },

    exportState(): HillChartState {
      this.exportedAt = new Date().toISOString()
      return {
        version: this.version,
        exportedAt: this.exportedAt,
        demo: this.demo,
        projects: this.projects,
      }
    },

    cleanState(): void {
      if (this.projects.length === 0) return
      this.version = 1
      this.exportedAt = null
      this.demo = false
      this.projects = []
    },

    capture(): void {
      if (this.projects.length === 0) return
      const today = localDateString()
      const commit = (trackable: HillTrackable) => {
        trackable.snapshots = upsertSnapshot(trackable.snapshots, today, trackable.position)
        const trimmed = (trackable.dailyNoteDraft ?? '').trim()
        trackable.dailyNoteDraft = ''
        if (trimmed === '') return
        trackable.notes = appendDailyNote(trackable.notes ?? [], today, trimmed)
      }
      for (const project of this.projects) {
        commit(project)
        for (const task of project.tasks) {
          commit(task)
        }
      }
    },

    addProject(): string {
      const now = new Date().toISOString()
      const id = `proj_${crypto.randomUUID()}`
      const project: Project = {
        id,
        name: 'New project',
        color: PALETTE_ORDER[this.projects.length % PALETTE_ORDER.length],
        position: 0,
        lastMovedAt: now,
        forces: [createPrimaryOwnerForce(null, now)],
        snapshots: [],
        dailyNoteDraft: '',
        notes: [],
        tasks: [],
      }
      this.projects.push(project)
      return id
    },

    addTask(projectId: string): string {
      const project = this.projects.find((p) => p.id === projectId)
      if (!project) return ''

      const projectPrimaryOwner =
        project.forces.find((f) => f.isPrimary && f.direction === 'up')?.owner ?? null

      const now = new Date().toISOString()
      const id = `task_${crypto.randomUUID()}`
      const task: Task = {
        id,
        name: 'New task',
        position: 0,
        lastMovedAt: now,
        forces: [createPrimaryOwnerForce(projectPrimaryOwner, now)],
        snapshots: [],
        dailyNoteDraft: '',
        notes: [],
      }
      project.tasks.push(task)
      return id
    },

    removeProject(projectId: string): void {
      const index = this.projects.findIndex((p) => p.id === projectId)
      if (index === -1) return
      this.projects.splice(index, 1)
    },

    removeTask(projectId: string, taskId: string): void {
      const project = this.projects.find((p) => p.id === projectId)
      if (!project) return
      const index = project.tasks.findIndex((t) => t.id === taskId)
      if (index === -1) return
      project.tasks.splice(index, 1)
    },

    setPosition(id: string, position: number) {
      const trackable = findTrackableInProjects(this.projects, id)
      if (!trackable) return
      const current = trackable.position
      let next = Math.min(100, Math.max(0, Math.round(position)))
      if (!canCrossPeak(trackable.forces, next, current)) {
        next = PEAK_POSITION
      }
      const owningProject = this.projects.find((p) => p.id === id)
      if (owningProject) {
        next = clampProjectDonePosition(owningProject, next)
      }
      if (next === current) return
      trackable.position = next
      trackable.lastMovedAt = new Date().toISOString()
    },

    setDailyNoteDraft(trackableId: string, text: string): void {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return
      trackable.dailyNoteDraft = text
    },

    updateTrackable(trackableId: string, patch: { name?: string; source?: Source | null }) {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return

      if (patch.name !== undefined) {
        const trimmed = patch.name.trim()
        if (!trimmed) return
        trackable.name = trimmed
      }

      if (patch.source !== undefined) {
        if (patch.source === null) {
          delete trackable.source
        } else {
          trackable.source = patch.source
        }
      }
    },

    addForce(trackableId: string, direction: ForceDirection, label: string, owner?: string | null) {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return

      trackable.forces.push({
        id: `f_${crypto.randomUUID()}`,
        direction,
        label,
        owner: owner ?? null,
        isPrimary: false,
        status: 'active',
        createdAt: new Date().toISOString(),
        resolvedAt: null,
        resolutionReason: null,
      })

      if (direction === 'down') {
        snapIfDownhillWithBlockers(trackable)
      }
    },

    updateForce(
      trackableId: string,
      forceId: string,
      patch: { label?: string; owner?: string | null },
    ) {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return
      const force = findForce(trackable, forceId)
      if (!force) return
      if (patch.label === undefined && patch.owner === undefined) return

      if (patch.label !== undefined) force.label = patch.label
      if (patch.owner !== undefined) force.owner = patch.owner
    },

    resolveForce(trackableId: string, forceId: string, reason?: string) {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return
      const force = findForce(trackable, forceId)
      if (!force || force.isPrimary || force.status === 'resolved') return

      force.status = 'resolved'
      force.resolvedAt = new Date().toISOString()
      force.resolutionReason = reason ?? null
    },

    unresolveForce(trackableId: string, forceId: string) {
      const trackable = findTrackableInProjects(this.projects, trackableId)
      if (!trackable) return
      const force = findForce(trackable, forceId)
      if (!force || force.status !== 'resolved') return

      force.status = 'active'
      force.resolvedAt = null
      force.resolutionReason = null

      if (force.direction === 'down') {
        snapIfDownhillWithBlockers(trackable)
      }
    },
  },
})
