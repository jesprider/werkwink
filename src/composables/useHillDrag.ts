import { onBeforeUnmount } from 'vue'
import { positionFromClientX } from '../lib/hillCurve'

export { positionFromClientX }
export const DRAG_THRESHOLD_PX = 4

export function useHillDrag(options: {
  getSvg: () => SVGSVGElement | null
  clickable?: () => boolean
  onMove: (id: string, position: number) => void
  onClick?: (id: string) => void
}) {
  let draggingId: string | null = null
  let dragStartX = 0
  let didDrag = false

  function onPointerMove(ev: PointerEvent) {
    if (!draggingId) return
    if (Math.abs(ev.clientX - dragStartX) > DRAG_THRESHOLD_PX) {
      didDrag = true
    }
    const pos = positionFromClientX(ev.clientX, options.getSvg())
    if (pos === null) return
    options.onMove(draggingId, pos)
  }

  function onPointerUp() {
    const id = draggingId
    if (id && !didDrag && options.clickable?.() && options.onClick) {
      options.onClick(id)
    }
    draggingId = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
  }

  function startDrag(id: string, ev: PointerEvent) {
    ev.preventDefault()
    draggingId = id
    dragStartX = ev.clientX
    didDrag = false
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
  }

  onBeforeUnmount(onPointerUp)

  return { startDrag }
}
