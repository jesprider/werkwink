<script setup lang="ts">
import type { ChartMarker } from '../domain/chartMarkers'

defineProps<{
  doneMarkers: ChartMarker[]
}>()

const emit = defineEmits<{
  click: [id: string]
  restore: [id: string]
}>()

const DOT_PX = 24
</script>

<template>
  <aside
    class="relative w-80 shrink-0 rounded-2xl bg-cream p-5 shadow-sm ring-1 ring-hill-sand/60"
    aria-label="Completed work"
    data-testid="done-panel"
  >
    <header class="mb-4">
      <h2 class="font-heading text-xl text-text-warm">Done</h2>
      <p class="text-sm text-text-warm/60">{{ doneMarkers.length }} completed</p>
    </header>

    <ul class="max-h-[calc(100vh-12rem)] space-y-0.5 overflow-y-auto">
      <li
        v-for="marker in doneMarkers"
        :key="marker.id"
        class="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-hill-sand/40"
        @click="emit('click', marker.id)"
      >
        <div
          class="shrink-0 rounded-full ring-2 ring-cream"
          :style="{
            width: `${DOT_PX}px`,
            height: `${DOT_PX}px`,
            backgroundColor: marker.color,
          }"
        />
        <span class="min-w-0 flex-1 truncate text-sm">{{ marker.name }}</span>
        <button
          type="button"
          class="shrink-0 text-xs text-text-warm/60 opacity-0 transition-opacity group-hover:opacity-100 hover:text-text-warm"
          data-testid="restore"
          aria-label="Restore to hill"
          @click.stop="emit('restore', marker.id)"
        >
          ↩ Restore
        </button>
      </li>
    </ul>
  </aside>
</template>
