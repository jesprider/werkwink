import { describe, it, expect } from 'vitest'
import { positionFromClientX } from './useHillDrag'

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
