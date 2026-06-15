<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHillChartStore } from '../stores/hillChart'
import { overviewMarkers, partitionMarkers } from '../domain/chartMarkers'
import AppHeader from '../components/AppHeader.vue'
import StateControls from '../components/StateControls.vue'
import ChartWorkspace from '../components/ChartWorkspace.vue'
import ImportButton from '../components/ImportButton.vue'
import { downloadJson } from '../lib/downloadJson'
import { useChartSelection } from '../composables/useChartSelection'
import { useJsonImport } from '../composables/useJsonImport'

const store = useHillChartStore()
const router = useRouter()
const { projects, demo, canEndDaily: endDailyEnabled } = storeToRefs(store)

const chartMarkers = computed(() => overviewMarkers(projects.value))
const activeMarkers = computed(() => partitionMarkers(chartMarkers.value).active)
const doneMarkers = computed(() => partitionMarkers(chartMarkers.value).done)
const overviewProjectIds = computed(() => projects.value.map((p) => p.id))

const { selectedTrackableId, chartBlockMessage, onMove, onTrackableClick, clearSelection } =
  useChartSelection({
    validIds: overviewProjectIds,
    applyPosition: (id, position) => store.setPosition(id, position),
    nudgeContextForMove: (id) => {
      const proj = projects.value.find((p) => p.id === id)
      return { trackable: proj, project: proj }
    },
  })

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
  onImported: clearSelection,
})

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

function onOpen(id: string) {
  router.push(`/projects/${id}`)
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
  const ok = globalThis.confirm('This will delete all projects, tasks, and history. Export first?')
  if (!ok) return
  store.cleanState()
  clearSelection()
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
    :end-daily-enabled="endDailyEnabled"
    :end-daily-label="endDailyLabel"
    :show-demo-label="showDemoLabel"
    @end-daily-click="onEndDailyClick"
  />
  <StateControls
    class="fixed right-5 bottom-5 z-30"
    :import-enabled="importEnabled"
    :export-enabled="exportEnabled"
    :clean-enabled="cleanEnabled"
    @import-click="onImportClick"
    @export-click="onExportClick"
    @clean-click="onCleanClick"
  />
  <ImportButton ref="importButtonRef" :enabled="importEnabled" @file-selected="handleImportFile" />

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
      :class="isDraggingFile && 'rounded-2xl ring-2 ring-terracotta/40'"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <ChartWorkspace
        add-label="+ Project"
        :active-markers="activeMarkers"
        :done-markers="doneMarkers"
        :selected-trackable-id="selectedTrackableId"
        :panel-project="selectedProject"
        :chart-block-message="chartBlockMessage"
        show-open-project
        @move="onMove"
        @click="onTrackableClick"
        @open="onOpen"
        @close-panel="clearSelection"
        @add="onAddProject"
      />
    </div>
  </section>
</template>
