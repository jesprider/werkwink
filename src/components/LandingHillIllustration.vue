<script setup lang="ts">
import { CHART, chartViewBox, curvePath, curveX, curveY } from '../lib/hillCurve'
import { PALETTE } from '../schema/palette'

const DEMO_POSITION = 28
const DEMO_RADIUS = 20
const UPHILL_LABEL_POS = 16
const DOWNHILL_LABEL_POS = 84
const LABEL_FONT_SIZE = 22
const LABEL_GAP = 18
const CHAR_WIDTH = 11

const UPHILL_TEXT = 'Figuring it out'
const DOWNHILL_TEXT = 'Making it happen'

const path = curvePath()
const dotCx = curveX(DEMO_POSITION)
const dotCy = curveY(DEMO_POSITION)
const dotColor = PALETTE.terracotta

function xToPosition(svgX: number): number {
  return Math.min(100, Math.max(0, (svgX / CHART.width) * 100))
}

/** Highest point of the curve (smallest y) across a label's horizontal span. */
function peakCurveYInSpan(centerX: number, text: string): number {
  const halfW = (text.length * CHAR_WIDTH) / 2
  let minY = Infinity
  for (let x = centerX - halfW; x <= centerX + halfW; x += 2) {
    minY = Math.min(minY, curveY(xToPosition(x)))
  }
  return minY
}

function labelAboveCurve(position: number, text: string) {
  const x = curveX(position)
  const peakY = peakCurveYInSpan(x, text)
  const descender = 5
  return {
    x,
    y: peakY - LABEL_GAP - descender,
    fontSize: LABEL_FONT_SIZE,
  }
}

const uphillLabel = labelAboveCurve(UPHILL_LABEL_POS, UPHILL_TEXT)
const downhillLabel = labelAboveCurve(DOWNHILL_LABEL_POS, DOWNHILL_TEXT)
</script>

<template>
  <svg
    :viewBox="chartViewBox()"
    class="mx-auto h-auto w-full max-w-2xl select-none"
    role="img"
    aria-label="Hill curve: figuring it out on the uphill, making it happen on the downhill"
  >
    <path :d="path" fill="none" stroke="#D9C9A8" stroke-width="3" />

    <text
      :x="uphillLabel.x"
      :y="uphillLabel.y"
      text-anchor="middle"
      font-family="Inter, sans-serif"
      :font-size="uphillLabel.fontSize"
      font-weight="500"
      fill="#3C3530"
      fill-opacity="0.85"
    >
      {{ UPHILL_TEXT }}
    </text>

    <text
      :x="downhillLabel.x"
      :y="downhillLabel.y"
      text-anchor="middle"
      font-family="Inter, sans-serif"
      :font-size="downhillLabel.fontSize"
      font-weight="500"
      fill="#3C3530"
      fill-opacity="0.85"
    >
      {{ DOWNHILL_TEXT }}
    </text>

    <circle
      :cx="dotCx"
      :cy="dotCy"
      :r="DEMO_RADIUS"
      :fill="dotColor"
      stroke="#FDFAF4"
      stroke-width="2.5"
    />
  </svg>
</template>
