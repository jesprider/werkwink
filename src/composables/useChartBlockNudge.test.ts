// @vitest-environment happy-dom
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Project } from '../schema/types'
import { PROJECT_DONE_BLOCKED_MESSAGE } from '../domain/doneRules'
import { PEAK_CROSSING_BLOCKED_MESSAGE } from '../domain/forceRules'
import { useChartBlockNudge } from './useChartBlockNudge'

function mountNudge() {
  let api!: ReturnType<typeof useChartBlockNudge>
  const Comp = defineComponent({
    setup() {
      api = useChartBlockNudge()
      return () => null
    },
  })
  mount(Comp)
  return api
}

function projectFixture(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj_1',
    name: 'Test project',
    color: 'terracotta',
    position: 45,
    lastMovedAt: '2026-06-01T12:00:00.000Z',
    forces: [],
    snapshots: [],
    tasks: [
      {
        id: 'task_1',
        name: 'Open task',
        position: 10,
        lastMovedAt: '2026-06-01T12:00:00.000Z',
        forces: [],
        snapshots: [],
      },
    ],
    ...overrides,
  }
}

describe('useChartBlockNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('nudges when peak crossing is blocked', () => {
    const { chartBlockMessage, maybeNudgeOnMove } = mountNudge()
    const trackable = {
      id: 'proj_1',
      name: 'Test',
      position: 45,
      lastMovedAt: '2026-06-01T12:00:00.000Z',
      forces: [
        {
          id: 'f_1',
          direction: 'down' as const,
          label: 'Blocker',
          owner: null,
          isPrimary: false,
          status: 'active' as const,
          createdAt: '2026-06-01T12:00:00.000Z',
          resolvedAt: null,
          resolutionReason: null,
        },
      ],
      snapshots: [],
    }

    maybeNudgeOnMove(trackable, undefined, 'proj_1', 55)

    expect(chartBlockMessage.value).toBe(PEAK_CROSSING_BLOCKED_MESSAGE)

    vi.advanceTimersByTime(4000)
    expect(chartBlockMessage.value).toBeNull()
  })

  it('nudges when project done is blocked', () => {
    const { chartBlockMessage, maybeNudgeOnMove } = mountNudge()
    const project = projectFixture()

    maybeNudgeOnMove(project, project, 'proj_1', 100)

    expect(chartBlockMessage.value).toBe(PROJECT_DONE_BLOCKED_MESSAGE)
  })

  it('ignores moves for a different trackable id', () => {
    const { chartBlockMessage, maybeNudgeOnMove } = mountNudge()
    const project = projectFixture()

    maybeNudgeOnMove(project, project, 'other_id', 100)

    expect(chartBlockMessage.value).toBeNull()
  })
})
