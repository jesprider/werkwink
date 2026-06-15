<script setup lang="ts">
import type { HillTrackable, Project } from '../schema/types'
import type { TrackableKind } from '../domain/trackableLookup'
import { useHillChartStore } from '../stores/hillChart'

const props = defineProps<{
  trackable: HillTrackable
  kind: TrackableKind
  project: Project
}>()

const store = useHillChartStore()

const deleteAriaLabel = () => (props.kind === 'project' ? 'Delete project' : 'Delete task')

function deleteConfirmMessage(): string {
  const name = props.trackable.name
  const taskCount = props.project.tasks.length
  if (props.kind === 'project' && taskCount > 0) {
    const label = taskCount === 1 ? '1 task' : `${taskCount} tasks`
    return `Delete "${name}" and its ${label}? This cannot be undone.`
  }
  return `Delete "${name}"? This cannot be undone.`
}

function onDelete() {
  if (!globalThis.confirm(deleteConfirmMessage())) return
  if (props.kind === 'project') {
    store.removeProject(props.project.id)
  } else {
    store.removeTask(props.project.id, props.trackable.id)
  }
}
</script>

<template>
  <button
    type="button"
    class="absolute right-5 bottom-5 rounded p-1.5 text-text-warm/60 hover:bg-rust/10 hover:text-rust"
    :title="deleteAriaLabel()"
    :aria-label="deleteAriaLabel()"
    @click="onDelete"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      class="size-4"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.508 0 .94.093 1.25.25V3.75c0-.69-.56-1.25-1.25-1.25S8.75 3.06 8.75 3.75v.5c.31-.157.742-.25 1.25-.25ZM7.5 6.75a.75.75 0 0 0-1.5 0v7.5a.75.75 0 0 0 1.5 0v-7.5Zm4.25.75a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm1.25 9.5a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>
