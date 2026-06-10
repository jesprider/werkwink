<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ChartMarker } from '../composables/chartMarkers'
import { useHillDrag } from '../composables/useHillDrag'
import { DONE_POSITION } from '../domain/staleness'

const props = defineProps<{
  doneMarkers: ChartMarker[]
  selectedId?: string | null
  svgRef: SVGSVGElement | null
}>()

const emit = defineEmits<{
  (e: 'move', id: string, position: number): void
  (e: 'click', id: string): void
}>()

const STACK_DOT_PX = 24

const expanded = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const count = computed(() => props.doneMarkers.length)
const previewMarkers = computed(() => props.doneMarkers.slice(0, 3))

const { startDrag } = useHillDrag({
  getSvg: () => props.svgRef,
  clickable: () => true,
  onMove: (id, position) => {
    if (position < DONE_POSITION) {
      emit('move', id, position)
    }
  },
  onClick: (id) => emit('click', id),
})

function toggleExpanded() {
  expanded.value = !expanded.value
}

function onDocumentClick(ev: MouseEvent) {
  if (!expanded.value) return
  const root = rootRef.value
  if (root && !root.contains(ev.target as Node)) {
    expanded.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

function isSelected(id: string): boolean {
  return props.selectedId === id
}

function dotChipClass(id: string): string {
  return isSelected(id) ? 'ring-2 ring-terracotta/60' : 'ring-2 ring-cream'
}
</script>

<template>
  <div
    v-if="count > 0"
    ref="rootRef"
    data-testid="done-stack"
    class="absolute right-4 bottom-4 z-10 max-w-[220px]"
  >
    <!-- N = 1: single dot only -->
    <div
      v-if="count === 1"
      class="cursor-grab rounded-full"
      :class="dotChipClass(doneMarkers[0]!.id)"
      :style="{
        width: `${STACK_DOT_PX}px`,
        height: `${STACK_DOT_PX}px`,
        backgroundColor: doneMarkers[0]!.color,
      }"
      @pointerdown.stop="startDrag(doneMarkers[0]!.id, $event)"
      @click.stop
    />

    <!-- N ≥ 2: collapsed header + optional expanded list -->
    <template v-else>
      <div class="flex cursor-pointer items-center gap-2" @click="toggleExpanded">
        <div class="flex shrink-0 items-center">
          <div
            v-for="(marker, index) in previewMarkers"
            :key="marker.id"
            class="cursor-grab rounded-full"
            :class="[dotChipClass(marker.id), index > 0 && '-ml-2']"
            :style="{
              width: `${STACK_DOT_PX}px`,
              height: `${STACK_DOT_PX}px`,
              backgroundColor: marker.color,
              zIndex: previewMarkers.length - index,
            }"
            @pointerdown.stop="startDrag(marker.id, $event)"
            @click.stop
          />
        </div>
        <span
          class="shrink-0 rounded-full bg-hill-sand/80 px-2.5 py-1 text-xs text-terracotta ring-1 ring-terracotta/30"
          @click.stop="toggleExpanded"
        >
          + {{ count }} more
        </span>
      </div>

      <ul v-if="expanded" class="mt-2 flex flex-col gap-1">
        <li
          v-for="marker in doneMarkers"
          :key="marker.id"
          class="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 hover:bg-hill-sand/40"
          :class="isSelected(marker.id) && 'ring-2 ring-terracotta/60'"
          @click="emit('click', marker.id)"
        >
          <div
            class="shrink-0 cursor-grab rounded-full"
            :class="dotChipClass(marker.id)"
            :style="{
              width: `${STACK_DOT_PX}px`,
              height: `${STACK_DOT_PX}px`,
              backgroundColor: marker.color,
            }"
            @pointerdown.stop="startDrag(marker.id, $event)"
            @click.stop
          />
          <span class="max-w-[140px] truncate text-sm">{{ marker.name }}</span>
          <span class="ml-auto shrink-0 text-xs text-text-warm/60">
            ↑{{ marker.up }} ↓{{ marker.down }}
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
