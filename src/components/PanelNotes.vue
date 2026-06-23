<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { HillTrackable } from '../schema/types'
import { useHillChartStore } from '../stores/hillChart'

const props = defineProps<{
  trackable: HillTrackable
  trackableId: string
}>()

const store = useHillChartStore()
const { canEndDaily } = storeToRefs(store)

const draft = computed({
  get: () => props.trackable.dailyNoteDraft ?? '',
  set: (value: string) => store.setDailyNoteDraft(props.trackableId, value),
})
</script>

<template>
  <section v-if="canEndDaily" class="mb-6">
    <h3 class="mb-2 text-xs font-medium tracking-wide text-text-warm/60 uppercase">Notes</h3>
    <textarea
      v-model="draft"
      rows="3"
      maxlength="500"
      class="w-full resize-none rounded-lg border border-hill-sand/80 bg-white/60 px-3 py-2 text-sm text-text-warm placeholder:text-text-warm/40 focus:border-terracotta/50 focus:outline-none"
      placeholder="Short update from today's standup…"
      aria-label="Daily standup note"
    />
  </section>
</template>
