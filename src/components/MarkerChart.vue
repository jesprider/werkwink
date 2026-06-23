<script setup lang="ts">
import { computed } from 'vue'
import { STALE_RED } from '../domain/staleness'
import { estimateLabelWidth } from '../lib/hillCurve'
import { computeLabelLayout, type LabelSide } from '../lib/labelLayout'

const CREAM = '#FDFAF4'
const TITLE_FONT_SIZE = 12
const FORCES_FONT_SIZE = 12

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
  labelSide?: LabelSide
}>()

const forcesText = computed(() => `↑${props.up} ↓${props.down}`)

const emit = defineEmits<{
  (e: 'grab', ev: PointerEvent): void
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

const labelWidth = computed(() => estimateLabelWidth(props.name, forcesText.value))

const labelLayout = computed(() =>
  computeLabelLayout(
    props.cx,
    props.cy,
    props.radius,
    labelWidth.value,
    props.labelSide ?? 'below',
  ),
)
</script>

<template>
  <g class="cursor-grab" @pointerdown="emit('grab', $event)">
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
      :x="labelLayout.bg.x"
      :y="labelLayout.bg.y"
      :width="labelLayout.bg.width"
      :height="labelLayout.bg.height"
      :rx="labelLayout.bg.rx"
      :fill="CREAM"
      fill-opacity="0.85"
      pointer-events="none"
    />
    <text
      :x="labelLayout.titleX"
      :y="labelLayout.titleY"
      :text-anchor="labelLayout.anchor"
      :font-size="TITLE_FONT_SIZE"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      {{ name }}
    </text>
    <text
      :x="labelLayout.forcesX"
      :y="labelLayout.forcesY"
      :text-anchor="labelLayout.anchor"
      :font-size="FORCES_FONT_SIZE"
      fill="#3C3530"
      font-family="Inter, sans-serif"
    >
      {{ forcesText }}
    </text>
  </g>
</template>
