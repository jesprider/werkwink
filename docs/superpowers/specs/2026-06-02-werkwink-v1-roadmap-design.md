# werkwink — v1 roadmap (iterations 3–20)

**Date:** 2026-06-02  
**Status:** Approved (sequencing)  
**Parent spec:** `docs/werkwink-design-spec.md` (full v1)  
**Completed:** iterations 1–2 (see below)

This document is the **backlog and handoff guide** for remaining v1 work. Each
iteration should get its own branch and a focused design doc (same pattern as
iterations 1–2) before implementation. Pick the **lowest-numbered iteration
whose status is `pending`** and work only that scope.

---

## How to pick up the next task (for humans and AI)

1. Read `docs/werkwink-design-spec.md` for full product behavior.
2. Read `docs/domain-vocabulary.md` for code naming (Project, Task, HillTrackable, ChartMarker).
3. Read this file — find the first iteration with status **pending**.
4. Read the completed iteration specs for context:
   - `docs/superpowers/specs/2026-05-27-werkwink-iteration-1-scaffold-hill-mechanic-design.md`
   - `docs/superpowers/specs/2026-05-29-werkwink-iteration-2-project-view-tasks-design.md`
5. Create a **new branch** off `main` — never commit on `main`. Name per
   `AGENTS.md`: `feature/iteration-{N}-{slug}` (e.g.
   `feature/iteration-3-persist-state`). Design-doc-only work may use
   `docs/iteration-{N}-{slug}` when there is no code yet.
6. Write a short iteration design doc:
   `docs/superpowers/specs/YYYY-MM-DD-werkwink-iteration-N-<slug>-design.md`
7. Implement **only** that iteration’s deliverables; do not pull forward later
   iterations.
8. Verify: `npm run build` (and unit tests where the iteration adds them).
9. Do **not** open a PR unless the user asks; commits authored as Roman only (no
   Co-Authored-By / Claude mentions), per prior iteration delivery notes.

**Current codebase snapshot (after iteration 19):**

- Live: `/projects` overview, `/projects/:id` project view, draggable dots,
  `↑/↓` badges, double-click overview → drill-in, side panel, import/export,
  end-daily snapshots.
- Hill chart: ghost trail of last 10 snapshots behind the **selected** dot
  (opacity ramp oldest → newest); ghost trails keep project color.
- Staleness: red **satellites** on the upper arc of live dots (one per day without
  movement from day 2, max 4); side panel shows days without movement; skipped at
  position 100. Ghost trails keep project color.
- Peak: drag/slider clamp at 50 with active blockers; panel hint at peak.
- Done stack: bottom-right column for dots at position 100; collapsed chips + "+ N more" when N≥2; drag back onto hill to un-done.
- Side panel: danger zone delete for projects (cascades tasks) and tasks with confirm.
- Store: persist plugin; force mutations; remove project/task.

---

## Progress tracker

| Iter | Slug | Status | Milestone |
|------|------|--------|-----------|
| 1 | scaffold-hill-mechanic | **done** | — |
| 2 | project-view-tasks | **done** | — |
| 3 | persist-state | **done** | M1 |
| 4 | overview-chrome | **done** | M1 |
| 5 | side-panel-readonly | **done** | M2 |
| 6 | store-force-mutations | **done** | M2 |
| 7 | panel-force-ux | **done** | M3 |
| 8 | panel-dot-edits | **done** | M3 |
| 9 | overview-click-drill | **done** | M3 |
| 10 | add-project | **done** | M4 |
| 11 | add-task | **done** | M4 |
| 12 | import | **done** | M4 |
| 13 | export-clean | **done** | M4 |
| 14 | end-daily | **done** | M5 |
| 15 | trail-on-chart | **done** | M5 |
| 16 | peak-crossing | **done** | M6 |
| 17 | staleness-satellites | **done** | M6 |
| 18 | done-stack | **done** | M6 |
| 19 | panel-delete | **done** | M6 |
| 20 | landing-page | **pending** | M6 |

Update the **Status** column to `done` when an iteration ships (and link its
design doc in a new “Completed iteration docs” subsection at the bottom).

---

## Milestones (team-testing readiness)

| Milestone | You can… | After iteration |
|-----------|----------|-----------------|
| **M1 — Trust the app** | Refresh without losing work; overview looks like a product | 4 |
| **M2 — Inspect a dot** | Click → see name, position, forces (read-only) | 6 |
| **M3 — Run the conversation** | Add/resolve forces; rename; slider position; overview panel + drill | 9 |
| **M4 — Own your data** | Create projects/tasks; import JSON; export/clean round-trip | 13 |
| **M5 — Close the daily** | End daily → snapshots; ghost trail on chart | 15 |
| **M6 — Full v1 polish** | Peak rule, staleness, done stack, delete, landing | 20 |

