# werkwink — Iteration 10: + Project (design)

**Date:** 2026-06-04  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.2, §5.5)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 10)  
**Builds on:** iteration 4 (header stub), iteration 8 (panel name/link/slider),
iteration 9 (overview side panel + selection)

Create projects from the overview without a modal: **+ Project** appends a
persisted project with defaults, auto-opens the existing side panel for editing.

---

## 1. Goal

After this iteration:

- On **`/projects`**, **+ Project** in the header creates a new project dot at
  **position 0** with round-robin color and a primary **Owner** up force (empty
  owner).
- The new project is **persisted immediately** (Pinia persist unchanged).
- The overview **auto-selects** the new project and opens **`SidePanel`** (same
  as post-create option B in brainstorm).
- The manager refines **name**, **tracker link**, **position**, and **forces**
  using existing panel UX (iterations 7–8); no duplicate create form.
- Import, Export, Clean, End daily, and **+ Task** remain out of scope.

**Out of scope:** `removeProject` / discard (iteration 19); + Task (iteration 11);
empty-state “first project” CTA (iteration 12); modal component; store URL parse
at create time (link via panel `parseSourceUrl`).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Create UX | **Side panel** — no modal; `addProject()` then panel edits |
| Persist timing | **Immediate** on `addProject` |
| After create | Auto-set `selectedTrackableId` → panel open (overview) |
| Placeholder name | `"New project"` until user renames in panel |
| Accidental create | No discard in v10; delete when iteration 19 ships |
| Color assignment | `PALETTE_ORDER[projects.length % length]` before push |
| Primary force | One active up, `label: "Owner"`, `isPrimary: true`, `owner: null` |
| `source` at create | Omitted; optional link added in panel |
| Header | Enable **+ Project** only; other pills stay disabled |
| `SidePanel` | No changes required for iteration 10 |
| Auto-enter name edit | **Not in scope** (optional polish later) |

---

## 3. Architecture

### 3.1 Store — `addProject`

Add to `src/stores/hillChart.ts`:

```ts
addProject(): string
```

Returns the new project `id`. Implementation:

| Field | Value |
|-------|--------|
| `id` | `` `proj_${crypto.randomUUID()}` `` |
| `name` | `"New project"` |
| `color` | `PALETTE_ORDER[this.projects.length % PALETTE_ORDER.length]` |
| `position` | `0` |
| `lastMovedAt` | `new Date().toISOString()` |
| `source` | omitted |
| `forces` | Single primary up force (see §3.2) |
| `snapshots` | `[]` |
| `tasks` | `[]` |

Import `PALETTE_ORDER` from `src/schema/palette.ts`. Do not mutate `exportedAt`.

Push onto `this.projects` (order: append; color index uses length **before** push).

### 3.2 Primary force shape

Match sample / parent spec:

```ts
{
  id: `f_${crypto.randomUUID()}`,
  direction: 'up',
  label: 'Owner',
  owner: null,
  isPrimary: true,
  status: 'active',
  createdAt: new Date().toISOString(),
  resolvedAt: null,
  resolutionReason: null,
}
```

### 3.3 `AppHeader.vue`

- **+ Project** button: enabled, active pill styling (align with future wired
  buttons — warm fill, not `cursor-not-allowed`).
- Import, Export, Clean, End daily: remain `disabled` with existing muted styles.
- Emit `(e: 'add-project')` on + Project click.
- No store import in header.

### 3.4 `OverviewView.vue`

```ts
function onAddProject() {
  const id = store.addProject()
  selectedTrackableId.value = id
}
```

Template: `<AppHeader @add-project="onAddProject" />`.

Chart and panel wiring unchanged: `SidePanel` when `selectedProject` matches id.

### 3.5 `SidePanel.vue`

No file changes for iteration 10. Panel already supports overview project
selection, header edit, forces, slider, **Open project →**.

### 3.6 Iteration 11 note

+ Task may mirror this pattern on project view (`addTask` → select task in panel).
Not designed here.

---

## 4. Data flow

1. User clicks **+ Project** → `AppHeader` emits `add-project`.
2. `OverviewView` calls `store.addProject()` → new `Project` in store → persist
   plugin writes `localStorage`.
3. `selectedTrackableId = id` → `overviewMarkers` includes new dot at x=0.
4. `SidePanel` mounts with `trackableId === project.id`.
5. User edits via `updateTrackable`, `setPosition`, force actions — unchanged.

---

## 5. Error handling & accessibility

- `addProject` always succeeds (no validation gate at create).
- Empty name on panel save still rejected by `updateTrackable` (iteration 8).
- **+ Project**: focusable button; label remains `+ Project` (not icon-only).

---

## 6. Testing

**Required gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

### 6.1 Unit (`hillChart.test.ts`)

| Case | Assert |
|------|--------|
| Returns new id | Id present in `projects` |
| Defaults | `name === 'New project'`, `position === 0`, `tasks === []`, `snapshots === []` |
| Primary force | Exactly one force; `isPrimary`, `label === 'Owner'`, `direction === 'up'` |
| Color round-robin | With 0 projects → `terracotta`; after 8 projects, wraps to `terracotta` again |
| `lastMovedAt` | ISO string set at creation |

### 6.2 Manual

- [ ] + Project → dot at left, distinct color in sequence.
- [ ] Panel opens with “New project”, Owner chip, slider at 0.
- [ ] Rename and add Jira (or other) link → persists after refresh.
- [ ] Drag on overview + panel slider still work.
- [ ] **Open project →** and double-click drill work for new project.
- [ ] Import / Export / Clean / End daily still disabled.

---

## 7. Files

| File | Action |
|------|--------|
| `src/stores/hillChart.ts` | Add `addProject` |
| `src/stores/hillChart.test.ts` | Tests for `addProject` |
| `src/components/AppHeader.vue` | Enable + Project, emit `add-project` |
| `src/views/OverviewView.vue` | Wire handler + selection |
| `docs/superpowers/specs/2026-06-04-werkwink-iteration-10-add-project-design.md` | This doc |

**Branch:** `feature/iteration-10-add-project` off `main`.

**Roadmap update (when implementation ships):** set iteration 10 to `done`; add
row under “Completed iteration docs”.

---

## 8. Spec self-review (2026-06-04)

- [x] No TBD placeholders.
- [x] Side-panel create path matches brainstorm; no modal.
- [x] No discard/delete in scope (iteration 19).
- [x] `PALETTE_ORDER` reused from `palette.ts`.
- [x] Scope limited to iteration 10 roadmap bullets.
- [x] Parent spec §5.5 defaults (color, position 0, Owner force) satisfied.
