<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const emit = defineEmits<{
  save: [payload: { label: string; owner: string | null }]
  cancel: []
}>()

const label = ref('')
const owner = ref('')
const labelInvalid = ref(false)
const labelRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  void nextTick(() => labelRef.value?.focus())
})

function trySave() {
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

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    trySave()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('cancel')
  }
}
</script>

<template>
  <li
    class="flex flex-wrap items-center gap-2 rounded-full bg-hill-sand/50 px-3 py-1.5 text-sm ring-1 ring-hill-sand"
    @keydown="onKeydown"
  >
    <input
      ref="labelRef"
      v-model="label"
      type="text"
      placeholder="Label"
      class="min-w-[6rem] flex-1 rounded-full border-0 bg-white/80 px-2 py-0.5 outline-none focus:ring-1 focus:ring-terracotta/40"
      :aria-invalid="labelInvalid"
      aria-label="Force label"
      @input="labelInvalid = false"
    />
    <input
      v-model="owner"
      type="text"
      placeholder="Owner (optional)"
      class="min-w-[5rem] flex-1 rounded-full border-0 bg-white/80 px-2 py-0.5 outline-none focus:ring-1 focus:ring-terracotta/40"
      aria-label="Force owner"
      @blur="trySave"
    />
  </li>
</template>