**First team dry-run target:** end of **M5** (iteration 15). Iterations 16–20
improve the pilot but are not blocking for a first standup.

**Optional deferrals** (can slip past M5): 17 staleness, 18 done stack, 20
landing page fullness, label leader-lines (already deferred in parent spec).

---

## Sequencing approach

**Vertical slices** (recommended and locked in): each iteration ships one thin,
user-visible (or infrastructure-critical) capability. Avoid horizontal “build
all store actions first” unless an iteration explicitly says store-only.

**Rationale for order:** persist before team use → panel read-only before force
editing → forces before import-heavy workflows → I/O before end-daily trail →
visual rules and landing last.

**Peak & blockers (amended 2026-06-03):** Crossing the peak no longer
auto-resolves forces. Active down forces block drag past 50 (iteration 16).
Adding or re-activating a down force while downhill snaps the dot to 45
(iteration 6). See iteration 6 design doc and parent spec §2 (to be updated).

---

## Iteration details

### Iteration 3 — Persist state

**Goal:** State survives browser refresh.

**Deliverables:**

- Add `pinia-plugin-persistedstate`; persist full store under key
  `hill-chart-state` (per parent spec §7).
- On first visit (empty storage), seed from `sample.ts` once; thereafter hydrate
  from `localStorage`.
- Confirm dragging still updates persisted state.

**Out of scope:** Import/export; changing schema shape.

**Likely touch:** `main.ts`, `stores/hillChart.ts`, `package.json`.

**Tests:** Optional store hydration test; `npm run build` required.

---

### Iteration 4 — Overview chrome

**Goal:** `/projects` has the header bar from the design spec; controls are
visible but not yet functional.

**Deliverables:**

- Shared header component (or app shell) on overview (and align project view
  header styling where it already has back + name).
- **Working:** app name links to `/`.
- **Stubbed:** Import, Export, Clean, + Project, End daily — rendered as pill
  buttons, disabled or no-op (no store actions).

**Out of scope:** Wiring any button to real behavior.

**Why separate:** Layout-only PR; later iterations attach handlers without
restructuring the page.

**Likely touch:** `App.vue`, `views/OverviewView.vue`, maybe
`views/ProjectView.vue`, new `components/AppHeader.vue`.

---

### Iteration 5 — Side panel (read-only)

**Goal:** Click a dot on the **project view** → right-hand panel shows dot
details; no editing yet.

**Deliverables:**

- `SidePanel.vue` (read-only sections): header (name, type badge, source link if
  present), position display, active up/down forces lists, past sections
  (collapsible), no forms.
- `selectedTrackableId` in app shell — panel is component state, not in the URL
  (parent spec §4.4).
- `HillChart` / `ChartMarker`: emit **click** (distinct from drag and from
  `dblclick` drill on overview) for project view only in this iteration.

**Out of scope:** Overview click-to-panel; force add/resolve; slider; delete.

**Likely touch:** `App.vue`, `components/SidePanel.vue`, `ChartMarker.vue`,
`HillChart.vue`, `views/ProjectView.vue`.

---

### Iteration 6 — Store: force mutations

**Goal:** Pinia actions for force lifecycle; panel stays read-only — test via
unit tests only.

**Design doc:** `docs/superpowers/specs/2026-06-03-werkwink-iteration-6-store-force-mutations-design.md`

**Deliverables:**

- Actions: `addForce(trackableId, direction, label, owner?)`, `updateForce`,
  `resolveForce(trackableId, forceId, reason?)`, `unresolveForce`.
- Preserve `isPrimary` assignee rules (cannot resolve primary).
- **Blocker snap-back:** when a down force becomes active and `position > 50`,
  set `position` to **45** and update `lastMovedAt` (`addForce` down,
  `unresolveForce` down). Shared constants in `src/domain/forceRules.ts`.
- Vitest coverage on `forceRules` helpers and store actions.

**Out of scope:** Panel forms (iteration 7); peak drag clamp (iteration 16).

**Likely touch:** `src/domain/forceRules.ts`, `stores/hillChart.ts`,
`stores/hillChart.test.ts`.

---

### Iteration 7 — Panel: force UX

**Design doc:** `docs/superpowers/specs/2026-06-04-werkwink-iteration-7-panel-force-ux-design.md`

**Goal:** Manager can manage forces during the daily from the side panel.

**Deliverables:**

