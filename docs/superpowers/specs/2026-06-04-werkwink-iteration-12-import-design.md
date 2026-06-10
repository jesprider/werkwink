# werkwink — Iteration 12: Import (design)

**Date:** 2026-06-04  
**Status:** Implemented  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.2, §5.4)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 12)  
**Builds on:** iteration 3 (persist + `loadState`), iteration 4 (header stubs),
iteration 10–11 (+ Project / + Task)

Load tracker-exported JSON into the chart. Sample-first onboarding stays: the app
behaves normally while `demo` is true; Import remains available until the user
successfully imports custom data.

---

## 1. Goal

After this iteration:

- **`demo` flag** on `HillChartState`: sample seed uses `demo: true`; all edits
  persist to `localStorage` as today; **`demo` becomes `false` only on successful
  import** (not on drag, + Project, forces, etc.).
- **`canImport`:** `demo === true` **or** `projects.length === 0`.
- **`src/schema/validate.ts`:** full structural validation; surface error list.
- **Store `importState`:** replace root state from validated JSON; set `demo: false`.
- **Import UI:** file picker + drag-drop `.json` on overview; wire header Import.
- **Overview empty state** when `projects.length === 0`: Import, + first project,
  link to landing.
- **Demo label** visible while `demo === true` and chart has projects.
- **Confirm** before import when `demo === true` (replaces entire chart).

**Out of scope:** Export, Clean (iteration 13); landing secondary Import link
(iteration 20); `hill-chart-skill` package; incremental merge import.

**Parent spec amendment:** §5.4 “only when state is empty” means **`canImport`**
(empty **or** demo), not “forbid all edits while demo.”

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| First visit | Still seed from `sample.ts` (iteration 3 unchanged) |
| `demo` meaning | Disposable sample chart; Import may replace whole state |
| When `demo → false` | **Successful import only** |
| While `demo: true` | Full app: drag, forces, + Project, + Task, panel — all persist |
| `canImport` | `demo \|\| projects.length === 0` |
| After `demo: false` + projects | Import disabled; tooltip points to Export/Clean (Clean in iter 13) |
| Missing `demo` in storage | Treat as **`false`** (existing users = real data) |
| Missing `demo` in import file | Default **`false`** on loaded state |
| Import overwrite | Confirm dialog when `demo === true` |
| Demo chrome | Persistent **“Demo data”** label when `demo && projects.length > 0` |
| Validator | Single `validate.ts`; import uses it; optional reuse from `loadState` later |
| Errors | Inline list on overview (no modal for validation errors) |

---

## 3. Schema — `demo` field

### 3.1 `HillChartState` (`src/schema/types.ts`)

```ts
export interface HillChartState {
  version: number
  exportedAt: string | null
  demo: boolean
  projects: Project[]
}
```

### 3.2 Values

| Source | `demo` |
|--------|--------|
| `sample.ts` | `true` |
| Successful `importState` | `false` (from file or forced after load) |
| Hydrated state without field (legacy) | `false` |
| Import JSON omitting `demo` | `false` after import |
| Iteration 13 Clean (future) | `false` with `projects: []` → import via empty |

### 3.3 `canImport`

```ts
export function canImport(state: HillChartState): boolean {
  return state.demo || state.projects.length === 0
}
```

Live in `src/schema/importRules.ts` (or `validate.ts` if tiny) — unit-tested.

---

## 4. Validation — `src/schema/validate.ts`

### 4.1 API

```ts
export type ValidateResult =
  | { ok: true; state: HillChartState }
  | { ok: false; errors: string[] }

export function validateHillChartJson(raw: string): ValidateResult
export function validateHillChartObject(data: unknown): ValidateResult
```

- `validateHillChartJson`: `JSON.parse` failures → single error in `errors`.
- `validateHillChartObject`: structural + semantic checks; accumulate human-readable
  paths (e.g. `projects[0].tasks[1].forces[0].label`).

### 4.2 Rules (v1, `version === 1` only)

**Root**

- Plain object; `version === 1`.
- `projects` array (may be empty).
- `exportedAt`: `null` or string (ISO); optional, default `null` if missing.
- `demo`: optional boolean; default **`false`** if missing.

**Project**

- `id`, `name` non-empty strings.
- `color` ∈ `ProjectColor` palette keys.
- `position` integer 0–100.
- `lastMovedAt` ISO date string.
- `forces` array; `tasks` array; `snapshots` array.
- `source` optional; if present, object with optional string fields.

**Task** (nested): same trackable fields as project except no `color` / `tasks`.

**Force**

- `id`, `label` non-empty; `direction` `'up' | 'down'`; `status` `'active' | 'resolved'`.
- `owner`: `null` or string; `isPrimary` boolean.
- `createdAt` ISO; `resolvedAt` / `resolutionReason` nullable.
- Exactly **one** active primary up (`isPrimary && direction === 'up' && status === 'active'`) per trackable.
- Resolved forces: `resolvedAt` set when `status === 'resolved'`.

**Snapshot**

- `date` string (YYYY-MM-DD or ISO date — accept same as sample); `position` 0–100.

**IDs**

- Unique `id` across all projects and tasks in file.

Do **not** re-apply peak snap or blocker rules on import (parent open question #5:
preserve positions; guards apply on next drag).

### 4.3 Tests (`validate.test.ts`)

- Minimal valid one-project file (skill-shaped).
- Invalid: bad color, missing primary up, duplicate ids, `version: 2`, malformed JSON.
- `demo` omitted → parsed state has `demo: false`.

