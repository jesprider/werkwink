<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Force, ForceDirection } from '../schema/types'
import { onInlineEditFocusOut, onInlineEditKeydown } from '../lib/inlineEditHandlers'

const props = defineProps<{
  force: Force
  direction?: ForceDirection
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
const labelRef = ref<HTMLInputElement | null>(null)

const showResolve = computed(() => props.variant === 'active' && !props.force.isPrimary)

const isDown = computed(() => props.direction === 'down')

const displayPillShell = 'flex min-h-9 min-w-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm'
const editPillShell = 'flex h-9 min-w-0 items-center gap-2 rounded-full px-3 text-sm'

const pastChipClass = computed(() =>
  isDown.value
    ? `${displayPillShell} bg-force-down/10 text-text-warm/65 transition-colors hover:bg-force-down/15`
    : `${displayPillShell} bg-force-up/12 text-text-warm/65 transition-colors hover:bg-force-up/18`,
)

const activeChipClass = computed(() =>
  isDown.value
    ? `group ${displayPillShell} bg-force-down/12 ring-1 ring-force-down/20`
    : `group ${displayPillShell} bg-force-up/15 ring-1 ring-force-up/25`,
)

const editingChipClass = computed(() =>
  isDown.value
    ? `flex-wrap ${editPillShell} bg-force-down/12 ring-1 ring-force-down/30`
    : `flex-wrap ${editPillShell} bg-force-up/15 ring-1 ring-force-up/35`,
)

const inputClass =
  'h-6 flex-1 rounded-full border-0 bg-white/80 px-2 text-sm leading-none outline-none focus:ring-1'

const labelInputClass = computed(() =>
  isDown.value
    ? `${inputClass} min-w-[6rem] focus:ring-force-down/40`
    : `${inputClass} min-w-[6rem] focus:ring-force-up/40`,
)

const ownerInputClass = computed(() =>
  isDown.value
    ? `${inputClass} min-w-[5rem] focus:ring-force-down/40`
    : `${inputClass} min-w-[5rem] focus:ring-force-up/40`,
)

const resolveButtonClass = computed(() =>
  isDown.value
    ? 'flex size-6 shrink-0 items-center justify-center rounded-full leading-none text-force-down/75 transition-colors hover:bg-force-down/15 hover:text-force-down'
    : 'flex size-6 shrink-0 items-center justify-center rounded-full leading-none text-force-up/85 transition-colors hover:bg-force-up/22 hover:text-force-up',
)

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

function saveEdit() {
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

function cancelEdit() {
  emit('cancel')
}

function onDisplayClick() {
  if (props.variant !== 'active') return
  emit('edit-start')
}

function onPastClick() {
  emit('unresolve')
}

function onEditKeydown(event: KeyboardEvent) {
  onInlineEditKeydown(event, {
    save: saveEdit,
    cancel: cancelEdit,
    active: () => props.isEditing,
  })
}

function onEditFocusOut(event: FocusEvent) {
  onInlineEditFocusOut(event, {
    cancel: cancelEdit,
    active: () => props.isEditing,
  })
}

function onResolveClick(event: MouseEvent) {
  event.stopPropagation()
  emit('resolve')
}
</script>

<template>
  <li
    v-if="variant === 'past'"
    :class="pastChipClass"
    role="button"
    tabindex="0"
    :aria-label="`Restore ${force.label} to active`"
    title="Click to restore"
    @click="onPastClick"
    @keydown.enter="onPastClick"
    @keydown.space.prevent="onPastClick"
  >
    <span class="min-w-0 text-left">
      {{ force.label
      }}<span v-if="force.owner" class="text-text-warm/60"> · {{ force.owner }}</span>
    </span>
  </li>

  <li
    v-else-if="isEditing"
    :class="editingChipClass"
    @keydown="onEditKeydown"
    @focusout="onEditFocusOut"
  >
    <input
      ref="labelRef"
      v-model="draftLabel"
      type="text"
      :class="labelInputClass"
      :aria-invalid="labelInvalid"
      aria-label="Force label"
      @input="labelInvalid = false"
    />
    <input
      v-model="draftOwner"
      type="text"
      placeholder="Owner"
      :class="ownerInputClass"
      aria-label="Force owner"
    />
    <span v-if="force.isPrimary" class="text-xs text-text-warm/60">(primary)</span>
  </li>

  <li v-else :class="activeChipClass">
    <button
      type="button"
      class="min-w-0 flex-1 cursor-text text-left"
      title="Click to edit"
      @click="onDisplayClick"
    >
      <span
        class="group-hover:underline"
        :class="
          isDown ? 'group-hover:decoration-force-down/40' : 'group-hover:decoration-force-up/40'
        "
        >{{ force.label }}</span
      >
      <span v-if="force.owner" class="text-text-warm/70"> · {{ force.owner }}</span>
      <span v-if="force.isPrimary" class="ml-1 text-xs text-text-warm/60">(primary)</span>
    </button>
    <button
      v-if="showResolve"
      type="button"
      :class="resolveButtonClass"
      aria-label="Resolve force"
      @click="onResolveClick"
    >
      ✓
    </button>
  </li>
</template>
