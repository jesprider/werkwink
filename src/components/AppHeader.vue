<script setup lang="ts">
defineProps<{
  endDailyEnabled: boolean
  endDailyLabel: 'End daily' | 'Saved'
}>()

defineEmits<{
  (e: 'end-daily-click'): void
}>()
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
    <RouterLink to="/" class="font-heading text-xl">werkwink</RouterLink>
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
