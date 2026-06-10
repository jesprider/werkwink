<script setup lang="ts">
import { useHillCurve } from '../composables/useHillCurve'
import type { TrailGhost } from '../composables/chartMarkers'

defineProps<{
  ghosts: TrailGhost[]
  radius: number
  color: string
}>()

const { curveX, curveY } = useHillCurve()
</script>

<template>
  <g pointer-events="none">
    <circle
      v-for="(g, i) in ghosts"
      :key="i"
      :cx="curveX(g.position)"
      :cy="curveY(g.position)"
      :r="radius"
      :fill="color"
      :fill-opacity="g.opacity"
      stroke="#FDFAF4"
      stroke-width="1"
      stroke-opacity="0.5"
    />
  </g>
</template>
