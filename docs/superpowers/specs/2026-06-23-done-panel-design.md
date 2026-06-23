# werkwink — Done panel (design)

**Date:** 2026-06-23  
**Status:** Approved (brainstorm)  
**Parent spec:** `docs/werkwink-design-spec.md` (§2 Done, §4.2–4.4)  
**Supersedes UI portions of:** `docs/superpowers/specs/2026-06-07-werkwink-iteration-18-done-stack-design.md` (chart overlay stack)  
**Builds on:** iteration 18 (`partitionMarkers`, `DONE_POSITION`), stable panel layout (`ChartWorkspace` grid)

Completed projects and tasks move from the bottom-right **done stack** overlay into the
**reserved right column**, visible only when no dot is selected. Row click opens the
existing side panel; a hover-revealed **Restore** action returns the item to the hill at
position **50**.

---

## 1. Goal

After this change:

- **Done panel** — right `20rem` column shows a scrollable list of done markers when
  `selectedTrackableId` is null and `doneMarkers.length ≥ 1`.
- **Side panel swap** — selecting any dot (chart or done row) replaces the done panel
  with `SidePanel`; closing selection returns to the done panel (or empty column).
- **Panel card chrome** — `DonePanel` matches `SidePanel` visual language (cream card,
  Fraunces heading, hill-sand ring/shadow). Rows show **dot + name only** — no ↑↓
  force counts.
- **Restore** — hover-revealed `↩ Restore` per row; click runs `setPosition(id, 50)`
  without opening the panel. Item leaves the done list and appears on the curve at the
  peak.
- **Remove done stack** — delete `DoneStack.vue` overlay from the chart; no drag-from-
  stack to un-done.
- **Domain unchanged** — done remains `position === 100`; `partitionMarkers` pipeline
  unchanged; project-done guard unchanged.

**Out of scope:** Mobile/touch fallback for hover-reveal; `previousPosition` storage;
restore position picker; changing done definition; ghost trails for done items.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Placement | **Right panel slot** — reuse stable-layout column; swap with `SidePanel` |
| Empty column | **No placeholder** when 0 done (same as today when nothing selected) |
| Surfaces | **Overview + project view** — done projects / done tasks (+ project if at 100) |
| List chrome | **Panel card** — sibling to `SidePanel`, not bare list |
| Force counts | **Hidden** — not shown on done rows |
| Row click | **Select + open `SidePanel`** (done panel hides) |
| Restore UI | **Hover-reveal** `↩ Restore` at row end |
| Restore position | **Fixed 50** (peak) via `setPosition` |
| Un-done via drag | **Removed** — no stack drag; slider in panel still works |
| Sort order | **Name ascending** — keep `partitionMarkers` done sort |
| Architecture | **New `DonePanel.vue`** in column; remove `DoneStack` (approach A) |

Rejected alternatives:

- **Left sidebar** — wastes reserved panel column.
- **Keep chart overlay stack** — doesn't use empty panel slot.
- **Collapsed chips in panel** — extra click before names during dailies.
- **Always-visible restore button** — user chose hover-reveal for calmer list.
- **Drag from panel to hill** — user chose explicit restore control.

---

## 3. Layout & visibility

Grid unchanged: `grid-cols-[minmax(0,1fr)_20rem]` in `ChartWorkspace.vue`.

| State | Right column |
|-------|----------------|
| No selection, ≥1 done | `DonePanel` |
| Dot selected | `SidePanel` |
| No selection, 0 done | Empty (cream gap) |

Chart column receives only **active** markers (`position < 100`). Done markers never
render on the curve or as a chart overlay.

---

## 4. `DonePanel.vue`

### 4.1 Container

Match `SidePanel` shell:

```html
<aside
  class="relative w-80 shrink-0 rounded-2xl bg-cream p-5 shadow-sm ring-1 ring-hill-sand/60"
  aria-label="Completed work"
  data-testid="done-panel"
>
```

### 4.2 Header

- **Title:** `Done` — `font-heading` (Fraunces), same scale as panel section titles.
- **Subtitle:** `{n} completed` — `text-sm text-text-warm/60` (omit subtitle when
  `n === 1` optional; default show always for consistency).

### 4.3 List

- `ul` with `max-h-[calc(100vh-12rem)] overflow-y-auto` (or similar) when list is long.
- Each `li` row:
  - `flex items-center gap-2 rounded-lg px-1 py-1.5 cursor-pointer`
  - `hover:bg-hill-sand/40`
  - **Dot chip:** 24px circle, `backgroundColor: marker.color`, `ring-2 ring-cream`,
    `shrink-0`
  - **Name:** `text-sm truncate flex-1 min-w-0`
  - **Restore (hover only):** `opacity-0 group-hover:opacity-100` on a `group` row;
    label `↩ Restore`; `text-xs text-text-warm/60 hover:text-text-warm`; `shrink-0`
    - `@click.stop` → emit `restore(id)`
    - `aria-label="Restore to hill"` on the control
  - Row `@click` → emit `click(id)`

