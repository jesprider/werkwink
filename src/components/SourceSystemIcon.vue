<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    system?: string
    size?: number
  }>(),
  { system: undefined, size: 16 },
)

const label = computed(() => props.system ?? 'link')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    class="shrink-0"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Jira -->
    <template v-if="label === 'jira'">
      <rect width="16" height="16" rx="3" fill="#2684FF" />
      <path fill="#fff" d="M8.2 11.5 5 8.3l1.4-1.4 1.8 1.8 4.4-4.4L13 5.3z" />
    </template>
    <!-- Linear -->
    <template v-else-if="label === 'linear'">
      <rect width="16" height="16" rx="3" fill="#5E6AD2" />
      <path fill="#fff" d="M4 12 12 4M7 4h5v5M4 9v5h5" stroke="#fff" stroke-width="1.2" />
    </template>
    <!-- GitHub -->
    <template v-else-if="label === 'github'">
      <rect width="16" height="16" rx="3" fill="#24292f" />
      <path
        fill="#fff"
        d="M8 3a5 5 0 0 0-1.6 9.7c.4.1.6-.2.6-.4v-1.4c-2.5.5-3-1.2-3-1.2-.4-1-.98-1.3-.98-1.3-.8-.5.06-.5.06-.5.9.06 1.4.9 1.4.9.8 1.4 2.1 1 2.6.8.1-.6.3-1 .5-1.2-2-.2-4.1-1-4.1-4.5a3.5 3.5 0 0 1 1-2.4 3.2 3.2 0 0 1 .1-2.3s.8-.3 2.6 1a8.8 8.8 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .6 1.6.2 2.8.1 2.3.6.6 1 1.4 1 2.4 0 3.5-2.1 4.3-4.1 4.5.3.3.6.8.6 1.6v2.3c0 .2.2.5.6.4A5 5 0 0 0 8 3Z"
      />
    </template>
    <!-- GitLab -->
    <template v-else-if="label === 'gitlab'">
      <rect width="16" height="16" rx="3" fill="#FC6D26" />
      <path fill="#fff" d="m8 3 1.2 3.7H12L9.4 8.3l1.2 3.7L8 9.4 5.4 12l1.2-3.7L4 6.7h2.8L8 3Z" />
    </template>
    <!-- Asana -->
    <template v-else-if="label === 'asana'">
      <circle cx="8" cy="8" r="7" fill="#F06A6A" />
      <circle cx="8" cy="6" r="2.5" fill="#fff" />
      <circle cx="5" cy="10" r="2" fill="#fff" />
      <circle cx="11" cy="10" r="2" fill="#fff" />
    </template>
    <!-- ClickUp -->
    <template v-else-if="label === 'clickup'">
      <rect width="16" height="16" rx="3" fill="#7B68EE" />
      <path fill="#fff" d="M4 8h8M8 4v8" stroke="#fff" stroke-width="2" stroke-linecap="round" />
    </template>
    <!-- Monday -->
    <template v-else-if="label === 'monday'">
      <rect width="16" height="16" rx="3" fill="#FF3D57" />
      <circle cx="5" cy="8" r="2" fill="#fff" />
      <circle cx="8" cy="8" r="2" fill="#fff" />
      <circle cx="11" cy="8" r="2" fill="#fff" />
    </template>
    <!-- Trello -->
    <template v-else-if="label === 'trello'">
      <rect width="16" height="16" rx="3" fill="#0079BF" />
      <rect x="4" y="4" width="8" height="8" rx="1" fill="#fff" />
      <rect x="5" y="5" width="3" height="5" rx="0.5" fill="#0079BF" />
      <rect x="9" y="5" width="3" height="3" rx="0.5" fill="#0079BF" />
    </template>
    <!-- Generic link -->
    <template v-else>
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        class="text-text-warm/50"
      />
      <path
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        class="text-text-warm/50"
        d="M6.5 9.5 9.5 6.5M7 6h2.5v2.5M9 10h2.5v2.5"
      />
    </template>
  </svg>
</template>
