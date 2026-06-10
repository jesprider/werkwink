<script setup lang="ts">
import { HILL_CHART_STORAGE_KEY } from '../storage/loadState'

defineProps<{
  message: string
}>()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center px-6 py-12">
    <div class="max-w-lg">
      <h1 class="mb-4 font-heading text-3xl">Could not load saved data</h1>
      <p class="mb-2 text-sm">
        Storage key:
        <code class="rounded bg-hill-sand px-1.5 py-0.5 font-mono text-sm">{{
          HILL_CHART_STORAGE_KEY
        }}</code>
      </p>
      <pre class="mb-6 overflow-x-auto rounded-lg bg-hill-sand p-4 text-sm whitespace-pre-wrap">{{
        message
      }}</pre>
      <p class="text-sm text-text-warm/80">
        Chart data is stored locally in your browser. Clear the key above in DevTools → Application
        → Local Storage, then reload to start fresh.
      </p>
    </div>
  </div>
</template>
