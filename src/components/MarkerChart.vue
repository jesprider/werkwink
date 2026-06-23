<script setup lang="ts">
import { computed } from 'vue'
import { STALE_RED } from '../domain/staleness'
import { clampLabelCenterX } from '../lib/hillCurve'

const CREAM = '#FDFAF4'
const TITLE_FONT_SIZE = 12
const TITLE_Y_OFFSET = 17
const FORCES_FONT_SIZE = 12
const FORCES_Y_OFFSET = 34

const props = defineProps<{
  cx: number
  cy: number
  radius: number
  color: string
  name: string
  up: number
  down: number
  stalenessSatellites: number
  highlighted?: boolean
}>()

const forcesText = computed(() => `↑${props.up} ↓${props.down}`)

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

const labelWidth = computed(() => Math.max(props.name.length * 6, forcesText.value.length * 6) + 10)

const labelCenterX = computed(() => clampLabelCenterX(props.cx, labelWidth.value))

const labelBackground = computed(() => {
  const width = labelWidth.value
  const titleBaseline = props.cy + props.radius + TITLE_Y_OFFSET
  const forcesBaseline = props.cy + props.radius + FORCES_Y_OFFSET
  const top = titleBaseline - 11
  const bottom = forcesBaseline + 3
  return {
    x: labelCenterX.value - width / 2,
    y: top,
    width,
    height: bottom - top,
    rx: 5,
  }
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
    <rect
      v-if="highlighted"
      :x="labelBackground.x"
      :y="labelBackground.y"
      :width="labelBackground.width"
      :height="labelBackground.height"
      :rx="labelBackground.rx"
      :fill="CREAM"
      fill-opacity="0.85"
      pointer-events="none"
    />
    <text
      :x="labelCenterX"
      :y="cy + radius + TITLE_Y_OFFSET"
      text-anchor="middle"
      :font-size="TITLE_FONT_SIZE"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      {{ name }}
    </text>
    <text
      :x="labelCenterX"
      :y="cy + radius + FORCES_Y_OFFSET"
      text-anchor="middle"
      :font-size="FORCES_FONT_SIZE"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      {{ forcesText }}
    </text>
  </g>
</template>
