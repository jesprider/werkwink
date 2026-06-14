# werkwink — Hill dot edge clipping fix (design)

**Date:** 2026-06-14  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§2 hill, dots)  
**Context:** Post-refactor UI polish sprint — first production-readiness fix

Markers at position `0` or `100` are clipped at the left and right edges of the
hill chart because their circles extend beyond the SVG `viewBox`.

---

## 1. Goal

After this change:

- Dots at position **0** and **100** render fully (circle, stroke, staleness
  satellites) — not cut off at the chart edge.
- Ghost trail dots at endpoint positions are also fully visible.
- Drag-to-position still maps correctly across the full chart width.
- The **hill curve geometry is unchanged** — still spans `x = 0…1000` in SVG
  coordinates, baseline at both ends, peak at 50.

**Out of scope:** Long name labels clipping at extreme positions; vertical padding
for labels below dots; insetting the hill curve visually (option B from
brainstorming).

---

## 2. Root cause

`curveX(position)` maps `0 → 0` and `100 → CHART.width (1000)`. Marker centers sit
on those coordinates. The largest marker (project dot, radius 22) plus stroke (2px)
and staleness satellite orbit (~9px to the side) extends ~36px beyond center. The
SVG `viewBox` is exactly `0 0 1000 420`, so SVG clips anything outside.

---

## 3. Decision (brainstorm)

| Topic | Decision |
|-------|----------|
| Approach | **Expand `viewBox`** with horizontal padding; curve math unchanged |
| `sidePad` | **36px** — covers max radius 22 + stroke 2 + leftmost satellite offset ~9 + buffer |
| Curve | `curveX`, `curveY`, `curvePath` **unchanged** |
| Drag | Remap `clientX` across full padded viewBox width |
| Surfaces | `HillChart`, `LandingHillIllustration`, `MarkerTrail` (via shared helpers) |
| Visual trade-off | ~3.4% cream gutter each side when SVG scales to `w-full` — acceptable |

Rejected alternatives:

- **`overflow: visible` + CSS padding** — fragile, couples to `DoneStack` layout.
- **Visual-only `cx` nudge at endpoints** — breaks dot-on-curve invariant.

---

## 4. `src/lib/hillCurve.ts` changes

### 4.1 Constants

```ts
export const CHART = {
  width: 1000,
  height: 420,
  topPad: 60,
  bottomPad: 60,
  sidePad: 36,
} as const
```

### 4.2 ViewBox helper

```ts
export function chartViewBox(): string {
  const { width, height, sidePad } = CHART
  return `-${sidePad} 0 ${width + 2 * sidePad} ${height}`
}
```

### 4.3 Pointer → position (replaces inline math in `useHillDrag`)

```ts
export function positionFromClientX(
  clientX: number,
  svg: SVGSVGElement | null,
): number | null {
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  if (rect.width === 0) return null
  const { width, sidePad } = CHART
  const viewBoxWidth = width + 2 * sidePad
  const ratio = (clientX - rect.left) / rect.width
  const svgX = ratio * viewBoxWidth - sidePad
  return positionFromRatio(svgX / width)
}
```

`positionFromRatio` is unchanged.

---

## 5. Component updates

| File | Change |
|------|--------|
| `HillChart.vue` | `:viewBox="chartViewBox()"` |
| `LandingHillIllustration.vue` | `:viewBox="chartViewBox()"` |
| `useHillDrag.ts` | Import and re-export `positionFromClientX` from `hillCurve.ts` |

No changes to `MarkerChart`, `MarkerTrail`, `DoneStack`, or `ChartWorkspace`.

---

## 6. Testing

### Unit (`hillCurve.test.ts`)

- `chartViewBox()` returns `"-36 0 1072 420"`.
- `positionFromClientX` at padded left edge of rendered rect → `0`.
- `positionFromClientX` at padded right edge → `100`.
- `positionFromClientX` at horizontal center of drawable area → `50`.

### Unit (`useHillDrag.test.ts`)

- Update mock expectations to match padded mapping (same assertions, adjusted
  clientX values for a 200px-wide rect).

### Manual

- Overview: drag **Search relevance** (or any dot) to position `0` — full circle
  visible, not clipped.
- Project view: project at position `100` on hill — full circle visible on right.
- Select a dot with trail history; drag to `0` or `100` — ghost dots not clipped.
- Landing page illustration — demo dot and labels unaffected.

---

## 7. Verification

```bash
npm run lint && npm run format:check && npm run test && npm run build
```
