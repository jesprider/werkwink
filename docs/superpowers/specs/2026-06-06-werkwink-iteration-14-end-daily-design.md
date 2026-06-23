# werkwink — Iteration 14: End daily (design)

> **Superseded (2026-06-23):** "End daily" was reworked into the reversible **Capture**
> action. `lastDailyDate`, the once-per-day lock, the 2s "Saved" label, and the
> draft-clear-on-commit behaviour described below no longer apply. See
> `docs/superpowers/specs/2026-06-23-werkwink-capture-rework-design.md`. This document
> is kept as the historical record of the original snapshot mechanic.

**Date:** 2026-06-06  
**Status:** Superseded by Capture rework (2026-06-23)  
**Parent spec:** `docs/werkwink-design-spec.md` (§5.3)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 14)  
**Builds on:** iteration 4 (header stubs), iteration 13 (export/clean + persist)

Explicit snapshot commit for today's standup: one click records every project and
task position; the header button gives brief feedback and stays off until the next
local calendar day.

---

## 1. Goal

After this iteration:

- **End daily** — overview header button calls `endDaily()`: for every project and
  nested task, upsert a snapshot for **today's local calendar date** with the dot's
  current `position` (replace if today already exists).
- **Button UX** — on click, label becomes **"Saved"** for 2 seconds, then returns
  to **"End daily"**; button stays **disabled until the next local calendar day**
  (even if the user adds projects or tasks later that day).
- **Wire header** End daily on overview (replace iteration 4 stub).

**Out of scope:** Ghost trail on chart (iteration 15); confirmation modal (parent spec
§5.3); side-panel sparkline (iteration 19); End daily on project view (no `AppHeader`
there today).

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Snapshot date | **Local calendar date** — `YYYY-MM-DD` in the browser timezone |
| Once per day | **`lastDailyDate`** on root state; button disabled when it equals today |
| Post-click label | **"Saved"** for **2 seconds**, then **"End daily"**; disabled throughout |
| New dots same day | **Wait until tomorrow** — no auto-snapshot; button stays disabled |
| Empty chart | End daily **disabled** when `projects.length === 0` (store no-op if called) |
| Demo data | End daily **works** on demo chart (`demo: true` unchanged) |
| Confirm dialog | **None** (parent spec §5.3) |
| Snapshot ordering | **Newest date first** (matches parent spec JSON examples; iteration 15 reads last 10) |
| Persist tracking | Root field **`lastDailyDate: string \| null`**, not derived from per-dot snapshots |
| Midnight rollover | **`setTimeout`** to next local midnight in `OverviewView` so an open tab re-enables without refresh |
| Surface | **Overview only** (same as Import / Export / Clean) |
| Architecture | Store action + `localDate` helper + thin header wiring (matches iteration 13 pattern) |

---

## 3. Schema

Add to `HillChartState` in `src/schema/types.ts`:

```ts
lastDailyDate: string | null  // local YYYY-MM-DD of last completed daily
```

| Location | Value |
|----------|--------|
| `sample.ts` | `null` |
| `cleanState()` | `null` |
| `exportState()` / `importState()` | include field |
| `validate.ts` | optional; if present must be a parseable date string (same rule as snapshot `date`) |
| Existing `localStorage` without field | treat as `null` on hydrate |

**Why not derive from snapshots:** a project or task added after End daily would lack
today's snapshot and would incorrectly re-enable the button. `lastDailyDate` records
that the ritual was completed for the day regardless of later additions.

---

## 4. Date helper

New `src/lib/localDate.ts`:

```ts
/** Local calendar date as YYYY-MM-DD (zero-padded). */
export function localDateString(d?: Date): string

/** True when dateStr is the same local calendar day as d (default now). */
export function isSameLocalDay(dateStr: string, d?: Date): boolean

/** Ms until next local midnight (for OverviewView timer). */
export function msUntilLocalMidnight(d?: Date): number
```

Implementation: use the environment's local `getFullYear()` / `getMonth()` /
`getDate()` — not UTC.

---

## 5. Store

### 5.1 Snapshot upsert (private helper in store file or `src/domain/snapshots.ts`)

For a trackable's `snapshots` array, given `date` and `position`:

1. Find index where `snapshot.date === date`.
2. If found → replace `position` in place.
3. Else → insert `{ date, position }`.
4. Sort descending by `date` string (ISO date strings sort lexicographically).

Does not change `lastMovedAt` — snapshots are ritual commits, not drags.

### 5.2 `endDaily(): void`

1. If `this.projects.length === 0` → return (no-op).
2. `const today = localDateString()`.
3. For each project:
   - Upsert today's snapshot from `project.position`.
   - For each task in `project.tasks`, upsert from `task.position`.
4. Set `this.lastDailyDate = today`.
5. Pinia persist writes to `localStorage`.

**Replace semantics:** second click same day is prevented by UI; if invoked
programmatically, upsert replaces today's entry (parent spec §5.3).

### 5.3 Existing actions

