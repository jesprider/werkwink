<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type { ForceDirection } from '../schema/types'
import { onInlineEditFocusOut, onInlineEditKeydown } from '../lib/inlineEditHandlers'

const props = defineProps<{
  direction: ForceDirection
}>()

const emit = defineEmits<{
  save: [payload: { label: string; owner: string | null }]
  cancel: []
}>()

const label = ref('')
const owner = ref('')
const labelInvalid = ref(false)
const labelRef = ref<HTMLInputElement | null>(null)

const isDown = computed(() => props.direction === 'down')

const formClass = computed(() =>
  isDown.value
    ? 'flex h-9 flex-wrap items-center gap-2 rounded-full bg-force-down/12 px-3 text-sm ring-1 ring-force-down/30'
    : 'flex h-9 flex-wrap items-center gap-2 rounded-full bg-force-up/15 px-3 text-sm ring-1 ring-force-up/35',
)

const inputClass =
  'h-6 min-w-0 flex-1 rounded-full border-0 bg-white/80 px-2 text-sm leading-none outline-none focus:ring-1'

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

onMounted(() => {
  void nextTick(() => labelRef.value?.focus())
})

function saveEdit() {
  const trimmed = label.value.trim()
  if (!trimmed) {
    labelInvalid.value = true
    labelRef.value?.focus()
    return
  }
  labelInvalid.value = false
  const ownerTrimmed = owner.value.trim()
  emit('save', { label: trimmed, owner: ownerTrimmed || null })
}

function cancelEdit() {
  emit('cancel')
}

function onEditKeydown(event: KeyboardEvent) {
  onInlineEditKeydown(event, { save: saveEdit, cancel: cancelEdit })
}

function onEditFocusOut(event: FocusEvent) {
  onInlineEditFocusOut(event, { cancel: cancelEdit })
}
</script>

<template>
  <li :class="formClass" @keydown="onEditKeydown" @focusout="onEditFocusOut">
    <input
      ref="labelRef"
      v-model="label"
      type="text"
      placeholder="Label"
      :class="labelInputClass"
      :aria-invalid="labelInvalid"
      aria-label="Force label"
      @input="labelInvalid = false"
    />
    <input
      v-model="owner"
      type="text"
      placeholder="Owner (optional)"
      :class="ownerInputClass"
      aria-label="Force owner"
    />
  </li>
</template>
