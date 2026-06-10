<script setup lang="ts">
import { computed } from 'vue'
import { STALE_RED } from '../domain/staleness'

const props = defineProps<{
  cx: number
  cy: number
  radius: number
  color: string
  name: string
  up: number
  down: number
  stalenessSatellites: number
}>()

const emit = defineEmits<{
  (e: 'grab', ev: PointerEvent): void
  (e: 'open'): void
}>()

const satelliteRadius = computed(() => Math.max(3, Math.round(props.radius * 0.22)))

/** Evenly spaced upper-arc slots (left → right); count uses the first N. */
const ARC_START = (-4 * Math.PI) / 5
const ARC_END = -Math.PI / 5
const SATELLITE_ARC_ANGLES = Array.from(
  { length: 4 },
  (_, i) => ARC_START + (i / 3) * (ARC_END - ARC_START),
)

const satelliteCoords = computed(() => {
  const count = props.stalenessSatellites
  if (count === 0) return []

  const orbit = props.radius + satelliteRadius.value + 2

  return Array.from({ length: count }, (_, i) => {
    const angle = SATELLITE_ARC_ANGLES[i]
    return {
      cx: props.cx + orbit * Math.cos(angle),
      cy: props.cy + orbit * Math.sin(angle),
    }
  })
})
</script>

<template>
  <g class="cursor-grab" @pointerdown="emit('grab', $event)" @dblclick="emit('open')">
    <circle :cx="cx" :cy="cy" :r="radius" :fill="color" stroke="#FDFAF4" stroke-width="2" />
    <circle
      v-for="(satellite, i) in satelliteCoords"
      :key="i"
      :cx="satellite.cx"
      :cy="satellite.cy"
      :r="satelliteRadius"
      :fill="STALE_RED"
      stroke="#FDFAF4"
      stroke-width="1"
      pointer-events="none"
    />
    <text
      :x="cx"
      :y="cy + radius + 18"
      text-anchor="middle"
      font-size="15"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      {{ name }}
    </text>
    <text
      :x="cx"
      :y="cy + radius + 34"
      text-anchor="middle"
      font-size="13"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      ↑{{ up }} ↓{{ down }}
    </text>
  </g>
</template>
