# werkwink — Iteration 9: Overview click + drill (design)

**Date:** 2026-06-04  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.2, §5.2)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 9)  
**Builds on:** iteration 2 (overview dbl-click drill), iteration 5 (side panel),
iteration 8 (panel edits on project view)

Unify overview and project-view dot interaction: single-click opens the side
panel on `/projects`; drill into `/projects/:id` via double-click (kept) or
**Open project →** in the panel.

---

## 1. Goal

After this iteration:

- On **`/projects`**, a **single-click** (no drag) on a project dot opens the
  same `SidePanel` used on the project view (forces, name/link edit, slider).
- **Double-click** on a project dot still navigates to `/projects/:id`
  (iteration 2 shortcut retained).
- When the panel shows a **project** dot on the overview, **Open project →**
  navigates to `/projects/:id`.
- On **`/projects/:id`**, click-to-panel behavior is unchanged; no drill button
  (user is already in that project).

**Out of scope:** New store actions; task dots on overview; peak clamp (iter 16);
overview header wiring beyond layout; automated component tests (optional).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Overview single-click | Opens side panel (toggle same dot closes) |
| Overview double-click | **Keep** — `ChartMarker` `@dblclick` → `@open` → router (option A) |
| Panel drill | **Open project →** when `kind === 'project'` and parent passes `showOpenProject` |
| Overview panel content | Reuse `SidePanel` with `project` + `trackableId` (= project id) |
| Project view drill button | **Hidden** — omit `showOpenProject` on `ProjectView` |
| Selection state | `selectedTrackableId` ref in `OverviewView` (not URL, per parent §4.4) |
| Click vs drag | Unchanged `HillChart` threshold; overview sets `clickable` |
| Store | None |

---

## 3. Architecture

### 3.1 `OverviewView.vue`

Mirror `ProjectView.vue` layout:

- `selectedTrackableId: ref<string | null>(null)`
- `selectedProject` computed: `projects.find(p => p.id === selectedTrackableId)`
- `watchEffect`: if selected id not in `projects`, clear selection
- Section: `flex` row, `max-w-[1400px]`, chart `flex-1`, panel aside

```vue
<HillChart
  clickable
  :markers="markers"
  @move="onMove"
  @open="onOpen"
  @click="onTrackableClick"
/>
<SidePanel
  v-if="selectedProject && selectedTrackableId"
  :project="selectedProject"
  :trackable-id="selectedTrackableId"
  show-open-project
  @close="selectedTrackableId = null"
/>
```

Handlers:

- `onTrackableClick(id)`: toggle — `selectedTrackableId = selected === id ? null : id`
- `onOpen(id)`: `router.push(\`/projects/${id}\`)` (unchanged)
- `onMove`: `store.setPosition` (unchanged)

### 3.2 `SidePanel.vue`

- Import `useRouter`.
- New optional prop: `showOpenProject?: boolean` (default `false`).
- When `showOpenProject && kind === 'project'`:
  - Render **Open project →** below the type badge (terracotta text button or
    link-styled control, consistent with `+ Up force` links).
  - `@click` → `router.push(\`/projects/${project.id}\`)`
  - `aria-label="Open project view"`

Do not show when `showOpenProject` is false (project view) or when `kind === 'task'`.

### 3.3 `HillChart.vue` / `ChartMarker.vue`

No changes. Overview adopts existing `clickable` + `@click` and `@open` emits.

### 3.4 `ProjectView.vue`

No functional change. Confirm `HillChart` has `clickable` and `@click`; `SidePanel`
without `show-open-project`.

---

## 4. Data flow

### 4.1 Overview click → panel

1. User pointer-down on marker → drag pipeline starts.
2. On pointer-up: if `!didDrag && clickable` → emit `click(id)`.
3. `OverviewView` toggles `selectedTrackableId`.
4. `SidePanel` receives `project` + `trackableId`; `lookupInProject` resolves
   `{ kind: 'project', trackable: project }`.
5. Panel shows full iter 7–8 UX (forces, header edit, slider).

### 4.2 Drill paths

| Action | Result |
|--------|--------|
| Double-click dot on overview | `emit('open')` → `/projects/:id` |
| **Open project →** in panel (overview only) | `router.push(/projects/:id)` |
| Browser back from project view | Standard history; overview selection may still be set (acceptable) |

### 4.3 Selection cleanup

- Project deleted from store while selected → `watchEffect` clears id (same
  pattern as `ProjectView` task list cleanup).
- Close ✕ → `selectedTrackableId = null`.

---

## 5. Error handling & accessibility

- Unknown marker id on click: should not occur; if project missing, panel hidden.
- **Open project →**: keyboard-focusable button; visible label (not icon-only).
- Panel close and chart interaction unchanged from iteration 8.

---

## 6. Testing

**Required gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Coverage |
|------|----------|
| Unit | No new tests required (view wiring only) |
| Manual | See below |

**Manual test plan**

- [ ] Overview: click project dot → panel opens with correct name, forces, slider.
- [ ] Click same dot again → panel closes.
- [ ] Overview: double-click dot → navigates to project view.
- [ ] Overview: panel **Open project →** → same route as double-click.
- [ ] Overview: drag dot → panel does not open on release.
- [ ] Overview: edit name/forces in panel → persists after refresh.
- [ ] Project view: click project + task dots → panel; no **Open project →**.
- [ ] Project view: double-click does nothing harmful (no `open` handler).

---

## 7. Files

| File | Action |
|------|--------|
| `src/views/OverviewView.vue` | Update — layout, selection, `clickable`, `SidePanel` |
| `src/components/SidePanel.vue` | Update — `showOpenProject`, drill control |
| `docs/superpowers/specs/2026-06-04-werkwink-iteration-9-overview-click-drill-design.md` | This doc |

**Branch:** `feature/iteration-9-overview-click-drill` off `main`.

**Roadmap update (when implementation ships):** set iteration 9 to `done`; add
row under “Completed iteration docs”.

---

## 8. Spec self-review (2026-06-04)

- [x] No TBD placeholders.
- [x] Option A: single-click panel + double-click drill documented.
- [x] Panel drill only on overview (`showOpenProject`).
- [x] No store or `HillChart` API changes.
- [x] Scope limited to iteration 9 roadmap bullets.
- [x] Parent spec §5.2 default (panel + button) satisfied; dbl-click documented as extra shortcut.
