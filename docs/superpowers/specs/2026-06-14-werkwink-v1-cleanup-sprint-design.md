# werkwink — v1 cleanup sprint (design)

**Date:** 2026-06-14  
**Status:** In progress  
**Parent spec:** `docs/werkwink-design-spec.md`  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iterations 1–20 complete)  
**Follows:** iteration 20 (landing page)

Post-v1 refactoring sprint. Reduce structural debt and align committed docs before
any new feature work. Full codebase review (2026-06-14) identified duplicated view
wiring, an oversized `SidePanel`, weak persist validation, and folder/naming drift —
not architectural rot.

---

## 1. Goal

After this sprint:

- **One validator** for import and `localStorage` hydrate
- **Shared chart workspace** — no duplicated selection/nudge/layout between overview and project views
- **`SidePanel` split** — four focused child components under a thin shell
- **Domain layout** — pure builders in `domain/`; curve geometry in `lib/`; `composables/` for Vue hooks only
- **Tests** — `useChartBlockNudge`, `useChartSelection`, persist round-trip; component tests for `PanelPosition` and `DoneStack`
- **Docs** — parent spec and domain vocabulary aligned with shipped behavior

**Out of scope:** `docs/superpowers/plans/` (gitignored local execution logs); E2E;
renaming `HillChartState` / `useHillChartStore` / `HillChart.vue`; storage-key
migration (no active users).

---

## 2. Decisions (review lock-in)

| Topic | Decision |
|-------|----------|
| Sprint goal | Reduce complexity for post-v1 features **and** committed doc hygiene |
| Timing | **Dedicated sprint** — finish before any new feature |
| Scope | All review items: HIGH + MEDIUM + LOW |
| Git strategy | **~6 themed PRs**, each passes `lint`, `format:check`, `test`, `build` |
| Storage key | Hard cut `hill-chart-state` → `werkwink-state`; no migration |
| Export filename | `werkwink-<timestamp>.json` |
| Domain rename breadth | User-facing artifacts only; keep `HillChartState`, `HillChart.vue` |
| Persist validation | Full `validateHillChartObject` on hydrate → `StorageErrorView` |
| `canEndDaily` | Store getter using `isSameLocalDay` |
| Folder moves | `chartMarkers` + `trackableLookup` → `domain/`; curve math → `lib/hillCurve.ts` |
| `SidePanel` split | `PanelHeader`, `PanelPosition`, `PanelForces`, `PanelDangerZone` |
| Chart workspace | `useChartSelection` composable + `ChartWorkspace.vue` |
| Component tests | `PanelPosition` (slider clamp) + `DoneStack` (expand/drag) with `@vue/test-utils` |
| Local `plans/` | Out of scope — not committed |

---

## 3. PR sequence

### PR 1 — Foundation: validation, storage, docs (`chore/validation-storage-rename`)

**Status:** Done (merged)

- Run `validateHillChartJson` in `loadState.ts` before Pinia hydrate
- Rename `WERKWINK_STORAGE_KEY` = `werkwink-state` (hard cut)
- Export filename `werkwink-<timestamp>.json`
- `canEndDaily` store getter; `OverviewView` uses `storeToRefs`
- Docs: `werkwink-design-spec.md` §2 staleness + §7 storage key; `domain-vocabulary.md` updates
- Tests: `loadState.test.ts`, `canEndDaily` getter tests

### PR 2 — Domain layout (`chore/domain-layout`)

**Status:** Done (merged)

- `findTrackableInProjects()` — shared by store and `lookupInProject`
- Move `chartMarkers.ts` → `domain/chartMarkers.ts`
- Move `trackableLookup.ts` → `domain/trackableLookup.ts`
- Move curve math → `lib/hillCurve.ts`; components import directly
- `buildChartMarker()` — dedupe `overviewMarkers` / `markersForProject`
- `createPrimaryOwnerForce()` — shared by `addProject` / `addTask`
- Consolidate active down-force check

### PR 3 — Import extraction (`chore/import-composable`)

**Status:** Done (merged)

- `useJsonImport(store)` from `OverviewView` — file read, validate, demo confirm, errors, drag-drop

### PR 4 — Chart workspace (`chore/chart-workspace`)

**Status:** This PR

- `useChartSelection()` — selection, stale-id cleanup, nudge + `onMove`
- `ChartWorkspace.vue` — banner, `HillChart`, `DoneStack`, conditional `SidePanel`
- Refactor `OverviewView` + `ProjectView`

### PR 5 — Side panel split (`chore/side-panel-split`)

- `PanelHeader.vue`, `PanelPosition.vue`, `PanelForces.vue`, `PanelDangerZone.vue`
- `SidePanel.vue` → thin orchestrator (~80 lines)
- `PEAK_POSITION` everywhere; `validateForceDraft()` if save pattern still repeats

### PR 6 — Tests + low hygiene (`chore/component-tests`)

- `@vue/test-utils` + Vitest SFC config
- Unit: `useChartBlockNudge`, `useChartSelection`, persist round-trip
- Component: `PanelPosition`, `DoneStack`
- Dead export cleanup

---

## 4. Definition of done

1. All six PRs merged to `main`
2. `npm run lint && npm run format:check && npm run test && npm run build` green on each PR
3. No production file over ~200 lines except tests and slimmed `OverviewView`
4. Single validation path for import and persist
5. Post-v1 feature work can proceed without touching monolithic panel or duplicated view wiring

---

## 5. Review findings (reference)

### High-value refactors

| Issue | Locations |
|-------|-----------|
| Weak persist validation | `loadState.ts` vs `validate.ts` |
| Chart workspace duplication | `OverviewView.vue`, `ProjectView.vue` |
| Trackable lookup duplication | `hillChart.ts`, `trackableLookup.ts` |
| `SidePanel` size (~440 lines) | Six mixed concerns |
| Marker builder duplication | `overviewMarkers` / `markersForProject` |

### Intentional spec deviations (not bugs)

- Ghost trail cap **7** (iteration-15 design doc), not 10
- Trail only for **selected** marker

### Test gaps addressed in sprint

- No component/view tests today
- No `useChartBlockNudge` tests
- No localStorage round-trip tests

---

## 6. Verification

Per PR:

```bash
npm run lint && npm run format:check && npm run test && npm run build
```

PR 1 manual checks:

1. Fresh browser → demo seeds under `werkwink-state`
2. Export → filename `werkwink-<timestamp>.json`
3. End daily disabled after click until next calendar day
4. Paste invalid JSON into `werkwink-state` → `StorageErrorView` with validation errors
