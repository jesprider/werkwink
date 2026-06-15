<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ForceDirection, Project } from '../schema/types'
import { forcesByStatus, lookupInProject } from '../domain/trackableLookup'
import { useHillChartStore } from '../stores/hillChart'
import PanelFooter from './PanelFooter.vue'
import PanelForces from './PanelForces.vue'
import PanelHeader from './PanelHeader.vue'
import PanelPosition from './PanelPosition.vue'

const props = defineProps<{
  project: Project
  trackableId: string
  showOpenProject?: boolean
}>()

defineEmits<{
  close: []
}>()

const store = useHillChartStore()
const headerRef = ref<InstanceType<typeof PanelHeader> | null>(null)
const editingForceId = ref<string | null>(null)
const addingDirection = ref<ForceDirection | null>(null)

const lookup = computed(() => lookupInProject(props.project, props.trackableId))
const trackable = computed(() => lookup.value?.trackable ?? null)
const kind = computed(() => lookup.value?.kind ?? null)

watch(
  () => props.trackableId,
  () => {
    editingForceId.value = null
    addingDirection.value = null
    headerRef.value?.cancelEdit()
  },
)

const activeUp = computed(() =>
  trackable.value ? forcesByStatus(trackable.value.forces, 'up', 'active') : [],
)
const activeDown = computed(() =>
  trackable.value ? forcesByStatus(trackable.value.forces, 'down', 'active') : [],
)
const pastUp = computed(() =>
  trackable.value ? forcesByStatus(trackable.value.forces, 'up', 'resolved') : [],
)
const pastDown = computed(() =>
  trackable.value ? forcesByStatus(trackable.value.forces, 'down', 'resolved') : [],
)

function startEdit(forceId: string) {
  addingDirection.value = null
  headerRef.value?.cancelEdit()
  editingForceId.value = forceId
}

function cancelEdit() {
  editingForceId.value = null
}

function onSaveEdit(forceId: string, payload: { label: string; owner: string | null }) {
  store.updateForce(props.trackableId, forceId, payload)
  editingForceId.value = null
}

function onResolve(forceId: string) {
  store.resolveForce(props.trackableId, forceId)
}

function onUnresolve(forceId: string) {
  store.unresolveForce(props.trackableId, forceId)
}

function startAdd(direction: ForceDirection) {
  editingForceId.value = null
  headerRef.value?.cancelEdit()
  addingDirection.value = direction
}

function cancelAdd() {
  addingDirection.value = null
}

function onAddSave(direction: ForceDirection, payload: { label: string; owner: string | null }) {
  store.addForce(props.trackableId, direction, payload.label, payload.owner)
  addingDirection.value = null
}
</script>

<template>
  <aside
    v-if="trackable && kind"
    class="relative w-80 shrink-0 rounded-2xl bg-cream p-5 pb-12 shadow-sm ring-1 ring-hill-sand/60"
    aria-label="Work item details"
  >
    <div class="mb-6 flex items-start justify-between gap-3">
      <PanelHeader
        ref="headerRef"
        :trackable="trackable"
        :kind="kind"
        :project-id="project.id"
        :show-open-project="showOpenProject"
      />
      <button
        type="button"
        class="shrink-0 rounded px-2 py-1 text-sm text-text-warm/60 hover:bg-hill-sand hover:text-text-warm"
        title="Close panel"
        aria-label="Close panel"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <PanelPosition :trackable="trackable" :kind="kind" :project="project" />

    <PanelForces
      direction="up"
      :active-forces="activeUp"
      :past-forces="pastUp"
      :editing-force-id="editingForceId"
      :is-adding="addingDirection === 'up'"
      @edit-start="startEdit"
      @save-edit="onSaveEdit"
      @cancel-edit="cancelEdit"
      @resolve="onResolve"
      @unresolve="onUnresolve"
      @add-start="startAdd('up')"
      @add-save="onAddSave('up', $event)"
      @add-cancel="cancelAdd"
    />

    <PanelForces
      direction="down"
      :active-forces="activeDown"
      :past-forces="pastDown"
      :editing-force-id="editingForceId"
      :is-adding="addingDirection === 'down'"
      @edit-start="startEdit"
      @save-edit="onSaveEdit"
      @cancel-edit="cancelEdit"
      @resolve="onResolve"
      @unresolve="onUnresolve"
      @add-start="startAdd('down')"
      @add-save="onAddSave('down', $event)"
      @add-cancel="cancelAdd"
    />

    <PanelFooter :trackable="trackable" :kind="kind" :project="project" />
  </aside>
</template>
