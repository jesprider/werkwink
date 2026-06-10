<script setup lang="ts">
import { useHillCurve } from '../composables/useHillCurve'
import { PALETTE } from '../schema/palette'

const DEMO_POSITION = 28
const DEMO_RADIUS = 16

const { CHART, curvePath, curveX, curveY } = useHillCurve()

const path = curvePath()
const baseline = CHART.height - CHART.bottomPad
const dotCx = curveX(DEMO_POSITION)
const dotCy = curveY(DEMO_POSITION)
const dotColor = PALETTE.terracotta

const labelStyle = {
  fontSize: 14,
  fill: '#3C3530',
  fillOpacity: 0.65,
  fontFamily: 'Inter, sans-serif',
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${CHART.width} ${CHART.height}`"
    class="mx-auto h-auto w-full max-w-xl select-none"
    role="img"
    aria-label="Hill curve: uphill on the left, downhill on the right, peak in the center"
  >
    <path
      :d="`${path} L ${CHART.width} ${baseline} L 0 ${baseline} Z`"
      fill="#E8D9BD"
      opacity="0.45"
    />
    <path :d="path" fill="none" stroke="#E8D9BD" stroke-width="3" />
    <line
      :x1="0"
      :y1="baseline"
      :x2="CHART.width"
      :y2="baseline"
      stroke="#E8D9BD"
      stroke-width="2"
    />

    <text :x="120" :y="baseline - 12" text-anchor="start" v-bind="labelStyle">
      Uphill — figuring it out
    </text>
    <text :x="700" :y="baseline - 12" text-anchor="start" v-bind="labelStyle">
      Downhill — execution
    </text>

    <circle
      :cx="dotCx"
      :cy="dotCy"
      :r="DEMO_RADIUS"
      :fill="dotColor"
      stroke="#FDFAF4"
      stroke-width="2"
    />
  </svg>
</template>
