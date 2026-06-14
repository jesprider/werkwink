<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHillChartStore } from '../stores/hillChart'
import { overviewMarkers, partitionMarkers } from '../domain/chartMarkers'
import AppHeader from '../components/AppHeader.vue'
import DoneStack from '../components/DoneStack.vue'
import HillChart from '../components/HillChart.vue'
import ImportButton from '../components/ImportButton.vue'
import SidePanel from '../components/SidePanel.vue'
import { downloadJson } from '../lib/downloadJson'
import { useChartBlockNudge } from '../composables/useChartBlockNudge'
import { useJsonImport } from '../composables/useJsonImport'

const store = useHillChartStore()
const router = useRouter()
const { projects, demo, canEndDaily: endDailyEnabled } = storeToRefs(store)
const selectedTrackableId = ref<string | null>(null)
const hillChartRef = ref<InstanceType<typeof HillChart> | null>(null)

const {
  importEnabled,
  importErrors,
  isDraggingFile,
  importButtonRef,
  clearErrors,
  onImportClick,
  handleImportFile,
  onDragOver,
  onDragLeave,
  onDrop,
} = useJsonImport(store, {
  onImported: () => {
    selectedTrackableId.value = null
  },
})

const chartMarkers = computed(() => overviewMarkers(projects.value))
const activeMarkers = computed(() => partitionMarkers(chartMarkers.value).active)
const doneMarkers = computed(() => partitionMarkers(chartMarkers.value).done)
const svgRef = computed(() => hillChartRef.value?.svgRef ?? null)
const { chartBlockMessage, maybeNudgeOnMove } = useChartBlockNudge()

const showDemoLabel = computed(() => demo.value && projects.value.length > 0)
const isEmpty = computed(() => projects.value.length === 0)
const exportEnabled = computed(() => projects.value.length > 0)
const cleanEnabled = computed(() => projects.value.length > 0)

const endDailyLabel = ref<'End daily' | 'Saved'>('End daily')

const selectedProject = computed(() =>
  selectedTrackableId.value
    ? projects.value.find((p) => p.id === selectedTrackableId.value)
    : undefined,
)

watchEffect(() => {
  if (!selectedTrackableId.value) return
  if (!projects.value.some((p) => p.id === selectedTrackableId.value)) {
    selectedTrackableId.value = null
  }
})

function onMove(id: string, position: number) {
  const proj = projects.value.find((p) => p.id === id)
  maybeNudgeOnMove(proj, proj, id, position)
  store.setPosition(id, position)
}

function onOpen(id: string) {
  router.push(`/projects/${id}`)
}

function onTrackableClick(id: string) {
  selectedTrackableId.value = selectedTrackableId.value === id ? null : id
}

function onAddProject() {
  const id = store.addProject()
  selectedTrackableId.value = id
}

function onExportClick() {
  if (!exportEnabled.value) return
  const state = store.exportState()
  const ts = state.exportedAt!.replace(/[:.]/g, '')
  downloadJson(`werkwink-${ts}.json`, state)
}

function onCleanClick() {
  if (!cleanEnabled.value) return
  const ok = window.confirm('This will delete all projects, tasks, and history. Export first?')
  if (!ok) return
  store.cleanState()
  selectedTrackableId.value = null
  clearErrors()
}

function onEndDailyClick() {
  store.endDaily()
  endDailyLabel.value = 'Saved'
  setTimeout(() => {
    endDailyLabel.value = 'End daily'
  }, 2000)
}
</script>

<template>
  <AppHeader
    :import-enabled="importEnabled"
    :export-enabled="exportEnabled"
    :clean-enabled="cleanEnabled"
    :end-daily-enabled="endDailyEnabled"
    :end-daily-label="endDailyLabel"
    @add-project="onAddProject"
    @import-click="onImportClick"
    @export-click="onExportClick"
    @clean-click="onCleanClick"
    @end-daily-click="onEndDailyClick"
  />
  <ImportButton ref="importButtonRef" :enabled="importEnabled" @file-selected="handleImportFile" />

  <p v-if="showDemoLabel" class="px-6 pb-2 text-sm text-text-warm/70">
    <span class="rounded-full bg-hill-sand px-3 py-1">Demo data</span>
  </p>

  <div
    v-if="importErrors.length"
    role="alert"
    class="mx-6 mb-4 rounded-lg border border-rust/30 bg-rust/10 px-4 py-3 text-sm text-rust"
  >
    <ul class="list-disc pl-5">
      <li v-for="(err, i) in importErrors" :key="i">{{ err }}</li>
    </ul>
  </div>

  <section class="px-6 py-6">
    <div
      v-if="isEmpty"
      class="mx-auto flex max-w-lg flex-col items-center gap-6 rounded-2xl border border-dashed border-hill-sand bg-hill-sand/30 px-8 py-16 text-center"
      :class="isDraggingFile && 'ring-2 ring-terracotta/40'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <h2 class="font-heading text-2xl">Your hill chart is empty</h2>
      <p class="text-sm text-text-warm/80">
        Import a JSON export from your tracker skill, or add a project manually.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          class="rounded-full bg-terracotta px-5 py-2.5 text-sm text-cream transition-opacity hover:opacity-90"
          @click="onImportClick"
        >
          Import JSON
        </button>
        <button
          type="button"
          class="rounded-full bg-hill-sand px-5 py-2.5 text-sm text-text-warm transition-opacity hover:opacity-90"
          @click="onAddProject"
        >
          + Add your first project
        </button>
      </div>
      <RouterLink to="/" class="text-sm text-text-warm/70 underline hover:text-text-warm">
        New here? Read what this app is →
      </RouterLink>
    </div>

    <div
      v-else
      class="mx-auto flex max-w-[1400px] items-start gap-6"
      :class="isDraggingFile && 'rounded-2xl ring-2 ring-terracotta/40'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
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
          @move="onMove"
          @open="onOpen"
          @click="onTrackableClick"
        />
        <DoneStack
          :done-markers="doneMarkers"
          :selected-id="selectedTrackableId"
          :svg-ref="svgRef"
          @move="onMove"
          @click="onTrackableClick"
        />
      </div>
      <SidePanel
        v-if="selectedProject && selectedTrackableId"
        :project="selectedProject"
        :trackable-id="selectedTrackableId"
        show-open-project
        @close="selectedTrackableId = null"
      />
    </div>
  </section>
</template>
