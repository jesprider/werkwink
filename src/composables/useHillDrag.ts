import { onBeforeUnmount, ref } from 'vue'
import { positionFromClientX } from '../lib/hillCurve'

export { positionFromClientX }
export const DRAG_THRESHOLD_PX = 4
/** Max gap between two clicks on the same marker to count as a double-click. */
export const DOUBLE_CLICK_MS = 350

export function useHillDrag(options: {
  getSvg: () => SVGSVGElement | null
  clickable?: () => boolean
  onMove: (id: string, position: number) => void
  onClick?: (id: string) => void
  onSelect?: (id: string) => void
  onOpen?: (id: string) => void
}) {
  const draggingId = ref<string | null>(null)
  let dragStartX = 0
  let didDrag = false
  // Detect double-clicks ourselves instead of relying on the native `dblclick`
  // event: paint-order reordering re-inserts the marker's node between the two
  // clicks, which resets the browser's native double-click tracking.
  let lastClickId: string | null = null
  let lastClickTime = 0

  function onPointerMove(ev: PointerEvent) {
    const id = draggingId.value
    if (!id) return
    if (!didDrag && Math.abs(ev.clientX - dragStartX) > DRAG_THRESHOLD_PX) {
      didDrag = true
      if (options.clickable?.()) options.onSelect?.(id)
    }
    const pos = positionFromClientX(ev.clientX, options.getSvg())
    if (pos === null) return
    options.onMove(id, pos)
  }

  function onPointerUp() {
    const id = draggingId.value
    draggingId.value = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)

    if (!id || didDrag || !options.clickable?.()) {
      lastClickId = null
      return
    }

    const now = performance.now()
    if (lastClickId === id && now - lastClickTime <= DOUBLE_CLICK_MS) {
      lastClickId = null
      options.onOpen?.(id)
      return
    }

    lastClickId = id
    lastClickTime = now
    options.onClick?.(id)
  }

  function startDrag(id: string, ev: PointerEvent) {
    ev.preventDefault()
    draggingId.value = id
    dragStartX = ev.clientX
    didDrag = false
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  onBeforeUnmount(onPointerUp)

  return { startDrag, draggingId }
}
