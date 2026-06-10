# werkwink — Iteration 2: Project View + Tasks (design)

**Date:** 2026-05-29
**Status:** Approved
**Parent spec:** `docs/werkwink-design-spec.md` (full v1)
**Builds on:** `docs/superpowers/specs/2026-05-27-werkwink-iteration-1-scaffold-hill-mechanic-design.md`

**Naming (current code):** [`docs/domain-vocabulary.md`](../../domain-vocabulary.md). This doc uses historical names (`DotView`, `Dot.vue`, etc.).

Extends the hill mechanic to the two-level model. The `/projects/:id` view goes
live: one large project dot plus its smaller task dots, all in the project's
color, all draggable along the curve. Double-clicking a project dot on the
overview drills in. No persistence, no creation UI, no side panel.

---

## 1. Goal

A running `/projects/:id` view that renders a full-screen hill with:

- one **large project dot** (the same `position` the overview drags);
- its **smaller task dots**, each in the project color, each draggable;
- a **name label** and **`↑N ↓N` force badge** on every dot;
- a header with a **back-arrow to `/projects`** and the **project name**.

Double-clicking a project dot on the overview navigates here. Sample data gains
tasks so the view is populated on first look.

This is enough to feel the two-level model — projects and their tasks living on
the same uncertainty curve, positioned independently — without building editing,
persistence, or the side panel.

---

## 2. Stack

Unchanged from iteration 1 (Vue 3 + Composition API, Vite, TypeScript, Pinia,
Vue Router HTML5 history, Tailwind v4 tokens, Vitest, native SVG + pointer
events). No new dependencies.

---

## 3. Architecture

The central change is making `HillChart.vue` **presentational** so both views
can reuse it. Today it imports the store and renders all project dots itself;
that does not generalize to a second view.

### 3.1 `HillChart.vue` — presentational

- **Props:** `dots: DotView[]` where

  ```ts
  interface DotView {
    id: string
    position: number // 0–100
    color: string // resolved palette hex
    radius: number
    name: string
    up: number // active up-force count
    down: number // active down-force count
  }
  ```

- **Emits:** `move(id: string, position: number)` and `open(id: string)`.
- Owns the curve rendering (`curvePath`, baseline, fill), the pointer-drag loop,
  and double-click detection. **No store import.**
- Renders one `Dot` per `DotView`, mapping `position` → `curveX`/`curveY`.

### 3.2 Views supply their dot sets

- **`OverviewView.vue`** — maps `store.projects` → `DotView[]` (radius 16). Wires
  `@move` → `store.setPosition`, `@open` → `router.push('/projects/' + id)`.
- **`ProjectView.vue`** — resolves the project by route `id`; builds
  `[projectDot(radius 22), ...taskDots(radius 11)]`; wires `@move` →
  `store.setPosition`. Ignores `@open`. Unknown `id` → redirect to `/projects`.

### 3.3 Store

**No new actions.** `setPosition(id, pos)` already resolves task ids via
`findDot`, which searches `project.tasks`. Dragging a task or the project dot
both route through it.

### 3.4 Sample data

`data/sample.ts` gains tasks on ~2 of the 4 projects (each task with a primary
"Owner" up force plus a mix of additional up/down forces, positions spread across
the curve). The remaining projects stay task-less to show the lone-dot case.

### 3.5 Pure helper (testable)

A pure `toDotViews(project): DotView[]` builds the project view's dot set
(project dot + task dots, with active force counts and radii). Keeps the view
thin and the mapping unit-testable. The overview's mapping is trivial enough to
stay inline, or share the same active-count helper.

---

## 4. Interaction

### 4.1 Double-click to drill in

The dot `<g>` listens for native `dblclick` and emits `open(id)`; the overview
pushes the route. Drag still starts on `pointerdown`.

**Risk:** `preventDefault()` on `pointerdown` can suppress synthetic mouse
events in some browsers. **Mitigation:** keep `preventDefault` for drag (stops
text selection), rely on native `dblclick`, and if it proves unreliable, fall
back to manual double-tap detection (two `pointerup`s within ~300 ms with
negligible pointer movement). The working path is confirmed during
implementation.

### 4.2 Project dot ↔ overview consistency

Both views read and write the same `project.position` via `setPosition`, so
dragging the large dot in the project view moves it on the overview too — no
extra wiring, just shared state.

### 4.3 Task drag

Identical mechanic to project dots: `pointerdown` → `pointermove` →
`positionFromRatio` → `setPosition(taskId, pos)` → `pointerup`. `y` is always
derived from the curve, so a task can never leave it.

### 4.4 Overlap

The project dot and tasks may share an x and overlap. Per the parent spec's
deferral, **no** leader-line / overlap resolution this iteration — plain labels.

---

## 5. Visuals

- **Project dot:** radius ~22, cream stroke 2 px (as today) — the anchor.
- **Task dots:** radius ~11, same project color, thinner stroke (~1.5 px) so
  they read as children. Name label + `↑N ↓N` badge, same as project dots.
- **Header:** back-arrow link "← Overview" + project name in Fraunces. **No**
  `+ Task` button this iteration (creation deferred).
- **Empty tasks:** a task-less project shows only its large dot — no special
  empty state.

---

## 6. Testing

- Keep existing `useHillCurve` tests.
- Add Vitest unit tests on the pure `toDotViews(project)` helper: returns one
  project dot at the project radius plus N task dots, in project color, with
  correct active up/down counts.
- DOM drag / double-click interaction stays manual (as in iteration 1).
- `npm run build` (`vue-tsc --noEmit && vite build`) must pass.

---

## 7. Out of scope this iteration

Deferred to later iterations (all specified in the parent spec):

- `localStorage` persistence (`pinia-plugin-persistedstate`) — still re-seeds
  from `sample.ts` each load.
- Side panel; force add / edit / resolve UX.
- `+ Task` / `+ Project` manual creation UI.
- Snapshots, "End daily", position trail.
- Staleness satellites.
- Done-dot stacking column.
- Peak-crossing auto-resolve of forces.
- Import / Export / Clean.
- Landing-page content (kept as a stub).
- Leader-line / overlap resolution for labels.
- The separate tracker-import Claude skill.

---

## 8. Delivery

- Work happens on a **new branch**.
- Commits are authored as Roman only — no Claude mentions / no Co-Authored-By
  trailer.
- No PR is opened by the agent; Roman creates the PR.
- Done when double-clicking a project dot on `/projects` opens its
  `/projects/:id` view with a draggable large project dot plus draggable task
  dots and `↑/↓` badges, `npm run build` succeeds, and the unit tests pass.
