# werkwink — Iteration 18: Done stack (design)

**Date:** 2026-06-07  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§2 Done, §4.2, open question #3)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 18)  
**Builds on:** iteration 17 (`DONE_POSITION`), iteration 16 (`setPosition` clamp), iteration 9 (click → panel)

When dots reach position 100 they leave the hill curve and appear in a **done stack**
column at the bottom-right. The stack keeps x=100 readable, supports drag-back onto
the hill, and opens the side panel on click. Projects cannot be marked done while
any task is still incomplete.

---

## 1. Goal

After this iteration:

- **Done stack UI** — bottom-right column on both overview and project view. All dots
  at `position === 100` render here instead of on the curve.
- **Collapsed (N = 1)** — single colored dot chip only (no name, no badge).
- **Collapsed (N ≥ 2)** — up to three overlapping dot chips + pill **"+ N more"**
  badge (N = total done count).
- **Expanded** — column grows downward in place; each row shows dot + name + `↑/↓`
  counts. Toggle expand via badge/header; collapse on outside click or toggle.
- **Drag from stack** — grab a stack dot and drag left onto the hill to un-done
  (`position < 100`); same `setPosition` path as chart drag (peak clamp applies).
- **Click from stack** — selects dot and opens side panel (same as chart click).
- **Project completion guard** — a project cannot reach 100 while any task has
  `position < 100`; clamp to **99** on drag, slider, and stack drag.
- **Vitest** — marker partition, project-done guard in store.

**Out of scope:** Auto-moving the project when the last task completes; ghost trails
for stack dots; changing `position === 100` as the done definition; landing page;
delete (iteration 19).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Stacking threshold | **Always stack** — every done dot leaves the curve (≥1 done) |
| Surfaces | **Overview + project view** — done projects on overview; done tasks (+ project if at 100) on project view |
| Project done rule | **Block at 99** if any task has `position < 100` |
| Task done | **Independent** — tasks may reach 100 without the project |
| Last task completes | **No auto-move** — manager drags project to done manually |
| Un-done interaction | **Drag from stack** onto the hill |
| Stack click | **Opens side panel** (same as chart click) |
| Collapsed N = 1 | **Dot only** — no name, no "+ N more" |
| Collapsed N ≥ 2 | **Overlapping chips + "+ N more"** badge |
| Expanded list | **Inline expand** in place; outside click or toggle to collapse |
| Architecture | **HTML overlay stack** + filtered markers (approach A) |
| Done definition | **`position === 100`** — reuse `DONE_POSITION` from `staleness.ts` |
| Ghost trails | **Active dots only** — unchanged; no trail for stack selection in v1 |
| Stack sort order | **Name ascending** (stable, predictable) |

---

## 3. Domain: project completion guard

New helper in `src/domain/doneRules.ts`:

```ts
import { DONE_POSITION } from './staleness'
import type { Project } from '../schema/types'

export const PROJECT_DONE_CLAMP = 99

/** True when every task is at DONE_POSITION. Vacuously true when tasks.length === 0. */
export function allTasksDone(project: Project): boolean

/** Clamp target position for a project dot; tasks pass through unchanged. */
export function clampProjectDonePosition(
  project: Project,
  targetPosition: number,
): number
```

**Rules:**

- If `targetPosition !== DONE_POSITION` → return `targetPosition` unchanged (after
  outer 0–100 rounding/clamp).
- If trackable is a **task** → no extra guard.
- If trackable is a **project** and `targetPosition === 100`:
  - When `allTasksDone(project)` → allow 100.
  - Otherwise → return **`PROJECT_DONE_CLAMP` (99)**.

Wire inside `setPosition` **after** peak clamp, **before** writing position.

---

## 4. Marker pipeline

Extend `src/composables/chartMarkers.ts`:

```ts
export function partitionMarkers(markers: ChartMarker[]): {
  active: ChartMarker[]
  done: ChartMarker[]
}
```

- **`active`** — `position < DONE_POSITION` → passed to `HillChart`.
- **`done`** — `position === DONE_POSITION`, sorted by `name` localeCompare → passed
  to `DoneStack`.

`overviewMarkers` / `markersForProject` stay unchanged; views partition the result.

---

## 5. `DoneStack.vue`

### 5.1 Placement

- Parent: chart wrapper `div` with `position: relative` (both views).
- `DoneStack`: `absolute bottom-4 right-4` (Tailwind), `z-10`, max width ~220px.
- Sits over the chart padding area, not outside the SVG viewBox math.

### 5.2 Collapsed

| N | UI |
|---|-----|
| 0 | Render nothing |
| 1 | One draggable/clickable dot chip (project color, radius scaled to ~24px) |
| ≥ 2 | Up to 3 offset dot chips + terracotta/sand pill **"+ N more"** (N = total) |

Clicking **"+ N more"** or the stack header toggles expanded state.

### 5.3 Expanded

Vertical list below the collapsed header:

- Row: dot chip + truncated name (`max-w-[140px] truncate`) + `↑n ↓n` in muted text.
- Row click → emit `click(id)` (toggle select like chart).
- Selected row: ring matching chart selection (`ring-2 ring-terracotta/60`).
- Document click listener collapses when click is outside the stack root.

### 5.4 Drag from stack

Extract shared logic to `src/composables/useHillDrag.ts` (from `HillChart.vue`):

