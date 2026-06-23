// src/domain/doneRules.test.ts
import { describe, it, expect } from 'vitest'
import type { Project, Task } from '../schema/types'
import { DONE_POSITION } from './staleness'
import {
  allTasksDone,
  clampProjectDonePosition,
  isProjectDoneBlocked,
  PROJECT_DONE_CLAMP,
} from './doneRules'

function task(position: number): Task {
  return {
    id: 'task_1',
    name: 'Task',
    position,
    lastMovedAt: new Date().toISOString(),
    forces: [],
    snapshots: [],
    dailyNoteDraft: '',
    notes: [],
  }
}

function project(tasks: Task[]): Project {
  return {
    id: 'proj_1',
    name: 'Project',
    color: 'terracotta',
    position: 50,
    lastMovedAt: new Date().toISOString(),
    forces: [],
    snapshots: [],
    dailyNoteDraft: '',
    notes: [],
    tasks,
  }
}

describe('allTasksDone', () => {
  it('is true when there are no tasks', () => {
    expect(allTasksDone(project([]))).toBe(true)
  })

  it('is true when every task is at DONE_POSITION', () => {
    expect(allTasksDone(project([task(100), task(100)]))).toBe(true)
  })

  it('is false when any task is below DONE_POSITION', () => {
    expect(allTasksDone(project([task(100), task(99)]))).toBe(false)
  })
})

describe('isProjectDoneBlocked', () => {
  it('is false below done position', () => {
    expect(isProjectDoneBlocked(project([task(50)]), 99)).toBe(false)
  })

  it('is true at done position when tasks remain open', () => {
    expect(isProjectDoneBlocked(project([task(99)]), DONE_POSITION)).toBe(true)
  })

  it('is false at done position when all tasks are done', () => {
    expect(isProjectDoneBlocked(project([task(100)]), DONE_POSITION)).toBe(false)
  })
})

describe('clampProjectDonePosition', () => {
  it('passes through non-done targets', () => {
    const p = project([task(50)])
    expect(clampProjectDonePosition(p, 80)).toBe(80)
  })

  it('allows 100 when all tasks are done', () => {
    const p = project([task(100)])
    expect(clampProjectDonePosition(p, DONE_POSITION)).toBe(DONE_POSITION)
  })

  it('clamps to PROJECT_DONE_CLAMP when tasks remain open', () => {
    const p = project([task(99)])
    expect(clampProjectDonePosition(p, DONE_POSITION)).toBe(PROJECT_DONE_CLAMP)
  })
})