- `ForceChip.vue`, `ForceAddForm.vue` (inline label/owner; Enter save, Esc cancel).
- Wire to iteration 6 actions; resolve ✓ on chips; unresolve from past sections.
- **`+ Down force` always available** — store snaps dot to 45 if downhill
  (iteration 6); primary force has no resolve button.

**Out of scope:** Peak drag clamp and panel hint (iteration 16); name/position
edit (iteration 8).

---

### Iteration 8 — Panel: dot edits

**Goal:** Edit dot metadata without opening a separate modal.

**Deliverables:**

- Inline editable name in panel header.
- Position slider 0–100 → calls existing `setPosition`.
- Display/edit external `source` link when present (parent spec §4.4 header).

**Out of scope:** Delete dot (iteration 19).

---

### Iteration 9 — Overview click + drill

**Goal:** Consistent interaction on overview and project view.

**Deliverables:**

- Overview: **single-click** dot → side panel for that project.
- Panel: **“Open project →”** navigates to `/projects/:id`.
- Decide and document in iteration doc: keep **double-click** drill on overview
  as shortcut, or remove in favor of panel-only drill (parent spec §5.2 default:
  panel button; double-click was iteration 2 convenience).
- Project view: click still opens panel (iteration 5 behavior retained).

**Out of scope:** New store features.

---

### Iteration 10 — + Project

**Goal:** Manually add a project from the overview.

**Deliverables:**

- Modal: name, optional external URL (infer `source.system` / `source.id` from
  known URL patterns where possible).
- `addProject`: round-robin color, `position: 0`, primary up force Owner
  (empty owner).
- Wire overview header **+ Project** (iteration 4 stub).

**Out of scope:** + Task (iteration 11).

---

### Iteration 11 — + Task

**Goal:** Manually add a task from the project view.

**Deliverables:**

- Side panel create (no modal): `addTask(projectId, …)` on store; auto-select new
  task in panel for name, link, position, and forces (same pattern as iteration 10).
- **+ Task** in project view header (parent spec §4.3).

---

### Iteration 12 — Import

**Goal:** Load tracker-exported JSON into an empty store.

**Deliverables:**

- `schema/validate.ts` — validate against types / schema; surface errors.
- Import UI: file picker and/or drag-drop; only when store is empty (parent
  spec §5.4).
- Overview empty state CTAs: Import + link to landing (parent spec §4.2).
- Wire header Import (replace stub).

**Out of scope:** Export, Clean (iteration 13).

---

### Iteration 13 — Export & Clean

**Goal:** Round-trip workflow Export → skill edit → Clean → Import.

**Deliverables:**

- Export: download `hill-chart-<timestamp>.json`.
- Clean: confirm dialog; wipe store; re-enable Import.
- Wire header Export and Clean.

---

### Iteration 14 — End daily

**Goal:** Explicit snapshot commit for today’s standup.

**Deliverables:**

- `endDaily()`: for every project and task dot, set snapshot for **today’s
  calendar date** (replace if exists); parent spec §5.3.
- Wire header **End daily**; no confirmation modal in v1.

**Out of scope:** Rendering trail on chart (iteration 15).

---

### Iteration 15 — Trail on chart

**Goal:** Visual history behind each dot during the daily.

**Deliverables:**

- Render last **10** snapshots as ghost dots (opacity ramp oldest ~10% → newest
  ~70%; current dot 100%); parent spec §5.7.
