<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChartMarker } from '../domain/chartMarkers'
import type { Project } from '../schema/types'
import { chartBaselineY } from '../lib/hillCurve'
import DoneStack from './DoneStack.vue'
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
  open: [id: string]
  closePanel: []
  add: []
}>()

const addLinkTop = `${chartBaselineY() * 100}%`

const hillChartRef = ref<InstanceType<typeof HillChart> | null>(null)
const svgRef = computed(() => hillChartRef.value?.svgRef ?? null)

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
        class="pointer-events-none absolute top-2 right-2 left-2 z-20 rounded-lg bg-rust/10 px-3 py-2 text-center text-sm text-rust"
      >
        {{ chartBlockMessage }}
      </p>
      <HillChart
        ref="hillChartRef"
        clickable
        :markers="activeMarkers"
        :selected-id="selectedTrackableId"
        @move="(id, position) => emit('move', id, position)"
        @open="onOpen"
        @click="emit('click', $event)"
      />
      <DoneStack
        :done-markers="doneMarkers"
        :selected-id="selectedTrackableId"
        :svg-ref="svgRef"
        @move="(id, position) => emit('move', id, position)"
        @click="emit('click', $event)"
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
      <SidePanel
        v-if="panelProject && selectedTrackableId"
        :project="panelProject"
        :trackable-id="selectedTrackableId"
        :show-open-project="showOpenProject"
        @close="emit('closePanel')"
      />
    </div>
  </div>
</template>