| Action | `lastDailyDate` |
|--------|-----------------|
| `cleanState()` | reset to `null` |
| `exportState()` | include current value |
| `importState()` | copy from imported state (may disable End daily if import carries today's date) |
| `addProject()` / `addTask()` | unchanged — new dot gets `snapshots: []`, no today entry |

---

## 6. UI

### 6.1 `AppHeader.vue`

Extend props:

```ts
endDailyEnabled: boolean
endDailyLabel: 'End daily' | 'Saved'
```

Extend emits:

```ts
(e: 'end-daily-click'): void
```

| Button | Enabled | Label | Disabled styling |
|--------|---------|-------|------------------|
| End daily | `endDailyEnabled` | `endDailyLabel` | Muted pill, `cursor-not-allowed` (match Export disabled) |

Remove hardcoded `disabled` stub.

### 6.2 `OverviewView.vue`

```ts
const today = localDateString()
const endDailyEnabled = computed(
  () => projects.value.length > 0 && store.lastDailyDate !== today,
)
const endDailyLabel = ref<'End daily' | 'Saved'>('End daily')
```

**Midnight timer:** on mount, schedule `setTimeout(msUntilLocalMidnight(), …)` to
bump a `dayKey` ref (or re-read `localDateString()` in computed). Reschedule after
fire. Ensures button re-enables when the tab stays open past local midnight.

**Handler `onEndDailyClick`:**

1. `store.endDaily()`
2. `endDailyLabel = 'Saved'`
3. After 2000 ms → `endDailyLabel = 'End daily'` (button remains disabled via
   `lastDailyDate === today`)

`ProjectView.vue` — no changes.

---

## 7. Data flow

```
End daily click
  → endDaily()
      → upsert snapshot (today, position) on every project + task
      → lastDailyDate = today
      → persist
  → label "Saved" (2s)
  → label "End daily", disabled until local date changes

Add project/task later same day
  → snapshots: [] on new dot (no today entry)
  → lastDailyDate still today → button stays disabled
```

---

## 8. Error handling & accessibility

- Button uses native `disabled` when not enabled; no extra tooltip in v14.
- No confirmation dialog (parent spec).
- "Saved" state is visual-only; no `aria-live` requirement in v14.

---

## 9. Testing

**Gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Cases |
|------|--------|
| `localDate.ts` | `localDateString` format; `isSameLocalDay` true/false across midnight boundary (mock `Date`) |
| `hillChart.test.ts` | `endDaily` sets snapshots on all projects and nested tasks |
| | Replaces existing snapshot when same `date` already present |
| | Snapshots sorted newest-first after upsert |
| | Sets `lastDailyDate` to today's local date |
| | No-op when `projects.length === 0` |
| | `addTask` after `endDaily` — new task has no today snapshot; `lastDailyDate` unchanged |
| | `cleanState` clears `lastDailyDate` |
| | `exportState` includes `lastDailyDate` |

Skip DOM tests for 2s label timer unless trivial with fake timers.

**Manual**

- [ ] Chart with projects → End daily → inspect `localStorage` / export JSON for today's snapshots on all dots and `lastDailyDate`.
- [ ] Click again same day → button disabled (cannot click).
- [ ] Drag dot after End daily → position changes but today's snapshot unchanged until next day.
- [ ] Add project after End daily → no today snapshot on new project; button still disabled.
- [ ] Empty chart → End daily disabled.
- [ ] Label shows "Saved" ~2s then "End daily".
- [ ] Demo chart → End daily works; `demo` stays `true`.
- [ ] Clean → `lastDailyDate` null; End daily enabled when projects re-added.
- [ ] Export → Clean → Import file with `lastDailyDate` on same day → End daily disabled.

---

## 10. Files

| File | Action |
|------|--------|
| `src/lib/localDate.ts` | New date helpers |
| `src/lib/localDate.test.ts` | Unit tests |
| `src/domain/snapshots.ts` | Optional: `upsertSnapshot` helper + tests |
| `src/schema/types.ts` | Add `lastDailyDate` |
| `src/schema/validate.ts` | Parse optional `lastDailyDate` |
| `src/data/sample.ts` | `lastDailyDate: null` |
| `src/schema/testFixtures.ts` | Add field if root fixture used |
| `src/stores/hillChart.ts` | `endDaily`, wire clean/export/import |
| `src/stores/hillChart.test.ts` | End daily cases |
| `src/components/AppHeader.vue` | End daily props + emit |
| `src/views/OverviewView.vue` | Handler, enabled/label, midnight timer |
| `docs/superpowers/specs/2026-06-06-werkwink-iteration-14-end-daily-design.md` | This doc |

**Branch:** `feature/iteration-14-end-daily` off `main`.

**Roadmap update (when implementation ships):** iteration 14 → `done`; add doc row
in "Completed iteration docs"; M5 in progress (complete at iteration 15).

---

## 11. Spec self-review (2026-06-06)

- [x] No TBD placeholders.
- [x] Local calendar date for snapshots and `lastDailyDate` (user lock-in A).
- [x] "Saved" 2s then disabled until next local day (user lock-in).
- [x] New dots wait for next End daily; no re-enable on add (user lock-in A).
- [x] `lastDailyDate` naming (user rename from `lastEndDailyDate`).
- [x] Scope matches roadmap iteration 14 only; trail rendering deferred to 15.
- [x] Schema field included in export/import/clean for round-trip consistency.
