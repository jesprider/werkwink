# werkwink — Iteration 11: + Task (design)

**Date:** 2026-06-04  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.3, §5.5)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 11)  
**Builds on:** iteration 10 (+ Project panel-first create), iteration 8 (panel edits),
iteration 7–8 (forces, slider)

Manually add tasks from the project view without a modal: **+ Task** appends a
persisted task with defaults, auto-opens the existing side panel for editing.

---

## 1. Goal

After this iteration:

- On **`/projects/:id`**, **+ Task** in the project header creates a new task dot at
  **position 0** with a primary **Owner** up force (empty owner).
- The new task is **persisted immediately** (Pinia persist unchanged).
- The project view **auto-selects** the new task (`selectedTrackableId`) and opens
  **`SidePanel`** with the Task badge and full iter 7–8 UX.
- The manager refines **name**, **tracker link**, **position**, and **forces** in
  the panel; no duplicate create form.
- Overview **+ Project** and `AppHeader` are unchanged.

**Out of scope:** Modal; `removeTask` / discard (iteration 19); import/export;
overview changes; auto-enter name edit on create; `addProject` changes.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Create UX | **Side panel** — no modal; `addTask(projectId)` then panel edits |
| Persist timing | **Immediate** on `addTask` |
| After create | Auto-set `selectedTrackableId` to new task id |
| Placeholder name | `"New task"` until user renames in panel |
| Accidental create | No discard in v11; delete when iteration 19 ships |
| Unknown `projectId` | No-op; return `''` |
| Primary force | One active up, `label: "Owner"`, `isPrimary: true`; `owner` copied from project’s primary Owner (or `null`) |
| `source` at create | Omitted; optional link added in panel |
| **+ Task** styling | Terracotta pill (match `AppHeader` **+ Project**) |
| `SidePanel` | No changes required for iteration 11 |
| Roadmap “modal” text | Superseded by panel-first pattern (same as iteration 10) |

---

## 3. Architecture

### 3.1 Store — `addTask`

Add to `src/stores/hillChart.ts`:

```ts
addTask(projectId: string): string
```

Returns the new task `id`, or `''` if `projectId` is not found.

Implementation:

| Field | Value |
|-------|--------|
| `id` | `` `task_${crypto.randomUUID()}` `` |
| `name` | `"New task"` |
| `position` | `0` |
| `lastMovedAt` | `new Date().toISOString()` |
| `source` | omitted |
| `forces` | Single primary up force; `owner` = project primary Owner’s `owner` |
| `snapshots` | `[]` |

Push onto `project.tasks` for the matching project. Does not mutate `exportedAt`
or project-level fields.

### 3.2 `ProjectView.vue`

Header layout (conceptual):

- Left: ← Overview link + project name (`h1`).
- Right: **+ Task** button.

Handler:

```ts
function onAddTask() {
  const id = store.addTask(props.id)
  if (id) selectedTrackableId.value = id
}
```

Button classes (align with enabled **+ Project** in `AppHeader.vue`):

`rounded-full bg-terracotta px-4 py-2 text-sm text-cream transition-opacity hover:opacity-90`

Existing `SidePanel` binding unchanged:

```vue
<SidePanel
  v-if="project && selectedTrackableId"
  :project="project"
  :trackable-id="selectedTrackableId"
  @close="selectedTrackableId = null"
/>
```

`lookupInProject` already resolves `kind === 'task'` for task ids.

### 3.3 `SidePanel.vue`

No file changes for iteration 11.

### 3.4 Parity with iteration 10

| Iteration 10 (project) | Iteration 11 (task) |
|------------------------|---------------------|
| `addProject(): string` | `addTask(projectId): string` |
| Overview `AppHeader` emit | `ProjectView` inline button |
| Select project id | Select task id |
| `"New project"` | `"New task"` |
| Round-robin color | N/A (inherits project color on chart) |

---

## 4. Data flow

1. User on `/projects/:id` clicks **+ Task**.
2. `addTask(props.id)` appends task → persist plugin writes `localStorage`.
3. `selectedTrackableId = taskId` → `markersForProject` includes new marker at x=0.
4. `SidePanel` shows task header (Task badge), forces, slider.
5. Edits via `updateTrackable`, `setPosition`, force actions — unchanged.

---

## 5. Error handling & accessibility

- Invalid route id / missing project: existing `watchEffect` redirects to
  `/projects`; **+ Task** not shown when `project` is undefined.
- **+ Task**: focusable `button`, visible label `+ Task`.
- Empty name on panel save still rejected by `updateTrackable` (iteration 8).

---

## 6. Testing

**Required gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

### 6.1 Unit (`hillChart.test.ts`)

| Case | Assert |
|------|--------|
| Returns new id | `task_` prefix; task in correct `project.tasks` |
| Defaults | `name === 'New task'`, `position === 0`, empty snapshots, no `source` |
| Primary Owner force | Same assertions as `addProject` force test |
| Unknown `projectId` | Returns `''`; no new tasks on any project |

### 6.2 Manual

- [ ] **+ Task** → task dot at left (0), panel “New task” + Owner.
- [ ] Rename / link in panel → persists after refresh.
- [ ] Click project dot → panel shows Project badge; task dot → Task badge.
- [ ] Drag task on chart; slider in panel works.
- [ ] Overview **+ Project** still works; no regression.

---

## 7. Files

| File | Action |
|------|--------|
| `src/stores/hillChart.ts` | Add `addTask` |
| `src/stores/hillChart.test.ts` | Tests for `addTask` |
| `src/views/ProjectView.vue` | Header **+ Task** + handler |
| `docs/superpowers/specs/2026-06-04-werkwink-iteration-11-add-task-design.md` | This doc |

**Branch:** `feature/iteration-11-add-task` off `main`.

**Roadmap update (when implementation ships):** set iteration 11 to `done`; add
row under “Completed iteration docs”.

---

## 8. Spec self-review (2026-06-04)

- [x] No TBD placeholders.
- [x] Panel-first create; no modal.
- [x] No delete/discard in scope (iteration 19).
- [x] Mirrors iteration 10 patterns; project-view-only scope.
- [x] Parent §5.5 behavior (defaults, Owner, position 0) satisfied via panel edit path.
- [x] Roadmap iteration 11 bullets covered (`addTask`, **+ Task** header).
