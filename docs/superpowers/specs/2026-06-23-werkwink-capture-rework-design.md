# werkwink — Capture rework (design)

**Date:** 2026-06-23
**Status:** Approved
**Parent spec:** `docs/werkwink-design-spec.md` (§1, §4.4, §5.3)
**Supersedes:** `docs/superpowers/specs/2026-06-06-werkwink-iteration-14-end-daily-design.md`
**Builds on:** iteration 14 (end-daily snapshots), iteration 15 (trail on chart)

Replace the one-shot, date-locked **"End daily"** ritual with a reversible **"Capture"**
save action. Capturing records today's positions and appends today's notes; it is
idempotent and always available, so a premature or accidental capture is fixed by
simply capturing again. No restore button, no undo stack, no midnight timer.

---

## 1. Why

The shipped "End daily" flow is a one-way door. Once clicked:

- the button locks until the next local calendar day (`lastDailyDate === today`),
- every per-dot note draft is cleared, and
- today's snapshot is frozen — dragging a dot afterwards silently diverges the live
  position from the committed snapshot.

Real scenarios this breaks:

- **Accidental click** — irreversible for the rest of the day; drafts wiped.
- **Multi-day drift** — a draft typed Monday but committed on Wednesday's End daily is
  stamped Wednesday. Drafts persist in `localStorage` across days.
- **Not-daily cadence** — some teams don't run a standup every day; a date-gated
  "daily" is the wrong primitive.

The fix is conceptual, not a patch: **the button is a save, not a ritual boundary.**

### Relationship to reporting

werkwink's second goal is generating ready-to-share reports by exporting state and
feeding it to an AI skill. **Reporting is decoupled from Capture** — the user exports
and reports on their own cadence; Capture's only job is to keep the recorded state
(snapshots + notes) faithful to the conversation. This rework does not add report
generation; it makes the captured data trustworthy enough to report from.

**Out of scope:** resolution reasons on resolved forces (logged follow-up); report
generation skill (separate, outbound); per-day forced snapshots (explicitly not wanted).

---

## 2. Decisions (grill lock-in)

| Topic | Decision |
|-------|----------|
| Concept | **"End daily" → "Capture"** — a reversible save, not a ritual end |
| Availability | **Always available** when `projects.length > 0`; never date-locked |
| Reversibility | **No explicit restore/undo** — re-capture is idempotent (upsert snapshot) |
| Dirty model | **Delta-based**: armed only when something changed since last capture |
| New day, no change | **Idle** ("Captured ✓") — no nagging, no per-day snapshot requirement |
| Snapshot scope per click | **Full** — every dot gets today's snapshot (replace today's if present) |
| Notes input | **Transient, write-only** textarea; never displays past or today's captured text |
| Notes commit | On Capture: **append** non-empty input to today's note entry, then **clear** input |
| Notes across days | Input is transient + cleared on capture → previous notes never exposed |
| `lastDailyDate` | **Removed** from schema; import ignores it (back-compat for old exports) |
| Midnight timer / "Saved" 2s | **Removed** |
| Forces & dirty | Force edits **do not** arm Capture — forces persist live, not part of a snapshot |
| Append separator | **Newline** between fragments appended the same day |

---

## 3. Behaviour

### 3.1 The button

Label and enabled state derive from a single getter:

```
canCapture = projects.length > 0 && (
  ∃ dot: dot.position !== latestSnapshot(dot)?.position   // includes never-captured dots
  OR ∃ dot: dot.dailyNoteDraft.trim() !== ''
)
```

- **Dirty** → label **"Capture"**, enabled.
- **Clean** → label **"Captured ✓"**, disabled (muted, matches disabled Export styling).

`latestSnapshot(dot)` is `snapshots[0]` (snapshots are sorted newest-first). A dot with
no snapshots is dirty (never captured). Comparison is against the latest snapshot of
**any** date — moving a dot back to its last-captured position is *not* dirty.

### 3.2 Capture click

For every project and task:

1. Upsert today's **position** snapshot (`upsertSnapshot`, replaces today's entry).
2. If `dailyNoteDraft.trim()` is non-empty: **append** it to today's note entry
   (`appendDailyNote`, newline-joined), then set `dailyNoteDraft = ''`.

