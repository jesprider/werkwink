import { CHART, curvePath, curveX, curveY, positionFromRatio, yNorm } from '../lib/hillCurve'

export function useHillCurve() {
  return { CHART, yNorm, curveX, curveY, curvePath, positionFromRatio }
}
