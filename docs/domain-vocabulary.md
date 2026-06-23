# werkwink — domain vocabulary

Canonical naming for humans and AI contributors. Product copy may still say **dot**;
code and implementation docs use the terms below.

**Related:** `docs/werkwink-design-spec.md` (behavior), `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (delivery order).

---

## Ubiquitous language (product & ritual)

| Term | Meaning |
|------|---------|
| **Hill** | The uncertainty curve; x = 0–100, peak at 50. |
| **Project** | Top-level work stream on the chart; has a color and tasks. |
| **Task** | Child work item inside a project; only on the project view chart. |
| **Dot** | Informal name for a project or task **as shown on the hill** (conversation, UI). Not a TypeScript type. |
| **Project dot** | The project’s chart marker (larger). |
| **Task dot** | A task’s chart marker (smaller). |
| **Force** | Up forces (assignee, helpers) or down forces (blockers, obstacles, dependencies) on a project or task. |
| **Resolve (force)** | Mark a force resolved; moves to past section. |
| **Capture** | Reversible save: snapshot today's positions and append today's notes for every dot. Always available; idempotent; delta-armed (replaces "End daily"). |
| **Daily note** | Short standup update typed in the side panel's write-only Notes field; appended to today's note on Capture, then cleared. Previously captured text is never shown. |
| **Notes history** | Per-dot `{ date, text }[]`; Capture appends the draft to today's entry (newline-joined). Export-only in v1. |
| **Snapshot / trail** | Historical positions for ghost markers on the chart. |
| **Staleness satellite** | Small red marker orbiting a dot; one per day without movement (from day 2, max 4). Skipped at position 100 (done). |
| **Days without movement** | Local calendar days since `lastMovedAt`; shown in the side panel. Grace day: moved yesterday → 0 satellites, panel may still show “1 day”. |
| **Done panel** | Right column list when no dot is selected; panel card with dot + name rows. |
| **Restore** | Hover ↩ Restore on a done row (or position slider in panel); places dot at peak (50). |

---

## Code vocabulary (implementation)

| Term | Layer | Meaning |
|------|-------|---------|
| `Project` | Domain (`schema/types.ts`) | Aggregate root; persisted. |
| `Task` | Domain | Entity inside `Project.tasks`. |
| `HillTrackable` | Domain | Shared shape: id, name, position, forces, snapshots, `dailyNoteDraft` (transient write-only buffer), `notes`, optional `source`. Implemented by `Project` and `Task`. |
| `HillChartState` | Domain | Root store document: `version`, `exportedAt`, `demo`, `projects[]`. (No `lastDailyDate` — removed in the Capture rework.) |
| `ChartMarker` | Presentation | Read model for one SVG marker (position, color, radius, force counts, `stalenessSatellites`). |
| `overviewMarkers` / `markersForProject` | Presentation | Build `ChartMarker[]` for a view (`domain/chartMarkers.ts`). |
| `MarkerChart.vue` | UI | Renders one marker on the hill (main dot + staleness satellites). |
| `MarkerTrail.vue` | UI | Renders snapshot ghost trail for the selected marker. |
| `stalenessSatelliteCount` | Domain (`domain/staleness.ts`) | How many red satellites to draw (0–4); skipped at `DONE_POSITION` (100). |
| `daysWithoutMovement` | Domain | Calendar days since last move; powers side-panel copy. |
| `daysSinceLastMove` | Domain | Raw calendar-day diff from `lastMovedAt` to today. |
| `findTrackableInProjects` | Domain (`domain/trackableLookup.ts`) | Given `projects[]` + id → `HillTrackable` or undefined. |
| `lookupInProject` | Domain (`domain/trackableLookup.ts`) | Given a `Project` + id → `InProjectLookup` or null. |
| `InProjectLookup` | Domain | `{ kind: TrackableKind, trackable: HillTrackable }`. |
| `TrackableKind` | Domain | `'project' \| 'task'`. |
| `selectedTrackableId` | UI state | Which trackable the side panel shows (project view). |
| `canCapture` | Store getter | `projects.length > 0` and at least one dot is dirty: its `position` differs from its latest snapshot (or it has none), or its `dailyNoteDraft` is non-empty. |
| `capture` | Store action | Upsert today's position snapshot and append today's note for every dot; clears note drafts. Idempotent (replaces "End daily" / `endDaily`). |
| `appendDailyNote` | Domain (`domain/dailyNotes.ts`) | Append text to today's note entry (newline-joined) or create it; newest date first. |
| `resolveForce` / `unresolveForce` | Store actions | Force lifecycle only. |
| `partitionMarkers` | Domain (`domain/chartMarkers.ts`) | Splits markers into `active` (curve) and `done` (stack). |
| `DonePanel.vue` | Component | Renders done list in right column; row click, hover restore. |
| `allTasksDone` / `clampProjectDonePosition` | Domain (`doneRules.ts`) | Project cannot reach 100 until all tasks are at 100. |

---

## Mapping: say this → type this

| Docs / UI | Domain type | On chart |
|-----------|-------------|----------|
| Project dot | `Project` | `ChartMarker` (large radius) |
| Task dot | `Task` | `ChartMarker` (small radius) |
| Click a dot | Select by `id` | `lookupInProject` + side panel |
| Drag a dot | `setPosition(trackableId, …)` | Updates `Project` or `Task` |
| Staleness satellites | `stalenessSatelliteCount(lastMovedAt, position)` | Red dots on `MarkerChart` |
| Days without movement (panel) | `daysWithoutMovement(lastMovedAt, position)` | Position section copy |
| Resolve a down force | `resolveForce` | — |
| Peak crossing blocked | Active down forces remain | Panel + chart nudge: *“Resolve active down forces before moving downhill.”* |

---

## Reserved words

- **`resolve*`** — force lifecycle only (`resolveForce`, `unresolveForce`). Do not use for ID lookup.
- **`lookup*` / `find*`** — locating entities (`lookupInProject`, `findTrackableInProjects`).
- **`Dot` / `dot`** — avoid in `src/` except user-visible strings (aria-label, copy). Prefer `trackable`, `ChartMarker`, `marker`.

---

## File conventions

| Area | Path pattern |
|------|----------------|
| Domain types | `src/schema/types.ts` |
| Chart projections | `src/domain/chartMarkers.ts` |
| Staleness rules | `src/domain/staleness.ts` |
| Panel lookup | `src/domain/trackableLookup.ts` |
| Hill curve geometry | `src/lib/hillCurve.ts` |
| Marker component | `src/components/MarkerChart.vue` |
| Store | `src/stores/hillChart.ts` |
