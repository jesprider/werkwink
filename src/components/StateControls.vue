<script setup lang="ts">
defineProps<{
  importEnabled: boolean
  exportEnabled: boolean
  cleanEnabled: boolean
}>()

defineEmits<{
  (e: 'import-click'): void
  (e: 'export-click'): void
  (e: 'clean-click'): void
}>()

const buttonClass =
  'px-3 py-1.5 transition-colors hover:bg-hill-sand/50 hover:text-text-warm disabled:cursor-not-allowed disabled:text-text-warm/35 disabled:hover:bg-transparent'
</script>

<template>
  <footer
    class="fixed right-5 bottom-5 z-30 flex divide-x divide-text-warm/15 overflow-hidden rounded-md border border-text-warm/15 bg-cream/90 text-xs text-text-warm/70 backdrop-blur-sm"
    aria-label="State controls"
  >
    <button
      type="button"
      :disabled="!importEnabled"
      :title="importEnabled ? undefined : 'Export and Clean before importing again'"
      :class="buttonClass"
      @click="importEnabled && $emit('import-click')"
    >
      Import
    </button>
    <button
      type="button"
      :disabled="!exportEnabled"
      :class="buttonClass"
      @click="exportEnabled && $emit('export-click')"
    >
      Export
    </button>
    <button
      type="button"
      :disabled="!cleanEnabled"
      :class="buttonClass"
      @click="cleanEnabled && $emit('clean-click')"
    >
      Clean
    </button>
  </footer>
</template>