No `lastDailyDate` write. After a capture every dot's `snapshots[0]` is today and every
draft is empty → `canCapture` is false → "Captured ✓". Move a dot or type a note →
re-armed.

### 3.3 Notes

The Notes textarea is a **write-only append buffer**:

- Always shown in the side panel (when a dot is selected); no `canEndDaily` gate.
- Holds only uncommitted input. It does **not** render any committed note — not past
  days, not today's already-captured text (intentional: previous notes are never
  exposed in-app).
- On Capture the buffer is appended to today's note and cleared.
- Because it is cleared on capture and notes are keyed by date at capture time, there is
  no cross-day draft drift.

`notes` history remains **export-only** — read by the report skill, never displayed.

---

## 4. Schema

`src/schema/types.ts`:

- **Remove** `lastDailyDate` from `HillChartState`.
- `dailyNoteDraft` stays (the transient append buffer; persisted so it survives a
  mid-standup refresh).

| Location | Change |
|----------|--------|
| `sample.ts` | drop `lastDailyDate` |
| `validate.ts` | stop emitting `lastDailyDate`; **ignore** an incoming `lastDailyDate` (no error) so old exports still import |
| `exportState()` | no `lastDailyDate` key |
| `importState()` | no `lastDailyDate` copy |
| `cleanState()` | no `lastDailyDate` reset |

Snapshots and notes shapes are unchanged. `version` stays `1` — removing an optional
root field that import already tolerates is backward compatible.

---

## 5. Domain helpers

### 5.1 `appendDailyNote` (replaces `upsertDailyNote`)

`src/domain/dailyNotes.ts`:

```ts
/** Append text to the note for `date` (newline-joined), or create it. Newest date first. */
export function appendDailyNote(notes: DailyNote[], date: string, text: string): DailyNote[]
```

- If an entry for `date` exists → `text = existing.text + '\n' + text`.
- Else → push `{ date, text }`.
- Sort descending by `date`.

### 5.2 Dirty helper

A small predicate (store getter or `src/domain/snapshots.ts` helper):

```ts
/** True when the dot's current position differs from its latest snapshot (or it has none). */
export function isPositionDirty(t: HillTrackable): boolean
```

`canCapture` ORs `isPositionDirty` and `dailyNoteDraft.trim() !== ''` across all
projects and tasks.

### 5.3 `localDate.ts`

`localDateString` stays (used by Capture). `isSameLocalDay` becomes unused once
`canEndDaily` is gone — **remove it** (and its tests) if nothing else references it;
confirm during implementation.

---

## 6. Store

`src/stores/hillChart.ts`:

| Member | Change |
|--------|--------|
| `endDaily()` | rename → `capture()`; commit logic per §3.2 (append notes, no `lastDailyDate`) |
| `canEndDaily` getter | rename → `canCapture`; delta-based per §3.1 |
| `lastDailyDate` state | removed |
| `importState` / `exportState` / `cleanState` | drop `lastDailyDate` handling |
| `setDailyNoteDraft` | unchanged |

`capture()` no-ops when `projects.length === 0`.

---

## 7. UI

### 7.1 `AppHeader.vue`

```ts
defineProps<{ canCapture: boolean; captureLabel: 'Capture' | 'Captured ✓' }>()
defineEmits<{ (e: 'capture-click'): void }>()
```

Remove `endDailyEnabled` / `endDailyLabel` / `end-daily-click`. Button disabled when
`!canCapture`; reuse existing disabled styling.

### 7.2 `OverviewView.vue`

- Bind `canCapture` from the store getter; `captureLabel` is `canCapture ? 'Capture' : 'Captured ✓'`.
- `onCaptureClick` → `store.capture()`. **Remove** the `endDailyLabel` ref and the 2s
  `setTimeout`; the label is now derived, not timed.
- No midnight timer.

### 7.3 `PanelNotes.vue`

- Drop the `canEndDaily` `v-if` — always render the textarea (when a dot is shown).
- Placeholder copy: *"Add to today's note — saved on Capture"* (write-only intent).
- Keep `dailyNoteDraft` two-way binding via `setDailyNoteDraft`.

`ProjectView.vue` — no changes (panel is shared).

---

## 8. Data flow

