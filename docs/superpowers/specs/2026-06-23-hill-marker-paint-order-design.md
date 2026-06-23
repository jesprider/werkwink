# werkwink — Hill marker paint order (design)

**Date:** 2026-06-23  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§2 hill, dots)  
**Context:** UI polish — selected and dragged dots should render above neighbors

When markers overlap on the hill chart, SVG paint order follows DOM order. Markers
render in a fixed array order, so a selected or dragged dot can slide **under**
another dot — including its name and force-count labels.

---

## 1. Goal

After this change:

- The **selected** marker (circle, staleness satellites, trail ghosts, name, and
  force labels) always paints **above** all other markers on the hill chart.
- The **actively dragged** marker paints above all others **during drag**, even if
  it is not selected.
- When both apply, **selection wins** — e.g. selected A while dragging B keeps A
  on top.
- Background markers keep their existing relative order (no position-based sort).
- Drag, click, and trail behavior are unchanged.

**Out of scope:** Global label-above-all-dots layering; reordering unselected
markers by position; `LandingHillIllustration`; `DoneStack` (HTML, not SVG).

---

## 2. Root cause

`HillChart.vue` iterates `markers` in array order:

```vue
<g v-for="m in markers" :key="m.id">
  <MarkerTrail v-if="m.id === selectedId" … />
  <MarkerChart … />
</g>
```

In SVG, later siblings paint on top. Overview markers follow project array order;
project view puts the project dot first, then tasks — so tasks naturally stack
above the project dot regardless of position on the curve.

`useHillDrag` tracks `draggingId` internally but does not expose it, so the chart
cannot reorder during drag.

---

## 3. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Approach | **Computed paint order** — move foreground marker to end of render list |
| Foreground id | `selectedId ?? draggingId ?? null` (selection wins over drag) |
| Drag start | Foreground promotion from **pointerdown** (not after drag threshold) |
| Unit moved | Entire marker group — trail + `MarkerChart` (dot + labels) together |
| Background order | Preserve incoming array order among non-foreground markers |
| Helper location | `markersInPaintOrder` in `src/domain/chartMarkers.ts` |

Rejected alternatives:

- **Two-pass template** — explicit but duplicates render logic for little gain.
- **Split circle/label layers** — over-engineered; trail layering becomes awkward.

---

## 4. `markersInPaintOrder`

Pure function — does not mutate the input array.

```ts
export function markersInPaintOrder(
  markers: ChartMarker[],
  foregroundId: string | null,
): ChartMarker[]
```

| Input | Result |
|-------|--------|
| `foregroundId` is `null` | Return `markers` as-is |
| `foregroundId` not found in `markers` | Return `markers` as-is |
| `foregroundId` found | `[...others in original order, foreground]` |

---

## 5. `useHillDrag` changes

Expose `draggingId` as `ref<string | null>`:

- Set to marker id on `pointerdown` in `startDrag`.
- Clear to `null` on `pointerup`.
- No change to click-vs-drag threshold or `onMove` / `onClick` behavior.

`DoneStack` continues to use `useHillDrag` but does not need paint-order logic.

---

## 6. `HillChart.vue` changes

```ts
const { startDrag: onGrab, draggingId } = useHillDrag({ … })

const foregroundId = computed(
  () => props.selectedId ?? draggingId.value ?? null,
)

const paintOrderMarkers = computed(() =>
  markersInPaintOrder(props.markers, foregroundId.value),
)
```

Template: `v-for="m in paintOrderMarkers"` instead of `v-for="m in markers"`.

No changes to `MarkerChart`, `MarkerTrail`, or `ChartWorkspace`.

---

## 7. Testing

### Unit (`chartMarkers.test.ts`)

- No foreground id → same array reference order preserved.
- Foreground in the middle → moved to end; others unchanged.
- Unknown foreground id → unchanged.
- Single marker with foreground → unchanged (length 1).

### Unit (`useHillDrag.test.ts`)

- `draggingId` is set on `startDrag`, cleared on pointer up.
- (Existing `positionFromClientX` tests unchanged.)

### Manual

- **Project view:** Select an early-rendered task; drag across the project dot —
  selected dot, name, and labels stay on top.
- **Overview:** Drag a dot without selecting first — dragged dot rises during
  drag, returns to background order on release.
- **Selection wins:** Select A, drag B — A stays on top throughout.
- **Trail:** Selected dot with trail history; drag through other dots — ghosts
  and live dot render above neighbors.

---

## 8. Verification

```bash
npm run lint && npm run format:check && npm run test && npm run build
```
