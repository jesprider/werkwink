# werkwink — Iteration 15: Trail on chart (design)

**Date:** 2026-06-07  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§5.7)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 15)  
**Builds on:** iteration 14 (End daily snapshots + `localDateString`)

Visual history behind a dot during the daily: when a dot is selected, up to seven
prior-day snapshot positions render as faint ghost dots on the hill chart. Unselected
dots stay clean; the live dot always represents today.

---

## 1. Goal

After this iteration:

- **Ghost trail** — on overview and project view, the **selected** dot shows up to
  **7** ghost markers at committed snapshot positions from prior calendar days.
- **Selection-gated** — no ghosts when nothing is selected; only the selected dot
  shows a trail (matches `selectedTrackableId` / side panel).
- **Opacity ramp** — oldest ghost ~10% fill opacity → newest historical ~70% → live
  dot 100%.
- **Ghost styling** — same radius as live dot; 1px cream stroke at reduced opacity;
  fill-only feel; no labels or force badges on ghosts.
- **No connecting line** between ghosts (parent spec open question #4 default).

**Out of scope:** Side-panel sparkline (iteration 19); staleness satellites
(iteration 17); done stack (iteration 18); peak clamp (iteration 16); store changes.

**Parent spec deviation:** §5.7 specifies last **10** snapshots always visible;
this iteration uses **7** and shows the trail **only when selected** (brainstorm
lock-in — reduces chart noise).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Trail length | **7** prior-day snapshots (cap after filters) |
| Visibility | **Selected dot only** — `selectedTrackableId` gates rendering |
| Today's snapshot | **Exclude** — trail = prior End-daily days; live dot = today |
| Ghost radius | **Same** as live dot for that chart mode |
| Ghost stroke | **1px** `#FDFAF4`, `stroke-opacity ~0.5` |
| Ghost interaction | **`pointer-events: none`** — drag/click on live dot only |
| Connecting line | **None** |
| Surfaces | **Overview + project view** (both use `HillChart`) |
| Today date | **`localDateString()`** from `src/lib/localDate.ts` (iter 14) |
| Snapshot source | Per-dot `snapshots[]` on `Project` / `Task` (newest-first in storage) |
| Architecture | Domain helper + extend `ChartMarker` + selection prop on `HillChart` |

---

## 3. Trail selection & opacity

New `src/domain/trailGhosts.ts`:

```ts
export interface TrailGhost {
  position: number
  opacity: number // fill opacity 0–1
}

export function trailGhosts(
  snapshots: Snapshot[],
  today: string,
  maxCount = 7,
): TrailGhost[]
```

**Selection algorithm:**

1. Filter out entries where `snapshot.date === today`.
2. From the remainder (still newest-first), take at most **`maxCount`** (`slice(0, 7)`).
3. Sort **oldest-first** by `date` for paint order (back → front).
4. Assign fill opacity:
   - `n === 0` → return `[]`.
   - `n === 1` → opacity `0.7`.
   - `n > 1` → index `i` (0 = oldest): `0.1 + 0.6 × (i / (n − 1))`.

**Edge cases:**

- No End daily yet → empty trail.
- Import with long history → still cap at 7 prior days.
- Skipped days → gaps only (no interpolation).
- Live position may differ from any ghost (user dragged after a prior End daily).

---

## 4. Components & data flow

```
Project / Task.snapshots[]
  → overviewMarkers / markersForProject
      → trailGhosts(snapshots, localDateString()) on each ChartMarker
  → OverviewView / ProjectView
      → HillChart :selected-id="selectedTrackableId"
  → HillChart
      → ChartMarker :show-trail="m.id === selectedId"
  → ChartMarker
      → if showTrail: render ghost circles (non-interactive)
      → render live dot + labels (unchanged)
```

### 4.1 `chartMarkers.ts`

Extend `ChartMarker`:

```ts
export interface ChartMarker {
  id: string
  position: number
  color: string
  radius: number
  name: string
  up: number
  down: number
  ghosts: TrailGhost[]
}
```

In `overviewMarkers` and `markersForProject`, set `ghosts: trailGhosts(trackable.snapshots, localDateString())`.

### 4.2 `HillChart.vue`

Add optional prop:

```ts
selectedId?: string | null  // default null
```

Pass to each marker:

```vue
<ChartMarker
  ...
  :ghosts="m.ghosts"
  :show-trail="m.id === selectedId"
/>
```

No other behavior changes (drag, click, open unchanged).

### 4.3 `ChartMarker.vue`

Add props:

```ts
ghosts: TrailGhost[]
showTrail: boolean
```

When `showTrail`, render ghosts **before** the live circle. Ghost entries carry
`position` only; `ChartMarker` imports `useHillCurve()` and maps each ghost
position to `cx`/`cy` (same curve math as `HillChart`).

Ghost SVG (inside `<g>` with `pointer-events="none"`):

```vue
<circle
  v-for="(g, i) in visibleGhosts"
  :key="i"
  :cx="curveX(g.position)"
  :cy="curveY(g.position)"
  :r="radius"
  :fill="color"
  :fill-opacity="g.opacity"
  stroke="#FDFAF4"
  stroke-width="1"
  stroke-opacity="0.5"
/>
```

Z-order: oldest ghost first in loop, live dot and labels on top.

### 4.4 Views

**`OverviewView.vue`** and **`ProjectView.vue`:**

```vue
<HillChart
  :markers="markers"
  :selected-id="selectedTrackableId"
  ...
/>
```

Trail appears when user single-clicks a dot (panel opens); disappears on close,
toggle-off, or selecting another dot.

---

## 5. Error handling & accessibility

- Ghosts are decorative; no extra ARIA on ghost circles.
- Live dot remains the interactive target; ghosts do not steal pointer events.
- Empty trail when selected dot has no prior snapshots — no empty-state UI.

---

## 6. Testing

**Gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Cases |
|------|--------|
| `trailGhosts.test.ts` | Excludes today; caps at 7; empty when no history; single → 0.7; two → 0.1 and 0.7; oldest-first output order |
| `chartMarkers.test.ts` | Markers include `ghosts` derived from project/task snapshots |

Skip DOM/component tests unless trivial; selection gating is manual.

**Manual**

- [ ] No dot selected → no ghosts on any dot.
- [ ] Select dot with 2+ days of End daily history → up to 7 ghosts behind it only.
- [ ] Close panel / deselect → trail gone.
- [ ] Select different dot → trail moves to new selection.
- [ ] End daily today, drag live dot → ghosts stay at prior days; live dot moves.
- [ ] New dot (no snapshots) selected → no ghosts.
- [ ] Project view: select project dot and task dot — trail works for each.
- [ ] Overview: select project — trail on that project dot only.

---

## 7. Files

| File | Action |
|------|--------|
| `src/domain/trailGhosts.ts` | New: selection + opacity |
| `src/domain/trailGhosts.test.ts` | Unit tests |
| `src/composables/chartMarkers.ts` | `ghosts` on `ChartMarker`; wire `trailGhosts` |
| `src/composables/chartMarkers.test.ts` | Snapshot → ghosts cases |
| `src/components/ChartMarker.vue` | Render ghosts when `showTrail` |
| `src/components/HillChart.vue` | `selectedId` prop; pass `showTrail` |
| `src/views/OverviewView.vue` | `:selected-id="selectedTrackableId"` |
| `src/views/ProjectView.vue` | `:selected-id="selectedTrackableId"` |
| `docs/superpowers/specs/2026-06-07-werkwink-iteration-15-trail-on-chart-design.md` | This doc |

**Branch:** `feature/iteration-15-trail-on-chart` off `main`.

**Roadmap update (when implementation ships):** iteration 15 → `done`; add doc row
in "Completed iteration docs"; M5 complete.

---

## 8. Spec self-review (2026-06-07)

- [x] No TBD placeholders.
- [x] Trail cap 7 and selection-only visibility (brainstorm lock-in).
- [x] Today excluded from ghosts; live dot represents today.
- [x] Ghost stroke: 1px lighter cream (brainstorm lock-in C).
- [x] Scope matches roadmap iteration 15 only; sparkline deferred to 19.
- [x] Parent spec §5.7 deviation documented (7 vs 10, selection-gated).
- [x] Reuses `localDateString()` and iter 14 snapshot ordering.