- `positionFromClientX(clientX, svgElement)` → integer 0–100.
- Stack dot `pointerdown` → set dragging id; on `pointermove`, if pointer is over
  the chart SVG, show a **preview dot** on the curve at the mapped position (optional
  faint ghost on curve during drag).
- On `pointerup`: if mapped position `< DONE_POSITION`, emit `move(id, position)`;
  if still at 100, no-op.
- Reuse `DRAG_THRESHOLD_PX` so click vs drag discrimination matches the chart.

Props: `doneMarkers`, `selectedId`, chart container ref / svg ref for coordinate map.
Emits: `move`, `click`.

---

## 6. View integration

### 6.1 `OverviewView.vue`

```vue
<div class="relative min-w-0 flex-1">
  <HillChart :markers="activeMarkers" … />
  <DoneStack
    :done-markers="doneMarkers"
    :selected-id="selectedTrackableId"
    :chart-root="chartRootRef"
    @move="onMove"
    @click="onTrackableClick"
  />
</div>
```

- `activeMarkers` / `doneMarkers` from `partitionMarkers(overviewMarkers(...))`.

### 6.2 `ProjectView.vue`

Same wrapper pattern with `partitionMarkers(markersForProject(...))`.

### 6.3 `HillChart.vue`

- No structural change beyond receiving only **active** markers.
- Optional: expose `svgRef` via `defineExpose` for stack drag coordinate mapping.

---

## 7. Interaction matrix

| Action | Active dot on curve | Done dot in stack |
|--------|---------------------|-------------------|
| Click | Toggle side panel | Toggle side panel |
| Drag | Move on hill | Drag left → un-done if `< 100` |
| Double-click (overview) | Drill into project | N/A (no drill from stack) |
| Ghost trail when selected | Yes (iteration 15) | No (v1) |
| Staleness satellites | Per iteration 17 | No (position 100 skips) |

**Project to 100 with open tasks:** drag/slider stops at 99; no error toast in v1
(panel may show position 99 — optional future hint out of scope).

---

## 8. Data flow

1. Store holds `position` on each trackable; 100 = done.
2. Views build markers → `partitionMarkers` → hill + stack.
3. User drags task to 100 on project view → task leaves curve, appears in stack.
4. User tries to drag project to 100 with incomplete tasks → clamped to 99 on curve.
5. When all tasks are 100, user drags project to 100 → project moves to stack.
6. User drags stack dot left → `setPosition(id, n)` with `n < 100` → dot returns to curve.

---

## 9. Tests

### 9.1 `src/domain/doneRules.test.ts`

- `allTasksDone`: empty tasks, all at 100, one at 99.
- `clampProjectDonePosition`: task passthrough; project with open tasks → 99; all
  done → 100.

### 9.2 `src/stores/hillChart.test.ts`

- `setPosition` on project with incomplete task cannot reach 100.
- `setPosition` on project when all tasks at 100 can reach 100.

### 9.3 `src/composables/chartMarkers.test.ts`

- `partitionMarkers` splits at 100; done list sorted by name.

### 9.4 Manual verification

- [ ] One done project on overview → single dot in stack, curve clean at x=100
- [ ] Two+ done → "+ N more"; expand shows names; outside click collapses
- [ ] Click stack dot → side panel; drag left → dot on curve
- [ ] Project with open task cannot reach 100 (chart + slider)
- [ ] All tasks done → project can reach 100 and enter stack
- [ ] Project view: done tasks stack; active tasks on curve
- [ ] `npm run lint && npm run test && npm run build`

---

## 10. Files touched

| File | Change |
|------|--------|
| `src/domain/doneRules.ts` | Project completion guard helpers |
| `src/domain/doneRules.test.ts` | Unit tests |
| `src/composables/chartMarkers.ts` | `partitionMarkers` |
| `src/composables/chartMarkers.test.ts` | Partition tests |
| `src/composables/useHillDrag.ts` | Shared pointer → position mapping |
| `src/components/DoneStack.vue` | Stack UI, expand/collapse, drag, click |
| `src/components/HillChart.vue` | Use shared drag composable; optional `defineExpose` |
| `src/views/OverviewView.vue` | Chart wrapper + stack |
| `src/views/ProjectView.vue` | Chart wrapper + stack |
| `src/stores/hillChart.ts` | Wire `clampProjectDonePosition` in `setPosition` |
| `src/stores/hillChart.test.ts` | Project-done guard tests |
| `docs/domain-vocabulary.md` | Done stack terms |
| `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` | Mark iteration 18 done + link doc when shipped |

---

## 11. Spec self-review

- [x] All brainstorm decisions captured (stack threshold A, both views, drag, click,
  collapsed N=1 vs N≥2, inline expand, project guard).
- [x] No schema change — done remains `position === 100`.
- [x] Peak clamp and blocker snap-back unchanged; guard runs after peak clamp.
- [x] Parent spec open question #3 resolved: always stack when ≥1 done (not
  "max 4 inline on curve").
- [x] Scope fits single iteration; no iteration 19/20 pull-forward.

---

## 12. Roadmap update (when implementation ships)

- Set iteration 18 status to **done** in
  `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md`.
- Add row to **Completed iteration docs** table linking this file.
- Update **Current codebase snapshot** bullet for done stack.
