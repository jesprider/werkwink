<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ForceDirection, Project } from '../schema/types'
import { forcesByStatus, lookupInProject } from '../composables/trackableLookup'
import {
  allTasksDone,
  isProjectDoneBlocked,
  PROJECT_DONE_BLOCKED_MESSAGE,
  PROJECT_DONE_CLAMP,
} from '../domain/doneRules'
import {
  hasActiveDownForces,
  isPeakCrossingBlocked,
  PEAK_CROSSING_BLOCKED_MESSAGE,
  PEAK_POSITION,
} from '../domain/forceRules'
import { daysWithoutMovement } from '../domain/staleness'
import { parseSourceUrl, sourceOpenLabel } from '../domain/parseSourceUrl'
import { useHillChartStore } from '../stores/hillChart'
import ForceAddForm from './ForceAddForm.vue'
import ForceChip from './ForceChip.vue'
import SourceSystemIcon from './SourceSystemIcon.vue'

const props = defineProps<{
  project: Project
  trackableId: string
  showOpenProject?: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const store = useHillChartStore()

function openProjectView() {
  router.push(`/projects/${props.project.id}`)
}
const editingForceId = ref<string | null>(null)
const addingDirection = ref<ForceDirection | null>(null)
const editingHeader = ref(false)
const draftName = ref('')
const draftLink = ref('')
const nameInvalid = ref(false)
const linkInvalid = ref(false)
const nameRef = ref<HTMLInputElement | null>(null)
const linkRef = ref<HTMLInputElement | null>(null)
const projectDoneAttempted = ref(false)
const peakCrossingAttempted = ref(false)

const lookup = computed(() => lookupInProject(props.project, props.trackableId))
const trackable = computed(() => lookup.value?.trackable ?? null)
const kind = computed(() => lookup.value?.kind ?? null)

watch(
  () => props.trackableId,
  () => {
    editingForceId.value = null
    addingDirection.value = null
    editingHeader.value = false
    projectDoneAttempted.value = false
    peakCrossingAttempted.value = false
  },
)

watch(
  () => trackable.value?.position,
  (position) => {
    if (position !== PROJECT_DONE_CLAMP) projectDoneAttempted.value = false
    if (position !== PEAK_POSITION) peakCrossingAttempted.value = false
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

const atPeak = computed(() => trackable.value?.position === 50)
const hasActiveBlockers = computed(() =>
  trackable.value ? hasActiveDownForces(trackable.value.forces) : false,
)
const showBlockerHint = computed(() => {
  if (!trackable.value || !hasActiveBlockers.value) return false
  return atPeak.value || peakCrossingAttempted.value
})
const showProjectDoneHint = computed(() => {
  if (kind.value !== 'project' || allTasksDone(props.project) || !trackable.value) return false
  return trackable.value.position === PROJECT_DONE_CLAMP || projectDoneAttempted.value
})
const daysWithoutMovementCount = computed(() =>
  trackable.value ? daysWithoutMovement(trackable.value.lastMovedAt, trackable.value.position) : 0,
)
const stalenessLabel = computed(() => {
  const days = daysWithoutMovementCount.value
  if (days === 0) return null
  return days === 1 ? '1 day without movement' : `${days} days without movement`
})

const sourceUrl = computed(() => trackable.value?.source?.url)
const sourceSystem = computed(() => trackable.value?.source?.system)
const sourceAria = computed(() => sourceOpenLabel(sourceSystem.value))

function cancelHeaderEdit() {
  editingHeader.value = false
  nameInvalid.value = false
  linkInvalid.value = false
}

function startHeaderEdit() {
  if (!trackable.value) return
  editingForceId.value = null
  addingDirection.value = null
  draftName.value = trackable.value.name
  draftLink.value = trackable.value.source?.url ?? ''
  nameInvalid.value = false
  linkInvalid.value = false
  editingHeader.value = true
  void nextTick(() => nameRef.value?.focus())
}

function trySaveHeader() {
  if (!trackable.value) return
  const trimmedName = draftName.value.trim()
  if (!trimmedName) {
    nameInvalid.value = true
    nameRef.value?.focus()
    return
  }
  nameInvalid.value = false

  const trimmedLink = draftLink.value.trim()
  if (!trimmedLink) {
    linkInvalid.value = false
    store.updateTrackable(props.trackableId, { name: trimmedName, source: null })
    editingHeader.value = false
    return
  }

  const parsed = parseSourceUrl(trimmedLink)
  if (parsed === 'invalid') {
    linkInvalid.value = true
    linkRef.value?.focus()
    return
  }
  linkInvalid.value = false
  store.updateTrackable(props.trackableId, { name: trimmedName, source: parsed })
  editingHeader.value = false
}

function onHeaderKeydown(event: KeyboardEvent) {
  if (!editingHeader.value) return
  if (event.key === 'Enter') {
    event.preventDefault()
    trySaveHeader()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelHeaderEdit()
  }
}

function onSliderInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (trackable.value) {
    if (isPeakCrossingBlocked(trackable.value.forces, value, trackable.value.position)) {
      peakCrossingAttempted.value = true
    }
    if (kind.value === 'project' && isProjectDoneBlocked(props.project, value)) {
      projectDoneAttempted.value = true
    }
  }
  store.setPosition(props.trackableId, value)
}

function startEdit(forceId: string) {
  addingDirection.value = null
  editingHeader.value = false
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
  editingHeader.value = false
  addingDirection.value = direction
}

function cancelAdd() {
  addingDirection.value = null
}

function onAddSave(direction: ForceDirection, payload: { label: string; owner: string | null }) {
  store.addForce(props.trackableId, direction, payload.label, payload.owner)
  addingDirection.value = null
}

function deleteConfirmMessage(): string {
  if (!trackable.value) return ''
  const name = trackable.value.name
  if (kind.value === 'task') {
    return `Delete "${name}"? This cannot be undone.`
  }
  const taskCount = props.project.tasks.length
  if (taskCount === 0) {
    return `Delete "${name}"? This cannot be undone.`
  }
  const label = taskCount === 1 ? '1 task' : `${taskCount} tasks`
  return `Delete "${name}" and its ${label}? This cannot be undone.`
}

function onDelete() {
  if (!trackable.value) return
  if (!window.confirm(deleteConfirmMessage())) return
  if (kind.value === 'project') {
    store.removeProject(props.project.id)
  } else {
    store.removeTask(props.project.id, props.trackableId)
  }
}
</script>

<template>
  <aside
    v-if="trackable"
    class="w-80 shrink-0 rounded-2xl bg-cream p-5 shadow-sm ring-1 ring-hill-sand/60"
    aria-label="Work item details"
  >
    <div class="mb-6 flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div v-if="editingHeader" class="space-y-2" @keydown="onHeaderKeydown">
          <input
            ref="nameRef"
            v-model="draftName"
            type="text"
            class="w-full rounded-lg border-0 bg-white/80 px-2 py-1 font-heading text-xl outline-none focus:ring-1 focus:ring-terracotta/40"
            :aria-invalid="nameInvalid"
            aria-label="Name"
            @input="nameInvalid = false"
          />
          <input
            ref="linkRef"
            v-model="draftLink"
            type="url"
            placeholder="Paste tracker URL…"
            class="w-full rounded-lg border-0 bg-white/80 px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-terracotta/40"
            :aria-invalid="linkInvalid"
            aria-label="External link"
            @input="linkInvalid = false"
            @blur="trySaveHeader"
          />
          <p v-if="linkInvalid" class="text-xs text-rust">Enter a valid http or https URL.</p>
        </div>
        <div v-else class="flex items-start gap-2">
          <a
            v-if="sourceUrl"
            :href="sourceUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-1 shrink-0 rounded-full p-0.5 text-terracotta hover:bg-hill-sand"
            :aria-label="sourceAria"
          >
            <SourceSystemIcon :system="sourceSystem" />
          </a>
          <button
            type="button"
            class="min-w-0 cursor-text text-left font-heading text-xl leading-tight hover:underline hover:decoration-terracotta/40"
            title="Click to edit name and link"
            @click="startHeaderEdit"
          >
            {{ trackable.name }}
          </button>
        </div>
        <span class="mt-2 inline-block rounded-full bg-hill-sand px-2.5 py-0.5 text-xs capitalize">
          {{ kind }}
        </span>
        <button
          v-if="showOpenProject && kind === 'project'"
          type="button"
          class="mt-3 text-sm font-medium text-terracotta hover:underline"
          aria-label="Open project view"
          @click="openProjectView"
        >
          Open project →
        </button>
      </div>
      <button
        type="button"
        class="rounded-full px-2 py-1 text-sm text-text-warm/60 hover:bg-hill-sand hover:text-text-warm"
        aria-label="Close panel"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <section class="mb-6">
      <h3 class="mb-2 text-xs font-medium tracking-wide text-text-warm/60 uppercase">Position</h3>
      <div class="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="trackable.position"
          class="flex-1 accent-terracotta"
          :aria-valuenow="trackable.position"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Position on hill"
          @input="onSliderInput"
        />
        <span class="w-8 text-right text-lg tabular-nums">{{ trackable.position }}</span>
      </div>
      <p v-if="stalenessLabel" class="mt-1 text-sm text-text-warm/70">{{ stalenessLabel }}</p>
      <p v-if="atPeak" class="mt-1 text-sm text-text-warm/70">At the peak</p>
      <p v-if="showBlockerHint" class="mt-1 text-sm text-text-warm/70">
        {{ PEAK_CROSSING_BLOCKED_MESSAGE }}
      </p>
      <p v-if="showProjectDoneHint" class="mt-1 text-sm text-text-warm/70">
        {{ PROJECT_DONE_BLOCKED_MESSAGE }}
      </p>
    </section>

    <section class="mb-6">
      <h3 class="mb-2 text-xs font-medium tracking-wide text-text-warm/60 uppercase">
        Active up forces
      </h3>
      <ul class="space-y-2">
        <ForceChip
          v-for="force in activeUp"
          :key="force.id"
          :force="force"
          variant="active"
          :is-editing="editingForceId === force.id"
          @edit-start="startEdit(force.id)"
          @save="onSaveEdit(force.id, $event)"
          @cancel="cancelEdit"
          @resolve="onResolve(force.id)"
        />
        <ForceAddForm
          v-if="addingDirection === 'up'"
          @save="onAddSave('up', $event)"
          @cancel="cancelAdd"
        />
      </ul>
      <p v-if="!activeUp.length && addingDirection !== 'up'" class="mb-2 text-sm text-text-warm/50">
        None
      </p>
      <button
        v-if="addingDirection !== 'up'"
        type="button"
        class="mt-2 text-sm text-terracotta hover:underline"
        aria-label="Add up force"
        @click="startAdd('up')"
      >
        + Up force
      </button>
    </section>

    <section class="mb-6">
      <h3 class="mb-2 text-xs font-medium tracking-wide text-text-warm/60 uppercase">
        Active down forces
      </h3>
      <ul class="space-y-2">
        <ForceChip
          v-for="force in activeDown"
          :key="force.id"
          :force="force"
          variant="active"
          :is-editing="editingForceId === force.id"
          @edit-start="startEdit(force.id)"
          @save="onSaveEdit(force.id, $event)"
          @cancel="cancelEdit"
          @resolve="onResolve(force.id)"
        />
        <ForceAddForm
          v-if="addingDirection === 'down'"
          @save="onAddSave('down', $event)"
          @cancel="cancelAdd"
        />
      </ul>
      <p
        v-if="!activeDown.length && addingDirection !== 'down'"
        class="mb-2 text-sm text-text-warm/50"
      >
        None
      </p>
      <button
        v-if="addingDirection !== 'down'"
        type="button"
        class="mt-2 text-sm text-terracotta hover:underline"
        aria-label="Add down force"
        @click="startAdd('down')"
      >
        + Down force
      </button>
    </section>

    <details v-if="pastUp.length" class="mb-4">
      <summary class="cursor-pointer text-sm font-medium">Past boosters</summary>
      <ul class="mt-2 space-y-2">
        <ForceChip
          v-for="force in pastUp"
          :key="force.id"
          :force="force"
          variant="past"
          :is-editing="false"
          @unresolve="onUnresolve(force.id)"
        />
      </ul>
    </details>

    <details v-if="pastDown.length">
      <summary class="cursor-pointer text-sm font-medium">Past blockers</summary>
      <ul class="mt-2 space-y-2">
        <ForceChip
          v-for="force in pastDown"
          :key="force.id"
          :force="force"
          variant="past"
          :is-editing="false"
          @unresolve="onUnresolve(force.id)"
        />
      </ul>
    </details>

    <details class="mt-6 border-t border-hill-sand/60 pt-4">
      <summary class="cursor-pointer text-sm font-medium text-text-warm/70">Danger zone</summary>
      <button
        type="button"
        class="mt-3 rounded-lg border border-rust/30 px-3 py-2 text-sm text-rust hover:bg-rust/5"
        :aria-label="kind === 'project' ? 'Delete project' : 'Delete task'"
        @click="onDelete"
      >
        {{ kind === 'project' ? 'Delete project' : 'Delete task' }}
      </button>
    </details>
  </aside>
</template>