Desktop-only assumption (v1) makes hover-reveal acceptable; no touch fallback in v1.

### 4.4 Props & emits

```ts
defineProps<{
  doneMarkers: ChartMarker[]
}>()

defineEmits<{
  click: [id: string]
  restore: [id: string]
}>()

```

No `selectedId` prop — selection opens `SidePanel`, so done panel is unmounted/hidden
while selected.

---

## 5. `ChartWorkspace.vue` integration

Replace `DoneStack` in chart wrapper with column logic:

```vue
<div class="w-80 shrink-0">
  <DonePanel
    v-if="!selectedTrackableId && doneMarkers.length"
    :done-markers="doneMarkers"
    @click="(id) => emit('click', id)"
    @restore="(id) => emit('restore', id)"
  />
  <SidePanel
    v-else-if="panelProject && selectedTrackableId"
    …
  />
</div>
```

New emit: `restore: [id: string]`.

Parent views (`OverviewView`, `ProjectView`) handle restore:

```ts
function onRestore(id: string) {
  store.setPosition(id, 50)
  // Do not set selectedTrackableId — user stays on done panel if other items remain
}
```

Remove `DoneStack` import, props (`svgRef` for stack drag), and chart `absolute`
overlay.

---

## 6. Interaction matrix

| Action | Active dot on chart | Done row in panel |
|--------|---------------------|-------------------|
| Click | Toggle side panel | Select → side panel |
| Restore (hover) | — | `setPosition(id, 50)`; no selection |
| Drag on chart | Move on hill | — |
| Position slider (panel) | Move on hill | Can move below 100 while panel open |
| Double-click (overview) | Drill into project | N/A |

**Restore at 50:** Peak clamp applies if active down forces exist (unlikely at done).
`lastMovedAt` updates via existing `setPosition`. Project-done guard does not block
restore (target is 50, not 100).

**After restore:** Item appears on curve; done panel re-renders without that row. If it
was the last done item, right column becomes empty.

---

## 7. Removal & cleanup

| Item | Action |
|------|--------|
| `src/components/DoneStack.vue` | Delete |
| `src/components/DoneStack.test.ts` | Replace with `DonePanel.test.ts` |
| `useHillDrag` in done stack | No longer needed for done UI |
| `docs/werkwink-design-spec.md` §2 Done | Update copy: panel not stack (separate chore or same PR) |

Keep `partitionMarkers`, `doneRules`, `DONE_POSITION` unchanged.

---

## 8. Tests

### 8.1 `DonePanel.test.ts`

- Renders nothing when parent gates `v-if` (test component with markers).
- Renders header and row names for multiple markers.
- Row click emits `click` with id.
- Restore click emits `restore` with id; does not emit `click` (`@click.stop`).

### 8.2 `ChartWorkspace` (optional)

- When `selectedTrackableId` null and done markers present → `data-testid="done-panel"`.
- When selected → `SidePanel`, no done panel.

### 8.3 Manual verification

- [ ] Overview: done projects in right panel when nothing selected; chart has no overlay
- [ ] Click done row → side panel; close → done panel returns
- [ ] Hover row → Restore visible; click → dot at peak (50) on chart
- [ ] Restore does not open side panel
- [ ] 0 done → empty right column
- [ ] Project view: done tasks listed; project at 100 included
- [ ] Slider in panel can still move item below 100
- [ ] `npm run lint && npm run test && npm run build`

---

## 9. Files touched

| File | Change |
|------|--------|
| `src/components/DonePanel.vue` | New done list panel |
| `src/components/DonePanel.test.ts` | Unit tests |
| `src/components/ChartWorkspace.vue` | Column swap; `restore` emit; remove `DoneStack` |
| `src/views/OverviewView.vue` | Wire `onRestore` |
| `src/views/ProjectView.vue` | Wire `onRestore` |
| `src/components/DoneStack.vue` | Delete |
| `src/components/DoneStack.test.ts` | Delete |
| `docs/domain-vocabulary.md` | Done panel terms |
| `docs/werkwink-design-spec.md` | Done UI description (panel vs stack) |

---

## 10. Spec self-review

- [x] All brainstorm decisions captured (placement, card chrome, no forces, click →
  panel, hover restore to 50, no stack drag).
- [x] Consistent with stable panel layout — same column, no reflow.
- [x] No schema change; restore uses existing `setPosition`.
- [x] Supersedes iteration-18 **UI placement** only; domain rules preserved.
- [x] Scope fits single implementation plan.
