import { describe, it, expect } from 'vitest'
import { yNorm, curveX, curveY, positionFromRatio, CHART } from './hillCurve'

describe('yNorm (raised cosine, 0 at ends, 1 at peak)', () => {
  it('is 0 at the left end', () => {
    expect(yNorm(0)).toBeCloseTo(0, 6)
  })
  it('is 0 at the right end', () => {
    expect(yNorm(100)).toBeCloseTo(0, 6)
  })
  it('is 1 at the peak', () => {
    expect(yNorm(50)).toBeCloseTo(1, 6)
  })
})

describe('curveX maps position 0..100 across the chart width', () => {
  it('maps 0 to the left edge', () => {
    expect(curveX(0)).toBe(0)
  })
  it('maps 100 to the right edge', () => {
    expect(curveX(100)).toBe(CHART.width)
  })
})

describe('curveY sits on the baseline at the ends and at the top at the peak', () => {
  const baseline = CHART.height - CHART.bottomPad
  it('is on the baseline at x=0', () => {
    expect(curveY(0)).toBeCloseTo(baseline, 6)
  })
  it('is on the baseline at x=100', () => {
    expect(curveY(100)).toBeCloseTo(baseline, 6)
  })
  it('is at topPad at the peak', () => {
    expect(curveY(50)).toBeCloseTo(CHART.topPad, 6)
  })
})

describe('positionFromRatio maps a 0..1 ratio to an integer 0..100', () => {
  it('maps 0 to 0', () => {
    expect(positionFromRatio(0)).toBe(0)
  })
  it('maps 0.5 to 50', () => {
    expect(positionFromRatio(0.5)).toBe(50)
  })
  it('maps 1 to 100', () => {
    expect(positionFromRatio(1)).toBe(100)
  })
  it('rounds to the nearest integer', () => {
    expect(positionFromRatio(0.234)).toBe(23)
  })
  it('clamps below 0', () => {
    expect(positionFromRatio(-0.2)).toBe(0)
  })
  it('clamps above 100', () => {
    expect(positionFromRatio(1.5)).toBe(100)
  })
})
