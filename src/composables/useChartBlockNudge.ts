import { onBeforeUnmount, ref } from 'vue'
import type { HillTrackable, Project } from '../schema/types'
import { isProjectDoneBlocked, PROJECT_DONE_BLOCKED_MESSAGE } from '../domain/doneRules'
import { isPeakCrossingBlocked, PEAK_CROSSING_BLOCKED_MESSAGE } from '../domain/forceRules'

const NUDGE_MS = 4000

export function useChartBlockNudge() {
  const chartBlockMessage = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  function clearNudgeTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  function nudge(message: string) {
    chartBlockMessage.value = message
    clearNudgeTimer()
    timer = setTimeout(() => {
      chartBlockMessage.value = null
    }, NUDGE_MS)
  }

  function maybeNudgeOnMove(
    trackable: HillTrackable | undefined,
    project: Project | undefined,
    id: string,
    requestedPosition: number,
  ) {
    if (!trackable || trackable.id !== id) return

    if (isPeakCrossingBlocked(trackable.forces, requestedPosition, trackable.position)) {
      nudge(PEAK_CROSSING_BLOCKED_MESSAGE)
      return
    }

    if (project && project.id === id && isProjectDoneBlocked(project, requestedPosition)) {
      nudge(PROJECT_DONE_BLOCKED_MESSAGE)
    }
  }

  onBeforeUnmount(clearNudgeTimer)

  return { chartBlockMessage, maybeNudgeOnMove }
}
