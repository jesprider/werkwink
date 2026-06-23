import { clampLabelCenterX } from './hillCurve'

export type LabelSide = 'below' | 'above' | 'left' | 'right'

export interface LabelBox {
  x: number
  y: number
  width: number
  height: number
}

export interface LabelLayout {
  anchor: 'start' | 'middle' | 'end'
  titleX: number
  titleY: number
  forcesX: number
  forcesY: number
  bg: LabelBox & { rx: number }
}

const LINE_OFFSET = 17 // baseline gap between the title and forces lines
const TITLE_ASCENT = 11 // text rise above its baseline
const FORCES_DESCENT = 3 // text drop below its baseline
const DOT_GAP = 8 // gap between the dot edge and the label
const SIDE_TITLE_DY = -2 // title baseline relative to dot center (left/right)
const SIDE_FORCES_DY = 12 // forces baseline relative to dot center (left/right)

/** Geometry for a marker's two label lines + background box, for one placement side. */
export function computeLabelLayout(
  cx: number,
  cy: number,
  radius: number,
  width: number,
  side: LabelSide,
): LabelLayout {
  let anchor: 'start' | 'middle' | 'end'
  let anchorX: number
  let titleBaseline: number
  let forcesBaseline: number

  if (side === 'above') {
    anchor = 'middle'
    anchorX = clampLabelCenterX(cx, width)
    forcesBaseline = cy - radius - DOT_GAP
    titleBaseline = forcesBaseline - LINE_OFFSET
  } else if (side === 'left') {
    anchor = 'end'
    anchorX = cx - radius - DOT_GAP
    titleBaseline = cy + SIDE_TITLE_DY
    forcesBaseline = cy + SIDE_FORCES_DY
  } else if (side === 'right') {
    anchor = 'start'
    anchorX = cx + radius + DOT_GAP
    titleBaseline = cy + SIDE_TITLE_DY
    forcesBaseline = cy + SIDE_FORCES_DY
  } else {
    anchor = 'middle'
    anchorX = clampLabelCenterX(cx, width)
    titleBaseline = cy + radius + LINE_OFFSET
    forcesBaseline = cy + radius + 2 * LINE_OFFSET
  }

  const top = titleBaseline - TITLE_ASCENT
  const bottom = forcesBaseline + FORCES_DESCENT
  const bgX =
    anchor === 'middle' ? anchorX - width / 2 : anchor === 'end' ? anchorX - width : anchorX

  return {
    anchor,
    titleX: anchorX,
    titleY: titleBaseline,
    forcesX: anchorX,
    forcesY: forcesBaseline,
    bg: { x: bgX, y: top, width, height: bottom - top, rx: 5 },
  }
}
