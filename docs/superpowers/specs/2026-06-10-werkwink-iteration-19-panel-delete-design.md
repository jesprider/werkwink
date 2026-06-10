# werkwink — Iteration 19: Panel delete (design)

**Date:** 2026-06-10  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.4 Danger zone)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 19)  
**Builds on:** iteration 10 (`addProject`), iteration 11 (`addTask`), iteration 9
(selection cleanup), iteration 18 (done stack + panel on stack click)

Managers can remove mistaken projects and tasks from the side panel. The
position sparkline originally scoped for iteration 19 is **dropped** — chart
ghost trails (iteration 15) remain the only snapshot visualization.

---

## 1. Goal

After this iteration:

- **Danger zone** — collapsed `<details>` at the bottom of `SidePanel` with a
  context-aware delete button (**Delete project** / **Delete task**).
- **Confirm** — `window.confirm` before removal (same pattern as Clean).
- **Store** — `removeProject(projectId)` and `removeTask(projectId, taskId)`.
- **Parent spec + roadmap** — remove side-panel sparkline references; iteration 19
  slug becomes `panel-delete`.
- **Vitest** — store delete actions and no-op on unknown ids.

**Out of scope:** Side-panel position sparkline; force delete; undo; bulk delete;
“discard” for brand-new dots without confirm (delete always confirms).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Store API | **`removeProject` + `removeTask`** — explicit actions per kind |
| Project delete | **Cascade** — removing a project removes all nested tasks |
| Last project | **Allowed** — overview empty state + Import re-enabled via `canImport` |
| Confirm UI | **`window.confirm`** — matches Clean (iteration 13) |
| Danger zone layout | **`<details>` collapsed by default** — per parent spec §4.4 |
| Button label | **Delete project** / **Delete task** from panel `kind` |
| Task confirm | `Delete "{name}"? This cannot be undone.` |
| Project confirm (0 tasks) | Same as task |
| Project confirm (N tasks) | `Delete "{name}" and its N task(s)? This cannot be undone.` |
| After delete | Existing `watchEffect` cleanup closes panel / redirects project view |
| Sparkline | **Removed from v1** — parent spec updated in this branch |
| Chart ghost trail | **Unchanged** — iteration 15 behavior retained |

---

## 3. Store

Add to `src/stores/hillChart.ts`:

```ts
removeProject(projectId: string): void
removeTask(projectId: string, taskId: string): void
```

### 3.1 `removeProject`

1. Find index in `this.projects` where `p.id === projectId`.
2. If not found, return (no-op).
3. `this.projects.splice(index, 1)`.

Tasks, forces, and snapshots are discarded with the project (no orphan cleanup).

### 3.2 `removeTask`

1. Find project where `p.id === projectId`.
2. If not found, return.
3. Find task index in `project.tasks` where `t.id === taskId`.
4. If not found, return.
5. `project.tasks.splice(taskIndex, 1)`.

Do not mutate `exportedAt`, `demo`, or `lastDailyDate`.

---

## 4. Side panel UI

Add after the past-blockers `<details>` in `SidePanel.vue`:

```html
<details class="mt-6 border-t border-hill-sand/60 pt-4">
  <summary class="cursor-pointer text-sm font-medium text-text-warm/70">
    Danger zone
  </summary>
  <button
    type="button"
    class="mt-3 rounded-lg border border-rust/30 px-3 py-2 text-sm text-rust hover:bg-rust/5"
    @click="onDelete"
  >
    {{ kind === 'project' ? 'Delete project' : 'Delete task' }}
  </button>
</details>
```

### 4.1 `onDelete` handler

1. Build confirm message from `trackable.name`, `kind`, and (for projects)
   `project.tasks.length`.
2. If `!window.confirm(message)`, return.
3. If `kind === 'project'`: `store.removeProject(project.id)`.
4. Else: `store.removeTask(project.id, trackableId)`.

Panel closes automatically:

- **Overview:** `watchEffect` clears `selectedTrackableId` when project id missing.
- **Project view:** deleting the viewed project → `watchEffect` → `router.replace('/projects')`;
  deleting a task → selection cleared when task id missing from chart markers.

No new emits or view changes required.

---

## 5. Documentation updates (same branch)

### 5.1 `docs/werkwink-design-spec.md`

- §4.4: remove **Position trail** section; renumber **Danger zone** to item 7.
- §5.7: remove side-panel sparkline sentence; note older snapshots remain in
  storage for export.
- Decisions ledger items **6**, **23**, **29**: remove panel sparkline wording.

### 5.2 `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md`

- Progress tracker slug: `panel-delete`.
- M6 milestone text: drop “sparkline”.
- Iteration 19 section: retitle and deliverables = delete only.
- Iteration 8 / 15 “out of scope” lines: reference delete only (not sparkline).

---

## 6. Testing

**Required gate:** `npm run lint && npm run format:check && npm run test && npm run build`

| Area | Coverage |
|------|----------|
| Unit | `hillChart.test.ts`: remove project; remove task; project delete removes tasks; no-op unknown ids |
| Manual | Delete task on project view; delete project on overview; delete project from its project view (redirect); delete last project (empty state); cancel confirm leaves data |

**Manual checklist:**

- [ ] Open panel → Danger zone collapsed → expand → Delete task → confirm → dot gone.
- [ ] Delete project with tasks → confirm mentions task count → project and tasks gone.
- [ ] Cancel confirm → no store change.
- [ ] Delete last project → overview empty state; Import available when not demo.

---

## 7. Files touched

| File | Change |
|------|--------|
| `src/stores/hillChart.ts` | `removeProject`, `removeTask` |
| `src/stores/hillChart.test.ts` | Delete action tests |
| `src/components/SidePanel.vue` | Danger zone + confirm + store calls |
| `docs/werkwink-design-spec.md` | Drop sparkline; danger zone renumber |
| `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` | Iteration 19 scope + slug |
| `docs/superpowers/specs/2026-06-10-werkwink-iteration-19-panel-delete-design.md` | This doc |

**Branch:** `feature/iteration-19-panel-delete` off `main`.

---

## Spec self-review

- [x] No TBD placeholders.
- [x] Sparkline explicitly out of scope; chart trail unchanged.
- [x] Confirm messages and cascade behavior specified.
- [x] Selection cleanup uses existing view `watchEffect` — no duplicate logic.
- [x] Scope fits single iteration; landing page (20) not pulled forward.
- [x] Parent spec + roadmap updates included per brainstorm option A.
