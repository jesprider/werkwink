<script setup lang="ts">
import type { ChartMarker } from '../domain/chartMarkers'
import type { Project } from '../schema/types'
import { chartBaselineY } from '../lib/hillCurve'
import DonePanel from './DonePanel.vue'
import HillChart from './HillChart.vue'
import IconPlus from './IconPlus.vue'
import SidePanel from './SidePanel.vue'

defineProps<{
  activeMarkers: ChartMarker[]
  doneMarkers: ChartMarker[]
  selectedTrackableId: string | null
  panelProject?: Project
  chartBlockMessage?: string | null
  showOpenProject?: boolean
  addLabel?: string
}>()

const emit = defineEmits<{
  move: [id: string, position: number]
  click: [id: string]
  select: [id: string]
  open: [id: string]
  closePanel: []
  add: []
  restore: [id: string]
}>()

const addLinkTop = `${chartBaselineY() * 100}%`

function onOpen(id: string) {
  emit('open', id)
}
</script>

<template>
  <div class="grid w-full grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
    <div class="relative min-w-0">
      <p
        v-if="chartBlockMessage"
        role="status"
        class="pointer-events-none absolute top-2 left-1/2 z-20 w-max max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-lg bg-rust/10 px-3 py-2 text-center text-sm text-rust"
      >
        {{ chartBlockMessage }}
      </p>
      <HillChart
        clickable
        :markers="activeMarkers"
        :selected-id="selectedTrackableId"
        @move="(id, position) => emit('move', id, position)"
        @open="onOpen"
        @click="emit('click', $event)"
        @select="emit('select', $event)"
      />
      <div
        v-if="addLabel"
        class="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 -translate-y-full"
        :style="{ top: addLinkTop }"
      >
        <button
          type="button"
          class="pointer-events-auto rounded bg-hill-sand/40 p-1 text-text-warm/60 transition-colors hover:bg-hill-sand hover:text-text-warm"
          :title="addLabel"
          :aria-label="addLabel"
          @click="emit('add')"
        >
          <IconPlus />
        </button>
      </div>
    </div>
    <div class="w-80 shrink-0">
      <DonePanel
        v-if="!selectedTrackableId && doneMarkers.length"
        :done-markers="doneMarkers"
        @click="(id) => emit('click', id)"
        @restore="(id) => emit('restore', id)"
      />
      <SidePanel
        v-else-if="panelProject && selectedTrackableId"
        :project="panelProject"
        :trackable-id="selectedTrackableId"
        :show-open-project="showOpenProject"
        @close="emit('closePanel')"
      />
    </div>
  </div>
</template>
