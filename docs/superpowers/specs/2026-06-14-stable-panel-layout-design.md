# werkwink — Stable panel layout (design)

**Date:** 2026-06-14  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.4 side panel, §6 layout)  
**Context:** Post-refactor UI polish — prevent hill chart resize/jump when side panel opens

Opening the side panel currently mounts `SidePanel` with `v-if`, stealing ~344px
from a flex row capped at `max-w-[1400px]`. The chart shrinks and the centered
container shifts left.

---

## 1. Goal

After this change:

- The hill chart **does not change size or horizontal position** when selecting,
  deselecting, or switching dots on overview or project view.
- The workspace uses **full available width** (within view `px-6` padding).
- A **fixed-width right column** (`20rem` / `w-80`) is always reserved for the
  panel — empty cream space when nothing is selected, panel card when open.

**Out of scope:** Responsive/mobile panel collapse; placeholder copy in the empty
column; changes to `SidePanel` internals, chart SVG, or selection logic.

---

## 2. Root cause

`ChartWorkspace.vue`:

```html
<div class="mx-auto flex max-w-[1400px] items-start gap-6">
  <div class="relative min-w-0 flex-1">…chart…</div>
  <SidePanel v-if="panelProject && selectedTrackableId" />
</div>
```

`SidePanel` is `w-80 shrink-0`. Conditional mount changes total flex width and
causes `flex-1` chart column to reflow.

---

## 3. Decision (brainstorm)

| Topic | Decision |
|-------|----------|
| Panel column when closed | **Always reserved** — empty, no placeholder |
| Layout mechanism | **CSS Grid** — `grid-cols-[minmax(0,1fr)_20rem]` |
| Max width cap | **Remove** `max-w-[1400px]` and `mx-auto` |
| Panel mount | Column always in DOM; `SidePanel` still `v-if` on selection |
| Width | **20rem** — matches existing `SidePanel` `w-80` |

Rejected alternatives:

- **Flex + permanent empty `aside`** — same outcome, less explicit column contract.
- **Fixed/overlay panel** — chart could use full width when closed; contradicts reserved-column goal.

---

## 4. `ChartWorkspace.vue` changes

### 4.1 Grid shell

Replace the outer flex container:

```html
<div class="grid w-full grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
```

### 4.2 Chart column

Unchanged inner structure — `relative min-w-0` wrapper with `HillChart`,
`DoneStack`, and block message overlay.

### 4.3 Panel column

Always-present right cell:

```html
<aside class="w-80 shrink-0" aria-label="Work item details">
  <SidePanel
    v-if="panelProject && selectedTrackableId"
    :project="panelProject"
    :trackable-id="selectedTrackableId"
    :show-open-project="showOpenProject"
    @close="emit('closePanel')"
  />
</aside>
```

Move `aria-label` from `SidePanel`'s root `<aside>` to the column wrapper when
panel is closed so the landmark still describes the zone. When open, `SidePanel`
keeps its own `aria-label` on its inner `<aside>` — use `aria-hidden="true"` on
the wrapper when panel is open, or drop wrapper `aria-label` and keep only on
`SidePanel` when mounted. **Lock-in:** wrapper is a plain `<div>` with no
aria when empty; `SidePanel` retains `aria-label="Work item details"` when
visible (no duplicate landmarks).

Use:

```html
<div class="w-80 shrink-0">
  <SidePanel v-if="…" … />
</div>
```

### 4.4 Files touched

| File | Change |
|------|--------|
| `src/components/ChartWorkspace.vue` | Grid layout, permanent panel column |

No changes to `OverviewView`, `ProjectView`, or `SidePanel`.

---

## 5. Testing

### Manual

- Overview: note chart width/position → click a dot → panel opens, chart unchanged.
- Click same dot to close → chart unchanged; empty right column visible.
- Switch between dots → no layout shift.
- Project view: same checks for project + task dots.
- Done stack and trail still align with chart.

### Automated (optional)

If `@vue/test-utils` coverage for `ChartWorkspace` is trivial to add, assert outer
element has grid column classes. Not required for merge if manual checks pass.

---

## 6. Verification

```bash
npm run lint && npm run format:check && npm run test && npm run build
```
