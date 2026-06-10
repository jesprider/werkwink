# werkwink — Iteration 13: Export & Clean (design)

**Date:** 2026-06-06  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§5.4)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 13)  
**Builds on:** iteration 3 (persist), iteration 4 (header stubs), iteration 12
(import + `canImport` + `demo`)

Complete the M4 data-ownership loop: download the current chart as JSON, wipe local
state with confirmation, re-enable Import for the Export → skill edit → Clean → Import
workflow.

---

## 1. Goal

After this iteration:

- **Export** — header button downloads `hill-chart-<timestamp>.json` with the full
  store snapshot; sets `exportedAt` in both the file and persisted store.
- **Clean** — confirm dialog, then wipe all projects/tasks/history; Import enabled
  again via empty store.
- **Wire header** Export and Clean on the overview (replace iteration 4 stubs).

**Out of scope:** End daily (iteration 14); landing secondary Import link
(iteration 20); export validation pass; incremental import; export/clean on project
view.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Export enabled | **`projects.length > 0` only** — disabled when empty |
| Clean enabled | Same as Export — disabled when already empty; store no-op if called |
| `exportedAt` on export | **Update store + file** — ISO timestamp at export time |
| `demo` in export file | **As-is** — reflects store (`demo: true` while on sample data) |
| Clean result | `version: 1`, `exportedAt: null`, `demo: false`, `projects: []` |
| Clean confirm | `window.confirm` — *"This will delete all projects, tasks, and history. Export first?"* |
| Export confirm | None |
| JSON formatting | Pretty-print (`JSON.stringify(state, null, 2)`) for skill editing |
| Filename | `hill-chart-<timestamp>.json` — filesystem-safe ISO, e.g. `hill-chart-2026-06-06T143045Z.json` |
| Surface | **Overview only** (same as Import) |
| Architecture | Store actions + thin `downloadJson` util (matches `importState` pattern) |

---

## 3. Store

### 3.1 `exportState(): HillChartState`

Add to `src/stores/hillChart.ts`:

1. Set `this.exportedAt = new Date().toISOString()` (Pinia persist writes to
   `localStorage`).
2. Return a snapshot of current root state:

```ts
{
  version: this.version,
  exportedAt: this.exportedAt,
  demo: this.demo,
  projects: this.projects,
}
```

No validation on export — in-memory state is trusted. Deep clone not required for
return value if caller serializes immediately; clone if tests need isolation.

### 3.2 `cleanState(): void`

1. If `this.projects.length === 0` → return (no-op).
2. Replace root fields:

| Field | Value |
|-------|--------|
| `version` | `1` |
| `exportedAt` | `null` |
| `demo` | `false` |
| `projects` | `[]` |

3. Pinia persist writes empty chart; `canImport` getter becomes `true`
   (`projects.length === 0`).

Does **not** re-seed from `sample.ts` — empty chart is the post-clean state
(iteration 12 design). First-visit sample seed remains iteration 3 bootstrap only
(empty `localStorage`).

---

## 4. Download utility

New `src/lib/downloadJson.ts`:

```ts
export function downloadJson(filename: string, data: unknown): void
```

- `JSON.stringify(data, null, 2)` → `Blob` (`application/json`) → temporary
  `<a download>` click → revoke object URL.
- No store dependency — reusable for future export surfaces.

**Overview export flow:**

```ts
const state = store.exportState()
const ts = new Date().toISOString().replace(/[:.]/g, '')
downloadJson(`hill-chart-${ts}.json`, state)
```

Use UTC ISO from `exportedAt` already set on store, or derive filename timestamp
from the same `new Date()` call — filenames must be unique and filesystem-safe
(colons and dots stripped or replaced).

---

## 5. UI

### 5.1 `AppHeader.vue`

Extend props:

```ts
exportEnabled: boolean
cleanEnabled: boolean
```

Extend emits:

```ts
(e: 'export-click'): void
(e: 'clean-click'): void
```

| Button | Enabled | Disabled styling |
|--------|---------|------------------|
| Export | `exportEnabled` | Muted pill, `cursor-not-allowed` (match Import disabled) |
| Clean | `cleanEnabled` | Same |

Remove hardcoded `disabled` from Export/Clean stub buttons.

### 5.2 `OverviewView.vue`

```ts
const exportEnabled = computed(() => projects.value.length > 0)
const cleanEnabled = computed(() => projects.value.length > 0)
```

**Export handler:**

1. `store.exportState()` → `downloadJson(...)`.
2. No confirm dialog.

**Clean handler:**

1. `window.confirm('This will delete all projects, tasks, and history. Export first?')`
   — cancel → abort.
2. `store.cleanState()`.
3. Clear `selectedTrackableId` and `importErrors`.
4. Empty state UI (iteration 12) appears automatically.

`ProjectView.vue` — no changes (no Export/Clean on project view).

---

## 6. Data flow

```
Export click
  → exportState()  // sets exportedAt, persist
  → downloadJson(`hill-chart-<ts>.json`, state)

Clean click
  → confirm dialog
  → cleanState()   // empty projects, demo false, persist
  → clear panel selection + import errors
  → canImport true → Import enabled
```

Round-trip (parent spec §5.4):

```
Export → skill edits JSON → Clean → Import
```

---

## 7. Error handling & accessibility

- Export/Clean buttons: native `disabled` when empty; no extra tooltip in v13.
- Clean confirm uses browser `confirm` (consistent with demo import confirm in
  iteration 12).
- Export failure (e.g. blob blocked) — unlikely in v1; no special UI required.

---

## 8. Testing

**Gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Cases |
|------|--------|
| `hillChart.test.ts` | `exportState` sets `exportedAt`; returned snapshot includes current `demo` and `projects` |
| | `cleanState` empties projects, sets `demo: false`, `exportedAt: null`, `canImport` true |
| | `cleanState` no-op when `projects.length === 0` |
| | Export while `demo: true` → snapshot has `demo: true` |

Skip DOM tests for `downloadJson` unless trivial mock of `URL.createObjectURL`.

**Manual**

- [ ] Chart with projects → Export downloads valid JSON; `exportedAt` in file and
  store match.
- [ ] Demo data chart → Export includes `"demo": true`.
- [ ] Empty chart → Export/Clean disabled.
- [ ] Clean → confirm → empty overview, Import enabled, panel closed.
- [ ] Clean cancel → state unchanged.
- [ ] Export → Clean → Import valid file → round-trip restores projects.

---

## 9. Files

| File | Action |
|------|--------|
| `src/stores/hillChart.ts` | `exportState`, `cleanState` |
| `src/stores/hillChart.test.ts` | Export + clean cases |
| `src/lib/downloadJson.ts` | New download helper |
| `src/components/AppHeader.vue` | Wire Export/Clean props and emits |
| `src/views/OverviewView.vue` | Handlers + enabled computed |
| `docs/superpowers/specs/2026-06-06-werkwink-iteration-13-export-clean-design.md` | This doc |

**Branch:** `feature/iteration-13-export-clean` off `main`.

**Roadmap update (when implementation ships):** iteration 13 → `done`; add doc row
in “Completed iteration docs”; M4 complete.

---

## 10. Spec self-review (2026-06-06)

- [x] No TBD placeholders.
- [x] Export disabled when empty; Clean disabled when empty (user lock-in A).
- [x] `exportedAt` updates store + file (user lock-in A).
- [x] `demo` exported as-is (user lock-in A).
- [x] Clean → empty + `demo: false`, not sample re-seed (iteration 12 alignment).
- [x] Scope matches roadmap iteration 13 bullets only.
- [x] End daily and project-view export deferred.
