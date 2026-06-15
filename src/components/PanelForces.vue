<script setup lang="ts">
import type { Force, ForceDirection } from '../schema/types'
import ForceAddForm from './ForceAddForm.vue'
import ForceChip from './ForceChip.vue'

const props = defineProps<{
  direction: ForceDirection
  activeForces: Force[]
  pastForces: Force[]
  editingForceId: string | null
  isAdding: boolean
}>()

const emit = defineEmits<{
  'edit-start': [forceId: string]
  'save-edit': [forceId: string, payload: { label: string; owner: string | null }]
  'cancel-edit': []
  resolve: [forceId: string]
  unresolve: [forceId: string]
  'add-start': []
  'add-save': [payload: { label: string; owner: string | null }]
  'add-cancel': []
}>()

const sectionTitle = props.direction === 'up' ? 'Active up forces' : 'Active down forces'
const pastTitle = props.direction === 'up' ? 'Past boosters' : 'Past blockers'
const addAria = props.direction === 'up' ? 'Add up force' : 'Add down force'
</script>

<template>
  <section class="mb-6">
    <div class="mb-2 flex items-center justify-between gap-2">
      <h3 class="text-xs font-medium tracking-wide text-text-warm/60 uppercase">
        {{ sectionTitle }}
      </h3>
      <button
        v-if="!isAdding"
        type="button"
        class="shrink-0 rounded p-1 text-text-warm/60 transition-colors hover:bg-hill-sand hover:text-text-warm"
        :aria-label="addAria"
        @click="emit('add-start')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class="size-4"
          aria-hidden="true"
        >
          <path
            d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"
          />
        </svg>
      </button>
    </div>
    <ul class="space-y-2">
      <ForceChip
        v-for="force in activeForces"
        :key="force.id"
        :force="force"
        variant="active"
        :is-editing="editingForceId === force.id"
        @edit-start="emit('edit-start', force.id)"
        @save="emit('save-edit', force.id, $event)"
        @cancel="emit('cancel-edit')"
        @resolve="emit('resolve', force.id)"
      />
      <ForceAddForm v-if="isAdding" @save="emit('add-save', $event)" @cancel="emit('add-cancel')" />
    </ul>
    <p v-if="!activeForces.length && !isAdding" class="mb-2 text-sm text-text-warm/50">None</p>
  </section>

  <details v-if="pastForces.length" :class="direction === 'up' ? 'mb-4' : ''">
    <summary class="text-sm font-medium">{{ pastTitle }}</summary>
    <ul class="mt-2 space-y-2">
      <ForceChip
        v-for="force in pastForces"
        :key="force.id"
        :force="force"
        variant="past"
        :is-editing="false"
        @unresolve="emit('unresolve', force.id)"
      />
    </ul>
  </details>
</template>
