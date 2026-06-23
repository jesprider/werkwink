import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'
import type { HillTrackable, Project } from '../schema/types'
import { useChartBlockNudge } from './useChartBlockNudge'

export type NudgeContext = {
  trackable: HillTrackable | undefined
  project: Project | undefined
}

export function useChartSelection(options: {
  validIds: MaybeRefOrGetter<readonly string[]>
  applyPosition: (id: string, position: number) => void
  nudgeContextForMove: (id: string) => NudgeContext
}) {
  const selectedTrackableId = ref<string | null>(null)
  const { chartBlockMessage, maybeNudgeOnMove } = useChartBlockNudge()

  watchEffect(() => {
    if (!selectedTrackableId.value) return
    const ids = toValue(options.validIds)
    if (!ids.includes(selectedTrackableId.value)) {
      selectedTrackableId.value = null
    }
  })

  function onMove(id: string, position: number) {
    const { trackable, project } = options.nudgeContextForMove(id)
    maybeNudgeOnMove(trackable, project, id, position)
    options.applyPosition(id, position)
  }

  function onTrackableClick(id: string) {
    selectedTrackableId.value = selectedTrackableId.value === id ? null : id
  }

  function selectTrackable(id: string) {
    selectedTrackableId.value = id
  }

  function clearSelection() {
    selectedTrackableId.value = null
  }

  return {
    selectedTrackableId,
    chartBlockMessage,
    onMove,
    onTrackableClick,
    selectTrackable,
    clearSelection,
  }
}
