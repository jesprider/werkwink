<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Force } from '../schema/types'

const props = defineProps<{
  force: Force
  variant: 'active' | 'past'
  isEditing: boolean
}>()

const emit = defineEmits<{
  'edit-start': []
  save: [payload: { label: string; owner: string | null }]
  cancel: []
  resolve: []
  unresolve: []
}>()

const draftLabel = ref('')
const draftOwner = ref('')
const labelInvalid = ref(false)
const ownerRef = ref<HTMLInputElement | null>(null)
const labelRef = ref<HTMLInputElement | null>(null)

const showResolve = computed(() => props.variant === 'active' && !props.force.isPrimary)

watch(
  () => props.isEditing,
  (editing) => {
    if (editing) {
      draftLabel.value = props.force.label
      draftOwner.value = props.force.owner ?? ''
      labelInvalid.value = false
      void nextTick(() => labelRef.value?.focus())
    }
  },
)

function trySave() {
  const trimmed = draftLabel.value.trim()
  if (!trimmed) {
    labelInvalid.value = true
    labelRef.value?.focus()
    return
  }
  labelInvalid.value = false
  const ownerTrimmed = draftOwner.value.trim()
  emit('save', { label: trimmed, owner: ownerTrimmed || null })
}

function onDisplayClick() {
  if (props.variant !== 'active') return
  emit('edit-start')
}

function onPastClick() {
  emit('unresolve')
}

function onKeydown(event: KeyboardEvent) {
  if (!props.isEditing) return
  if (event.key === 'Enter') {
    event.preventDefault()
    trySave()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
  }
}

function onResolveClick(event: MouseEvent) {
  event.stopPropagation()
  emit('resolve')
}
</script>

<template>
  <li
    v-if="variant === 'past'"
    class="cursor-pointer rounded-full bg-hill-sand/40 px-3 py-1.5 text-sm text-text-warm/70 transition-colors hover:bg-hill-sand/60"
    role="button"
    tabindex="0"
    :aria-label="`Restore ${force.label} to active`"
    title="Click to restore"
    @click="onPastClick"
    @keydown.enter="onPastClick"
    @keydown.space.prevent="onPastClick"
  >
    {{ force.label }}
    <span v-if="force.owner" class="text-text-warm/60"> · {{ force.owner }}</span>
  </li>

  <li
    v-else-if="isEditing"
    class="flex flex-wrap items-center gap-2 rounded-full bg-hill-sand/70 px-3 py-1.5 text-sm ring-1 ring-terracotta/30"
    @keydown="onKeydown"
  >
    <input
      ref="labelRef"
      v-model="draftLabel"
      type="text"
      class="min-w-[6rem] flex-1 rounded-full border-0 bg-white/80 px-2 py-0.5 outline-none focus:ring-1 focus:ring-terracotta/40"
      :aria-invalid="labelInvalid"
      aria-label="Force label"
      @input="labelInvalid = false"
    />
    <input
      ref="ownerRef"
      v-model="draftOwner"
      type="text"
      placeholder="Owner"
      class="min-w-[5rem] flex-1 rounded-full border-0 bg-white/80 px-2 py-0.5 outline-none focus:ring-1 focus:ring-terracotta/40"
      aria-label="Force owner"
      @blur="trySave"
    />
    <span v-if="force.isPrimary" class="text-xs text-text-warm/60">(primary)</span>
  </li>

  <li v-else class="group flex items-center gap-2 rounded-full bg-hill-sand/70 px-3 py-1.5 text-sm">
    <button
      type="button"
      class="min-w-0 flex-1 cursor-text text-left"
      title="Click to edit"
      @click="onDisplayClick"
    >
      <span class="group-hover:underline group-hover:decoration-terracotta/40">{{
        force.label
      }}</span>
      <span v-if="force.owner" class="text-text-warm/70"> · {{ force.owner }}</span>
      <span v-if="force.isPrimary" class="ml-1 text-xs text-text-warm/60">(primary)</span>
    </button>
    <button
      v-if="showResolve"
      type="button"
      class="shrink-0 rounded-full px-1.5 py-0.5 text-text-warm/60 hover:bg-hill-sand hover:text-olive"
      aria-label="Resolve force"
      @click="onResolveClick"
    >
      ✓
    </button>
  </li>
</template>
