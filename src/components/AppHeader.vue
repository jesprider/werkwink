<script setup lang="ts">
defineProps<{
  endDailyEnabled: boolean
  endDailyLabel: 'End daily' | 'Saved'
  showDemoLabel?: boolean
}>()

defineEmits<{
  (e: 'end-daily-click'): void
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
    <div class="flex flex-wrap items-center gap-3">
      <RouterLink to="/" class="font-heading text-xl">werkwink</RouterLink>
      <span
        v-if="showDemoLabel"
        class="rounded-full bg-dusty-blue/15 px-3 py-1 text-xs font-medium text-dusty-blue ring-1 ring-dusty-blue/25"
      >
        Demo data
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-2">
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
