<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ enabled: boolean }>()
const emit = defineEmits<{ (e: 'file-selected', file: File): void }>()

const inputRef = ref<HTMLInputElement | null>(null)

function openPicker() {
  if (!props.enabled) return
  inputRef.value?.click()
}

function onChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('file-selected', file)
  input.value = ''
}

defineExpose({ openPicker })
</script>

<template>
  <input
    ref="inputRef"
    type="file"
    accept=".json,application/json"
    class="hidden"
    :disabled="!enabled"
    @change="onChange"
  />
</template>