```
Type a note / drag a dot
  → dot becomes dirty → button shows "Capture"

Capture click
  → for every dot: upsert today's position snapshot
                   append non-empty note draft to today's note, clear draft
  → all dots clean → button shows "Captured ✓"

Move a dot again (same day or later)
  → dirty again → "Capture"; re-capture overwrites today's snapshot (idempotent)

New day, nothing changed
  → latest snapshot still matches position, no draft → "Captured ✓" (idle)
```

---

## 9. Testing

**Gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

| Area | Cases |
|------|-------|
| `appendDailyNote` | creates entry; appends newline-joined to same date; sorts newest-first |
| `isPositionDirty` | true when no snapshots; true when position ≠ latest; false when equal |
| `hillChart.test.ts` | `capture` upserts snapshots on all projects + nested tasks |
| | `capture` appends non-empty drafts to today's note and clears drafts |
| | `capture` leaves empty drafts untouched (no note entry) |
| | second `capture` same day replaces today's snapshot (idempotent) |
| | `canCapture` false after capture with no changes |
| | `canCapture` true after moving a dot / typing a draft |
| | `canCapture` true on a fresh project (empty snapshots) |
| | `capture` no-op when `projects.length === 0` |
| | `exportState` omits `lastDailyDate`; `importState` ignores an incoming `lastDailyDate` |
| `validate.test.ts` | JSON with legacy `lastDailyDate` still validates (field ignored) |

**Manual**

- [ ] Drag a dot → "Capture" arms → click → "Captured ✓"; export shows today's snapshot.
- [ ] Without changing anything, button stays "Captured ✓".
- [ ] Move the dot again → re-arms → capture → today's snapshot updated (not duplicated).
- [ ] Type a note → capture → textarea clears; export shows it in `notes` for today.
- [ ] Type more → capture → today's note has both fragments (newline-joined).
- [ ] Reload mid-standup → uncaptured draft survives (persisted).
- [ ] Import a legacy export containing `lastDailyDate` → no error; field dropped.
- [ ] Empty chart → button disabled.

---

## 10. Files

| File | Action |
|------|--------|
| `src/schema/types.ts` | remove `lastDailyDate` |
| `src/schema/validate.ts` | stop emitting `lastDailyDate`; ignore incoming |
| `src/data/sample.ts` | drop `lastDailyDate` |
| `src/domain/dailyNotes.ts` | `upsertDailyNote` → `appendDailyNote` |
| `src/domain/snapshots.ts` | add `isPositionDirty` (or store-local) |
| `src/lib/localDate.ts` | remove `isSameLocalDay` if unused |
| `src/stores/hillChart.ts` | `endDaily`→`capture`, `canEndDaily`→`canCapture`, drop `lastDailyDate` |
| `src/components/AppHeader.vue` | Capture props/emit + label |
| `src/views/OverviewView.vue` | wire Capture; remove label timer/midnight timer |
| `src/components/PanelNotes.vue` | always-on write-only textarea |
| `src/domain/dailyNotes.test.ts` | append cases |
| `src/stores/hillChart.test.ts` | capture / canCapture cases |
| `src/schema/validate.test.ts` | legacy `lastDailyDate` tolerated |
| `src/components/PanelNotes.test.ts` | always-visible textarea |
| `src/lib/localDate.test.ts` | drop `isSameLocalDay` cases if removed |
| `docs/werkwink-design-spec.md` | ritual, schema, panel, §5.3 |
| `docs/domain-vocabulary.md` | Capture, `canCapture`, notes |
| `skills/building-werkwink-state/knowledge/mapping.md` | drop `lastDailyDate` |
| `src/views/LandingView.vue` | ritual step copy: "Capture" |

**Branch:** `feature/capture-rework` off `main`.

---

## 11. Spec self-review (2026-06-23)

- [x] No TBD placeholders.
- [x] Capture is reversible by idempotent re-capture; no restore/undo needed (grill lock-in).
- [x] Delta-based dirty; idle on a no-change new day (grill lock-in).
- [x] Notes are transient, write-only, append-on-capture, previous notes never exposed (grill lock-in).
- [x] `lastDailyDate` removed; legacy imports tolerated (back-compat).
- [x] Resolution reasons explicitly deferred.
- [x] Reporting decoupled — no report generation in scope.