- No connecting line between ghosts (parent spec open question #4).

**Out of scope:** Side-panel snapshot history chart (removed from v1).

---

### Iteration 16 — Peak crossing

**Goal:** Block entering the downhill while active blockers remain; surface why
in the panel.

**Replaces:** parent spec auto-resolve-on-cross (amended 2026-06-03).

**Deliverables:**

- In `setPosition`, when the new position would cross **50** going right and
  the dot has **any active down force**, clamp to **50** (reuse
  `PEAK_POSITION` / `canCrossPeak` from `forceRules.ts`).
- Side panel: inline hint when dot is at the peak with active downs — *“Active
  blockers must be resolved before moving downhill.”* (shown in position
  section; iteration 8 slider inherits the same clamp).
- Import/load: do not rewrite positions; guard applies on next drag or slider
  edit only.

**Already shipped in iteration 6:** adding/re-opening a down force while
`position > 50` snaps to **45** (`BLOCKER_SNAP_POSITION`).

---

### Iteration 17 — Staleness satellites

**Goal:** Dots that haven’t moved in days show warning satellites; panel states how long.

**Deliverables:**

- `src/domain/staleness.ts`: `daysSinceLastMove`, `stalenessSatelliteCount`,
  `daysWithoutMovement`; constants `STALE_RED`, `STALENESS_MAX_SATELLITES`,
  `STALENESS_SATELLITE_START_DAY`, `DONE_POSITION`.
- `ChartMarker.stalenessSatellites` via `chartMarkers.ts`; render on
  `MarkerChart.vue` (upper arc, left → right, max 4).
- Side panel Position section: “N day(s) without movement” when
  `daysSinceLastMove ≥ 1`; skipped at position 100.
- Main dot fill stays project palette; ghost trails unchanged.

**Design doc:** `docs/superpowers/specs/2026-06-07-werkwink-iteration-17-staleness-design.md`

---

### Iteration 18 — Done stack

**Goal:** Keep x=100 readable when many dots are done.

**Deliverables:**

- `DoneStack.vue`: collapsed column bottom-right, “+ N more”, expand to list
  (parent spec §2, open question #3 default: stack when ≥1 done).
- Done dots remain draggable back from 100.

---

### Iteration 19 — Panel delete

**Goal:** Remove mistaken projects and tasks from the side panel.

**Deliverables:**

- Danger zone: collapsed `<details>` with **Delete project** / **Delete task**;
  `window.confirm` before removal.
- Store `removeProject` / `removeTask` (project delete cascades tasks).
- Update parent spec to drop side-panel sparkline (chart ghost trail unchanged).

**Out of scope:** Side-panel position sparkline; force delete; undo.

**Design doc:** `docs/superpowers/specs/2026-06-10-werkwink-iteration-19-panel-delete-design.md`

---

### Iteration 20 — Landing page

**Goal:** Cold visitors understand the app (parent spec §4.1).

**Deliverables:**

- Expand `LandingView.vue`: hero, hill explainer, forces explainer, daily ritual
  steps, primary CTA, secondary Import link, **privacy note** (localStorage only,
  no shared backend — parent spec §8.7).

**Out of scope:** Tracker import skill (separate package per parent spec §9).

---

## Not in this roadmap (parent spec §10 / §9)

- Multi-user, auth, sync, backend
- Mobile / responsive
- Direct tracker API from the app
- Tracker import **skill** (separate repo: `hill-chart-skill/`)
- Keyboard shortcuts, undo/redo
- Cloudflare deploy automation (only `_redirects` exists today)
- Label leader-lines / overlap resolution

---

## Completed iteration docs

| Iter | Design doc |
|------|------------|
| 1 | `docs/superpowers/specs/2026-05-27-werkwink-iteration-1-scaffold-hill-mechanic-design.md` |
| 2 | `docs/superpowers/specs/2026-05-29-werkwink-iteration-2-project-view-tasks-design.md` |
| 3 | `docs/superpowers/specs/2026-06-02-werkwink-iteration-3-persist-state-design.md` |
| 6 | `docs/superpowers/specs/2026-06-03-werkwink-iteration-6-store-force-mutations-design.md` |
| 7 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-7-panel-force-ux-design.md` |
| 8 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-8-panel-dot-edits-design.md` |
| 9 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-9-overview-click-drill-design.md` |
| 10 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-10-add-project-design.md` |
| 11 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-11-add-task-design.md` |
| 12 | `docs/superpowers/specs/2026-06-04-werkwink-iteration-12-import-design.md` |
| 13 | `docs/superpowers/specs/2026-06-06-werkwink-iteration-13-export-clean-design.md` |
| 14 | `docs/superpowers/specs/2026-06-06-werkwink-iteration-14-end-daily-design.md` |
| 15 | `docs/superpowers/specs/2026-06-07-werkwink-iteration-15-trail-on-chart-design.md` |
| 16 | `docs/superpowers/specs/2026-06-07-werkwink-iteration-16-peak-crossing-design.md` |
| 17 | `docs/superpowers/specs/2026-06-07-werkwink-iteration-17-staleness-design.md` |
| 18 | `docs/superpowers/specs/2026-06-07-werkwink-iteration-18-done-stack-design.md` |
| 19 | `docs/superpowers/specs/2026-06-10-werkwink-iteration-19-panel-delete-design.md` |

---

## Spec self-review (2026-06-03)

- No TBD placeholders in iteration scopes.
- Order matches brainstorm: vertical slices, M1–M6 gates, team dry-run at M5.
- Iteration 4 “stub header” matches user clarification (chrome only).
- Click semantics: iteration 5 project-only click; iteration 9 unifies overview
  with panel drill — consistent with parent spec default.
- Peak rule amended: iteration 6 snap-back + iteration 16 drag clamp replace
  auto-resolve-on-cross; parent spec §2 updated 2026-06-03.
- Branch names: `feature/iteration-{N}-{slug}` per `AGENTS.md` (legacy
  `iteration-{N}-{slug}` without prefix = iterations 1–5 only).
