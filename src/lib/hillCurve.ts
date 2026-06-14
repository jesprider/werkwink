export const CHART = {
  width: 1000,
  height: 420,
  topPad: 60,
  bottomPad: 60,
} as const

// Raised cosine: 0 at x=0 and x=100, 1 at the peak (x=50).
export function yNorm(x: number): number {
  return (1 - Math.cos((2 * Math.PI * x) / 100)) / 2
}

// Position 0..100 -> SVG x coordinate across the full width.
export function curveX(x: number): number {
  return (x / 100) * CHART.width
}

// Position 0..100 -> SVG y coordinate (baseline at the ends, topPad at the peak).
export function curveY(x: number): number {
  const amplitude = CHART.height - CHART.topPad - CHART.bottomPad
  const baseline = CHART.height - CHART.bottomPad
  return baseline - yNorm(x) * amplitude
}

// SVG path string sampling the curve across the whole hill.
export function curvePath(step = 1): string {
  const points: string[] = []
  for (let x = 0; x <= 100; x += step) {
    const cmd = x === 0 ? 'M' : 'L'
    points.push(`${cmd}${curveX(x).toFixed(2)} ${curveY(x).toFixed(2)}`)
  }
  return points.join(' ')
}

// Horizontal ratio across the chart (0..1) -> integer position 0..100, clamped.
export function positionFromRatio(ratio: number): number {
  const clamped = Math.min(1, Math.max(0, ratio))
  return Math.round(clamped * 100)
}
