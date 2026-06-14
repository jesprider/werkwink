<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HillTrackable, Project } from '../schema/types'
import type { TrackableKind } from '../domain/trackableLookup'
import {
  allTasksDone,
  isProjectDoneBlocked,
  PROJECT_DONE_BLOCKED_MESSAGE,
  PROJECT_DONE_CLAMP,
} from '../domain/doneRules'
import {
  hasActiveDownForces,
  isPeakCrossingBlocked,
  PEAK_CROSSING_BLOCKED_MESSAGE,
  PEAK_POSITION,
} from '../domain/forceRules'
import { daysWithoutMovement } from '../domain/staleness'
import { useHillChartStore } from '../stores/hillChart'

const props = defineProps<{
  trackable: HillTrackable
  kind: TrackableKind
  project: Project
  trackableId: string
}>()

const store = useHillChartStore()
const peakCrossingAttempted = ref(false)
const projectDoneAttempted = ref(false)

watch(
  () => props.trackableId,
  () => {
    peakCrossingAttempted.value = false
    projectDoneAttempted.value = false
  },
)

watch(
  () => props.trackable.position,
  (position) => {
    if (position !== PROJECT_DONE_CLAMP) projectDoneAttempted.value = false
    if (position !== PEAK_POSITION) peakCrossingAttempted.value = false
  },
)

const atPeak = computed(() => props.trackable.position === PEAK_POSITION)
const hasActiveBlockers = computed(() => hasActiveDownForces(props.trackable.forces))
const showBlockerHint = computed(() => {
  if (!hasActiveBlockers.value) return false
  return atPeak.value || peakCrossingAttempted.value
})
const showProjectDoneHint = computed(() => {
  if (props.kind !== 'project' || allTasksDone(props.project)) return false
  return props.trackable.position === PROJECT_DONE_CLAMP || projectDoneAttempted.value
})
const stalenessLabel = computed(() => {
  const days = daysWithoutMovement(props.trackable.lastMovedAt, props.trackable.position)
  if (days === 0) return null
  return days === 1 ? '1 day without movement' : `${days} days without movement`
})

function onSliderInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (isPeakCrossingBlocked(props.trackable.forces, value, props.trackable.position)) {
    peakCrossingAttempted.value = true
  }
  if (props.kind === 'project' && isProjectDoneBlocked(props.project, value)) {
    projectDoneAttempted.value = true
  }
  store.setPosition(props.trackableId, value)
}
</script>

<template>
  <section class="mb-6">
    <h3 class="mb-2 text-xs font-medium tracking-wide text-text-warm/60 uppercase">Position</h3>
    <div class="flex items-center gap-3">
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="trackable.position"
        class="flex-1 accent-terracotta"
        :aria-valuenow="trackable.position"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Position on hill"
        @input="onSliderInput"
      />
      <span class="w-8 text-right text-lg tabular-nums">{{ trackable.position }}</span>
    </div>
    <p v-if="stalenessLabel" class="mt-1 text-sm text-text-warm/70">{{ stalenessLabel }}</p>
    <p v-if="atPeak" class="mt-1 text-sm text-text-warm/70">At the peak</p>
    <p v-if="showBlockerHint" class="mt-1 text-sm text-text-warm/70">
      {{ PEAK_CROSSING_BLOCKED_MESSAGE }}
    </p>
    <p v-if="showProjectDoneHint" class="mt-1 text-sm text-text-warm/70">
      {{ PROJECT_DONE_BLOCKED_MESSAGE }}
    </p>
  </section>
</template>
