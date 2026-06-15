import { onBeforeUnmount, watch, type Ref } from 'vue'

/** Capture-phase Escape listener so cancel runs before input blur-save handlers. */
export function useEscapeToCancel(
  active: Ref<boolean>,
  cancel: () => void,
  escaping?: Ref<boolean>,
) {
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !active.value) return
    event.preventDefault()
    event.stopPropagation()
    if (escaping) escaping.value = true
    cancel()
  }

  watch(
    active,
    (isActive) => {
      if (isActive) {
        if (escaping) escaping.value = false
        window.addEventListener('keydown', onKeydown, true)
      } else {
        window.removeEventListener('keydown', onKeydown, true)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown, true)
  })
}

/** For short-lived forms (e.g. add force) that are only mounted while editing. */
export function useEscapeToCancelWhileMounted(cancel: () => void, escaping?: Ref<boolean>) {
  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    if (escaping) escaping.value = true
    cancel()
  }

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown, true)
  })

  window.addEventListener('keydown', onKeydown, true)
}
