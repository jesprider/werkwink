<script setup lang="ts">
defineProps<{
  importEnabled: boolean
  exportEnabled: boolean
  cleanEnabled: boolean
  endDailyEnabled: boolean
  endDailyLabel: 'End daily' | 'Saved'
}>()

defineEmits<{
  (e: 'add-project'): void
  (e: 'import-click'): void
  (e: 'export-click'): void
  (e: 'clean-click'): void
  (e: 'end-daily-click'): void
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
    <RouterLink to="/" class="font-heading text-xl">werkwink</RouterLink>
    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        :disabled="!importEnabled"
        :title="importEnabled ? undefined : 'Export and Clean before importing again'"
        :class="
          importEnabled
            ? 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm transition-opacity hover:opacity-90'
            : 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm/50'
        "
        @click="importEnabled && $emit('import-click')"
      >
        Import
      </button>
      <button
        type="button"
        :disabled="!exportEnabled"
        :class="
          exportEnabled
            ? 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm transition-opacity hover:opacity-90'
            : 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm/50'
        "
        @click="exportEnabled && $emit('export-click')"
      >
        Export
      </button>
      <button
        type="button"
        :disabled="!cleanEnabled"
        :class="
          cleanEnabled
            ? 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm transition-opacity hover:opacity-90'
            : 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm/50'
        "
        @click="cleanEnabled && $emit('clean-click')"
      >
        Clean
      </button>
      <button
        type="button"
        class="rounded-full bg-terracotta px-4 py-2 text-sm text-cream transition-opacity hover:opacity-90"
        @click="$emit('add-project')"
      >
        + Project
      </button>
      <button
        type="button"
        :disabled="!endDailyEnabled"
        :class="
          endDailyEnabled
            ? 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm transition-opacity hover:opacity-90'
            : 'rounded-full bg-hill-sand px-4 py-2 text-sm text-text-warm/50'
        "
        @click="endDailyEnabled && $emit('end-daily-click')"
      >
        {{ endDailyLabel }}
      </button>
    </div>
  </header>
</template>
