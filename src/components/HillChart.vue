<script setup lang="ts">
import { computed, ref } from 'vue'
import { chartViewBox, curvePath, curveX, curveY, HILL_STROKE } from '../lib/hillCurve'
import { useHillDrag } from '../composables/useHillDrag'
import { markersInPaintOrder, type ChartMarker as ChartMarkerModel } from '../domain/chartMarkers'
import MarkerChart from './MarkerChart.vue'
import MarkerTrail from './MarkerTrail.vue'

const props = defineProps<{
  markers: ChartMarkerModel[]
  clickable?: boolean
  selectedId?: string | null
}>()
const emit = defineEmits<{
  (e: 'move', id: string, position: number): void
  (e: 'open', id: string): void
  (e: 'click', id: string): void
}>()

const path = curvePath()

const svgRef = ref<SVGSVGElement | null>(null)

const { startDrag: onGrab, draggingId } = useHillDrag({
  getSvg: () => svgRef.value,
  clickable: () => props.clickable ?? false,
  onMove: (id, position) => emit('move', id, position),
  onClick: (id) => emit('click', id),
})

const foregroundId = computed(() => props.selectedId ?? draggingId.value ?? null)

const paintOrderMarkers = computed(() => markersInPaintOrder(props.markers, foregroundId.value))

defineExpose({ svgRef })
</script>

<template>
  <svg
    ref="svgRef"
    :viewBox="chartViewBox()"
    class="h-auto w-full select-none"
    role="img"
    aria-label="Hill chart"
  >
    <path :d="path" fill="none" :stroke="HILL_STROKE" stroke-width="3" />

    <g v-for="m in paintOrderMarkers" :key="m.id">
      <MarkerTrail
        v-if="m.id === selectedId"
        :ghosts="m.ghosts"
        :radius="m.radius"
        :color="m.color"
      />
      <MarkerChart
        :cx="curveX(m.position)"
        :cy="curveY(m.position)"
        :radius="m.radius"
        :color="m.color"
        :staleness-satellites="m.stalenessSatellites"
        :name="m.name"
        :up="m.up"
        :down="m.down"
        :highlighted="m.id === foregroundId"
        @grab="(ev: PointerEvent) => onGrab(m.id, ev)"
        @open="emit('open', m.id)"
      />
    </g>
  </svg>
</template>
