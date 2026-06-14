<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ChartMarker } from '../domain/chartMarkers'
import type { Project } from '../schema/types'
import DoneStack from './DoneStack.vue'
import HillChart from './HillChart.vue'
import SidePanel from './SidePanel.vue'

defineProps<{
  activeMarkers: ChartMarker[]
  doneMarkers: ChartMarker[]
  selectedTrackableId: string | null
  panelProject?: Project
  chartBlockMessage?: string | null
  showOpenProject?: boolean
}>()

const emit = defineEmits<{
  move: [id: string, position: number]
  click: [id: string]
  open: [id: string]
  closePanel: []
}>()

const hillChartRef = ref<InstanceType<typeof HillChart> | null>(null)
const svgRef = computed(() => hillChartRef.value?.svgRef ?? null)

function onOpen(id: string) {
  emit('open', id)
}
</script>

<template>
  <div class="mx-auto flex max-w-[1400px] items-start gap-6">
    <div class="relative min-w-0 flex-1">
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
    </div>
    <SidePanel
      v-if="panelProject && selectedTrackableId"
      :project="panelProject"
      :trackable-id="selectedTrackableId"
      :show-open-project="showOpenProject"
      @close="emit('closePanel')"
    />
  </div>
</template>