---

## 5. Store — `importState`

```ts
importState(state: HillChartState): void
```

1. If `!canImport(this.$state)` → no-op (return; UI must not call).
2. Replace store root: `version`, `exportedAt`, `projects`, set **`demo: false`**
   (even if file had `demo: true`).
3. Pinia persist writes `localStorage`.

No other action sets `demo`. Dragging sample projects leaves `demo: true`.

---

## 6. UI

### 6.1 `AppHeader.vue`

- Props: `importEnabled: boolean`, optional `importTitle` for disabled tooltip.
- Emit `import-click` → parent opens file picker.
- Import button: enabled styling when `importEnabled`; disabled + `title` when not.

### 6.2 `ImportButton.vue` (new)

- Hidden `<input type="file" accept=".json,application/json">`.
- Expose `openPicker()` for header.
- Props: `enabled`; emit `file-selected: File` or handle read internally and emit
  `validated` / `errors`.
- Parent owns confirm + `importState` (keeps header thin).

### 6.3 `OverviewView.vue`

- `canImport` from store.
- **Demo label:** when `demo && projects.length > 0`, show pill/badge **“Demo data”**
  (muted, near header or above chart). App works normally; label is informational only.
- **Empty state** (`projects.length === 0`): centered copy, Import CTA (same
  picker), **+ Add your first project** (`addProject`), `RouterLink` to `/`:
  “New here? Read what this app is →”.
- **Drag-drop:** on chart container (and empty-state drop zone), accept `.json`;
  `preventDefault` on dragover/drop; ignore when `!canImport`.
- **Import flow:**
  1. User picks file or drops file.
  2. Read as text → `validateHillChartJson`.
  3. On failure → show `errors` in inline alert below header.
  4. On success → if `store.demo`, `confirm('Replace demo data with your imported projects?')` — if cancelled, abort.
  5. `importState(validated.state)` → clear errors; optional toast not required.

### 6.4 `ProjectView.vue`

- No import on project view in v12 (overview only per roadmap).

### 6.5 Landing

- No changes (iteration 20).

---

## 7. Bootstrap & persistence

- Store initial state: `structuredClone(sampleState)` includes **`demo: true`**.
- Plugin hydrates legacy blobs without `demo` → Pinia state should treat missing as
  **`false`** in a getter or `hydrate` hook:

```ts
// After hydrate, if demo was undefined in JSON, set demo: false
```

Implement via `$patch` after persist restore or `state: () => ({ ...sample, demo: true })`
only for fresh seed — document: **persist plugin may omit unknown fields**; add
`afterRestore` callback if pinia-plugin supports it, or validate on first read in
store init.

**Simplest v12 approach:** extend `parseStoredState` / store to coerce
`demo: typeof demo === 'boolean' ? demo : false` when loading from disk.

---

## 8. Data flow

```
User → Import (header or empty state or drop)
  → read File as text
  → validateHillChartJson
  → [errors] → inline alert
  → [ok + demo] → confirm
  → importState(state)
  → demo=false, projects replaced, persist
```

---

## 9. Error handling & accessibility

- File read errors → single user-visible message.
- Non-JSON / validation → `errors` list, `role="alert"`.
- Import button: `aria-disabled` when disabled; tooltip via `title`.
- Demo label: text only, not `aria-live` (static).

---

## 10. Testing

**Gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Cases |
|------|--------|
| `validate.test.ts` | Valid minimal; invalid shapes; `demo` default |
| `canImport` / import rules | demo true + projects; demo false + projects; empty |
| `hillChart.test.ts` | `importState` replaces projects; sets `demo: false`; no-op when !canImport |
| `setPosition` while demo | `demo` stays `true` |

**Manual**

- [ ] Fresh profile → sample + “Demo data” label + Import enabled.
- [ ] Drag/rename/+ Project on sample → still demo, Import still works.
- [ ] Import valid JSON → confirm → chart replaced, label gone, Import disabled.
- [ ] Invalid JSON → errors shown, state unchanged.
- [ ] Empty store (simulate after future Clean) → Import enabled, empty state CTAs.

---

## 11. Files

| File | Action |
|------|--------|
| `src/schema/types.ts` | Add `demo: boolean` |
| `src/data/sample.ts` | `demo: true` |
| `src/schema/validate.ts` | New validator |
| `src/schema/validate.test.ts` | Validator tests |
| `src/schema/importRules.ts` | `canImport` (+ tests) |
| `src/stores/hillChart.ts` | `importState`; hydrate `demo` default |
| `src/stores/hillChart.test.ts` | Import + demo persistence tests |
| `src/components/ImportButton.vue` | File picker |
| `src/components/AppHeader.vue` | Wire Import |
| `src/views/OverviewView.vue` | Empty state, drop zone, demo label, errors |
| `docs/superpowers/specs/2026-06-04-werkwink-iteration-12-import-design.md` | This doc |

**Branch:** `feature/iteration-12-import` off `main`.

**Roadmap update (when implementation ships):** iteration 12 → `done`; add doc row.

---

## 12. Spec self-review (2026-06-04)

- [x] No TBD placeholders.
- [x] `demo` only clears on import; edits while demo persist (user clarification).
- [x] Demo label scoped to `demo && projects.length > 0`.
- [x] Parent “empty only” amended to `canImport` (demo OR empty).
- [x] Export/Clean deferred to iteration 13.
- [x] Scope matches roadmap iteration 12 bullets.
