import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computed, nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { PEAK_CROSSING_BLOCKED_MESSAGE } from '../domain/forceRules'
import { useHillChartStore } from '../stores/hillChart'
import { useChartSelection } from './useChartSelection'

describe('useChartSelection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toggles selectedTrackableId on click', () => {
    const { selectedTrackableId, onTrackableClick } = useChartSelection({
      validIds: ['proj_1'],
      applyPosition: vi.fn(),
      nudgeContextForMove: () => ({ trackable: undefined, project: undefined }),
    })

    onTrackableClick('proj_1')
    expect(selectedTrackableId.value).toBe('proj_1')

    onTrackableClick('proj_1')
    expect(selectedTrackableId.value).toBeNull()
  })

  it('clears selection when id is no longer valid', async () => {
    const store = useHillChartStore()
    const validIds = computed(() => store.projects.map((p) => p.id))
    const { selectedTrackableId } = useChartSelection({
      validIds,
      applyPosition: vi.fn(),
      nudgeContextForMove: () => ({ trackable: undefined, project: undefined }),
    })

    selectedTrackableId.value = 'proj_1'
    store.removeProject('proj_1')
    await nextTick()

    expect(selectedTrackableId.value).toBeNull()
  })

  it('calls applyPosition on move', () => {
    const applyPosition = vi.fn()
    const { onMove } = useChartSelection({
      validIds: ['proj_1'],
      applyPosition,
      nudgeContextForMove: () => ({ trackable: undefined, project: undefined }),
    })

    onMove('proj_1', 42)
    expect(applyPosition).toHaveBeenCalledWith('proj_1', 42)
  })

  it('clearSelection resets selectedTrackableId', () => {
    const { selectedTrackableId, onTrackableClick, clearSelection } = useChartSelection({
      validIds: ['proj_1'],
      applyPosition: vi.fn(),
      nudgeContextForMove: () => ({ trackable: undefined, project: undefined }),
    })

    onTrackableClick('proj_1')
    clearSelection()
    expect(selectedTrackableId.value).toBeNull()
  })

  it('surfaces chart block message when move is blocked', () => {
    const store = useHillChartStore()
    const projectId = store.addProject()
    store.setPosition(projectId, 45)
    store.addForce(projectId, 'down', 'Blocker')

    const { chartBlockMessage, onMove } = useChartSelection({
      validIds: [projectId],
      applyPosition: (id, position) => store.setPosition(id, position),
      nudgeContextForMove: (id) => ({
        trackable: store.projects.find((p) => p.id === id),
        project: store.projects.find((p) => p.id === id),
      }),
    })

    onMove(projectId, 55)

    expect(chartBlockMessage.value).toBe(PEAK_CROSSING_BLOCKED_MESSAGE)
  })
})
