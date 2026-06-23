// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { positionFromClientX, useHillDrag } from './useHillDrag'

describe('positionFromClientX', () => {
  it('maps clientX across padded svg rect to integer 0..100', () => {
    const svg = {
      getBoundingClientRect: () => ({ left: 100, width: 200 }),
    } as SVGSVGElement
    expect(positionFromClientX(107, svg)).toBe(0)
    expect(positionFromClientX(200, svg)).toBe(50)
    expect(positionFromClientX(293, svg)).toBe(100)
  })

  it('returns null when svg is null or width is zero', () => {
    expect(positionFromClientX(100, null)).toBeNull()
    const svg = {
      getBoundingClientRect: () => ({ left: 0, width: 0 }),
    } as SVGSVGElement
    expect(positionFromClientX(50, svg)).toBeNull()
  })
})

describe('useHillDrag draggingId', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets draggingId on startDrag and clears on pointerup', () => {
    const onMove = vi.fn()
    const { startDrag, draggingId } = useHillDrag({
      getSvg: () => null,
      onMove,
    })

    expect(draggingId.value).toBeNull()

    const preventDefault = vi.fn()
    startDrag('dot_a', { preventDefault } as unknown as PointerEvent)
    expect(draggingId.value).toBe('dot_a')
    expect(preventDefault).toHaveBeenCalled()

    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(draggingId.value).toBeNull()
  })
})

describe('useHillDrag onSelect', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('selects once on drag past threshold and skips onClick', () => {
    const onSelect = vi.fn()
    const onClick = vi.fn()
    const { startDrag } = useHillDrag({
      getSvg: () => null,
      clickable: () => true,
      onMove: vi.fn(),
      onClick,
      onSelect,
    })

    startDrag('dot_a', { preventDefault: vi.fn(), clientX: 100 } as unknown as PointerEvent)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120 }))
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 140 }))
    window.dispatchEvent(new PointerEvent('pointerup'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('dot_a')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('does not select on a plain click', () => {
    const onSelect = vi.fn()
    const onClick = vi.fn()
    const { startDrag } = useHillDrag({
      getSvg: () => null,
      clickable: () => true,
      onMove: vi.fn(),
      onClick,
      onSelect,
    })

    startDrag('dot_a', { preventDefault: vi.fn(), clientX: 100 } as unknown as PointerEvent)
    window.dispatchEvent(new PointerEvent('pointerup'))

    expect(onSelect).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledWith('dot_a')
  })

  it('does not select when chart is not clickable', () => {
    const onSelect = vi.fn()
    const { startDrag } = useHillDrag({
      getSvg: () => null,
      clickable: () => false,
      onMove: vi.fn(),
      onSelect,
    })

    startDrag('dot_a', { preventDefault: vi.fn(), clientX: 100 } as unknown as PointerEvent)
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200 }))
    window.dispatchEvent(new PointerEvent('pointerup'))

    expect(onSelect).not.toHaveBeenCalled()
  })
})
