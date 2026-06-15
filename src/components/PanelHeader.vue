<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { HillTrackable } from '../schema/types'
import type { TrackableKind } from '../domain/trackableLookup'
import { parseSourceUrl, sourceOpenLabel } from '../domain/parseSourceUrl'
import { onInlineEditFocusOut, onInlineEditKeydown } from '../lib/inlineEditHandlers'
import { useHillChartStore } from '../stores/hillChart'
import SourceSystemIcon from './SourceSystemIcon.vue'

const props = defineProps<{
  trackable: HillTrackable
  kind: TrackableKind
  projectId: string
  showOpenProject?: boolean
}>()

const router = useRouter()
const store = useHillChartStore()

const editing = ref(false)
const draftName = ref('')
const draftLink = ref('')
const nameInvalid = ref(false)
const linkInvalid = ref(false)
const nameRef = ref<HTMLInputElement | null>(null)
const linkRef = ref<HTMLInputElement | null>(null)

const sourceUrl = computed(() => props.trackable.source?.url)
const sourceSystem = computed(() => props.trackable.source?.system)
const sourceAria = computed(() => sourceOpenLabel(sourceSystem.value))

function openProjectView() {
  router.push(`/projects/${props.projectId}`)
}

function cancelEdit() {
  editing.value = false
  nameInvalid.value = false
  linkInvalid.value = false
}

function startEdit() {
  draftName.value = props.trackable.name
  draftLink.value = props.trackable.source?.url ?? ''
  nameInvalid.value = false
  linkInvalid.value = false
  editing.value = true
  void nextTick(() => nameRef.value?.focus())
}

function saveEdit() {
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
    store.updateTrackable(props.trackable.id, { name: trimmedName, source: null })
    editing.value = false
    return
  }

  const parsed = parseSourceUrl(trimmedLink)
  if (parsed === 'invalid') {
    linkInvalid.value = true
    linkRef.value?.focus()
    return
  }
  linkInvalid.value = false
  store.updateTrackable(props.trackable.id, { name: trimmedName, source: parsed })
  editing.value = false
}

function onEditKeydown(event: KeyboardEvent) {
  onInlineEditKeydown(event, { save: saveEdit, cancel: cancelEdit })
}

function onEditFocusOut(event: FocusEvent) {
  onInlineEditFocusOut(event, { cancel: cancelEdit })
}

defineExpose({ cancelEdit })
</script>

<template>
  <div class="min-w-0 flex-1">
    <div v-if="editing" class="space-y-2" @keydown="onEditKeydown" @focusout="onEditFocusOut">
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
        @click="startEdit"
      >
        {{ trackable.name }}
      </button>
    </div>
    <span class="mt-2 mr-2 inline-block rounded-full bg-hill-sand px-2.5 py-0.5 text-xs capitalize">
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
</template>
