<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useHillChartStore } from '../stores/hillChart'
import { markersForProject, partitionMarkersForProjectView } from '../domain/chartMarkers'
import ChartWorkspace from '../components/ChartWorkspace.vue'
import { PEAK_POSITION } from '../domain/forceRules'
import { lookupInProject } from '../domain/trackableLookup'
import { useChartSelection } from '../composables/useChartSelection'

const props = defineProps<{ id: string }>()

const store = useHillChartStore()
const router = useRouter()
const { projects } = storeToRefs(store)

const project = computed(() => projects.value.find((p) => p.id === props.id))
const chartMarkers = computed(() => (project.value ? markersForProject(project.value) : []))
const partitioned = computed(() =>
  project.value
    ? partitionMarkersForProjectView(chartMarkers.value, project.value.id)
    : { active: [], done: [] },
)
const activeMarkers = computed(() => partitioned.value.active)
const doneMarkers = computed(() => partitioned.value.done)
const markerIds = computed(() => chartMarkers.value.map((m) => m.id))

const { selectedTrackableId, chartBlockMessage, onMove, onTrackableClick, clearSelection } =
  useChartSelection({
    validIds: markerIds,
    applyPosition: (id, position) => store.setPosition(id, position),
    nudgeContextForMove: (id) => {
      if (!project.value) return { trackable: undefined, project: undefined }
      const lookup = lookupInProject(project.value, id)
      return { trackable: lookup?.trackable, project: project.value }
    },
  })

watchEffect(() => {
  if (!project.value) router.replace('/projects')
})

function onAddTask() {
  const id = store.addTask(props.id)
  if (id) selectedTrackableId.value = id
}

function onRestore(id: string) {
  store.setPosition(id, PEAK_POSITION)
}
</script>

<template>
  <header v-if="project" class="px-6 py-4">
    <RouterLink to="/projects" class="text-sm text-text-warm/80 hover:text-text-warm">
      ← Overview
    </RouterLink>
    <h1 class="mt-1 font-heading text-3xl">{{ project.name }}</h1>
  </header>
  <section v-if="project" class="px-6 pb-6">
    <ChartWorkspace
      add-label="Add task"
      :active-markers="activeMarkers"
      :done-markers="doneMarkers"
      :selected-trackable-id="selectedTrackableId"
      :panel-project="project"
      :chart-block-message="chartBlockMessage"
      @move="onMove"
      @click="onTrackableClick"
      @close-panel="clearSelection"
      @add="onAddTask"
      @restore="onRestore"
    />
  </section>
</template>
