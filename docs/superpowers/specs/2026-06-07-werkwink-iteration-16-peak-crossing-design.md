# werkwink — Iteration 16: Peak crossing (design)

**Date:** 2026-06-07  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§2 peak transition, checklist item 13)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 16)  
**Builds on:** iteration 6 (`forceRules.ts`, blocker snap-back), iteration 8 (panel slider)

Block entering the downhill while active blockers remain. Drag and slider clamp at
the peak; the side panel explains why when a dot sits at 50 with unresolved downs.

---

## 1. Goal

After this iteration:

- **`setPosition` peak clamp** — when a move would cross **right past 50** (from
  uphill, `currentPosition ≤ 50`, to `newPosition > 50`) and the dot has **any active
  down force**, clamp position to **`PEAK_POSITION` (50)** instead of the requested
  value. Reuse `canCrossPeak` from `src/domain/forceRules.ts`.
- **Side panel hint** — when `position === 50` and active downs exist, show **both**
  the existing “At the peak” line **and** an inline hint: *“Active blockers must be
  resolved before moving downhill.”*
- **Single code path** — chart drag (overview + project view) and panel slider both
  call `setPosition`; no per-caller clamp logic.
- **Vitest** — store tests for clamp behavior; existing `canCrossPeak` unit tests
  remain the authority for edge cases.

**Out of scope:** Transient drag feedback (flash/shake); chart-only hint; rewriting
positions on import/load; staleness (iteration 17); done stack (iteration 18).

**Already shipped (iteration 6):** adding or re-opening a down force while
`position > 50` snaps to **`BLOCKER_SNAP_POSITION` (45)** via
`snapIfDownhillWithBlockers`.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Architecture | **Store-only clamp** (approach A) — wire `canCrossPeak` inside `setPosition` |
| Clamp target | **`PEAK_POSITION` (50)** — not 45 (45 is snap-back when blockers appear downhill) |
| Panel copy at peak + blockers | **Both** — keep “At the peak”; add blocker hint below |
| Blocker hint visibility | **Persistent** while `position === 50` and active downs (not transient on failed drag) |
| Moves already downhill | **Unchanged** — `canCrossPeak` allows `currentPosition > 50` even with active downs |
| Move to exactly 50 | **Allowed** with active downs |
| Import/load | **No position rewrite** — clamp applies on next drag or slider edit only |
| `lastMovedAt` on clamp | **Update only when rounded position changes** — avoid bumping staleness when user drags past 50 but dot stays at 50 |
| UI surfaces | Overview drag, project view drag, side panel slider (all via `setPosition`) |
| New domain helpers | **None** — `canCrossPeak` and constants already exist |

---

## 3. Product rules (full matrix)

| Situation | Behavior | Iteration |
|-----------|----------|-----------|
| Drag/slider from uphill past 50 with active downs | Clamp at **50** | **16** |
| Drag/slider to exactly 50 with active downs | Allow | **16** |
| Move while already downhill (`> 50`) with active downs | Allow | **16** |
| Move left (any direction toward 0) | Always allow | — |
| Add down force while `position > 50` | Snap to **45** | 6 |
| Unresolve down force while `position > 50` | Snap to **45** | 6 |
| Add down force while `position ≤ 50` | No position change | 6 |
| Import JSON with position > 50 + active downs | Keep as-is until next move | **16** |

Rationale (unchanged from iteration 6): blockers must be resolved before execution
(downhill), but capturing a new blocker while downhill explicitly pulls work back
uphill to 45.

---

## 4. Architecture

### 4.1 Store: `setPosition` in `src/stores/hillChart.ts`

Current implementation rounds and clamps 0–100, then always sets `lastMovedAt`.

**New flow:**

1. Find trackable; no-op if missing (unchanged).
2. `const current = trackable.position`
3. `let next = Math.min(100, Math.max(0, Math.round(position)))`
4. If `!canCrossPeak(trackable.forces, next, current)` → `next = PEAK_POSITION`
5. If `next === current` → return (no `lastMovedAt` bump)
6. Else set `trackable.position = next` and `trackable.lastMovedAt = now`

Import `canCrossPeak` and `PEAK_POSITION` from `../domain/forceRules`.

**Why step 5:** repeated drag attempts against the peak should not age the dot in
iteration 17 staleness logic.

### 4.2 Domain: `src/domain/forceRules.ts`

**No logic changes.** Remove the stale comment `Used by setPosition in iteration 16 —
not wired yet.` on `canCrossPeak`.

Existing `canCrossPeak` semantics (covered by tests):

```ts
const crossingRightPastPeak =
  newPosition > PEAK_POSITION && currentPosition <= PEAK_POSITION
if (crossingRightPastPeak && hasActiveDownForces(forces)) return false
```

Resolved downs do not count (`status === 'active'` only).

### 4.3 Side panel: `src/components/SidePanel.vue`

Add computed:

```ts
const hasActiveBlockers = computed(() =>
  trackable.value ? hasActiveDownForces(trackable.value.forces) : false,
)
const showBlockerHint = computed(() => atPeak.value && hasActiveBlockers.value)
```

Import `hasActiveDownForces` from `../domain/forceRules`.

**Position section template:**

- Keep existing slider + numeric readout.
- Keep `<p v-if="atPeak">At the peak</p>`.
- Add below it when `showBlockerHint`:

  *“Active blockers must be resolved before moving downhill.”*

  Same visual tier as “At the peak” (`text-sm text-text-warm/70`). Optional: slightly
  stronger emphasis (`text-text-warm/80`) — match existing muted helper copy; no new
  color token.

No changes to `HillChart.vue`, `ChartMarker`, or views beyond what store reactivity
already provides.

---

## 5. Data flow

### 5.1 Chart drag

1. User drags dot on overview or project view.
2. `HillChart` emits `move(id, positionFromRatio(ratio))`.
3. View calls `store.setPosition(id, position)`.
4. Store applies 0–100 round/clamp, then peak rule; marker re-renders at 50 if blocked.

### 5.2 Panel slider

1. User moves range input.
2. `onSliderInput` → `store.setPosition(trackableId, value)`.
3. Same store path; slider thumb and numeric label stay at 50 when blocked.
4. If at 50 with active downs, both panel lines visible.

### 5.3 Resolve last blocker at peak

1. User resolves final active down force at position 50.
2. `showBlockerHint` becomes false; “At the peak” remains.
3. Next drag/slider past 50 succeeds without clamp.

---

## 6. Error handling & accessibility

- Unknown `trackableId`: silent no-op (unchanged).
- Blocker hint is plain text in the position section — no `aria-live` (persistent
  state, not a toast).
- Slider already exposes `aria-valuenow`; when clamped, value stays 50 — consistent
  with visual state.

---

## 7. Tests

### 7.1 `src/stores/hillChart.test.ts` (new cases)

Use sample data; ensure project has active down forces where needed (`addForce` or
mutate sample).

| Case | Setup | Action | Expect |
|------|-------|--------|--------|
| Block cross from uphill | position 40, active down | `setPosition(id, 55)` | position **50** |
| Allow land on peak | position 48, active down | `setPosition(id, 50)` | position **50** |
| Allow when no downs | position 40, no downs | `setPosition(id, 55)` | position **55** |
| Allow move on downhill | position 60, active down | `setPosition(id, 80)` | position **80** |
| No lastMovedAt bump | position 50, active down | `setPosition(id, 55)` | position **50**, `lastMovedAt` unchanged |
| Cross after resolve | at 50 with down, resolve down | `setPosition(id, 55)` | position **55** |

### 7.2 Existing tests

- `forceRules.test.ts` — `canCrossPeak` cases unchanged.
- Iteration 6 snap-back tests — unchanged.
- `setPosition` rounding/clamp tests — still pass; may need a project **without**
  active downs for moves past 50 if sample projects have downs at low positions.

### 7.3 Manual verification

- [ ] Project with active down at ~40: drag past peak → stops at 50; panel shows both lines.
- [ ] Same dot: resolve all downs → drag past 50 → moves downhill.
- [ ] Dot at 60 with active down: drag further right → moves freely.
- [ ] Add down force at 70 → snaps to 45 (regression, iteration 6).
- [ ] Slider blocked same as drag.
- [ ] `npm run lint && npm run test && npm run build`

---

## 8. Files touched

| File | Change |
|------|--------|
| `src/stores/hillChart.ts` | Peak clamp in `setPosition`; early return when position unchanged |
| `src/stores/hillChart.test.ts` | Peak clamp store tests |
| `src/domain/forceRules.ts` | Remove “not wired yet” comment |
| `src/components/SidePanel.vue` | Blocker hint computed + copy |
| `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` | Mark iteration 16 **done** + link this doc when implementation ships |

**No changes:** `HillChart.vue`, views, import/export, schema.

---

## 9. Spec self-review

- [x] No TBD placeholders.
- [x] Consistent with iteration 6 constants and `canCrossPeak` tests.
- [x] Panel copy matches brainstorm lock-in (both lines at peak + blockers).
- [x] Import/load explicitly out of scope (parent spec + iteration 12).
- [x] Scope fits a single implementation plan; no iteration 17+ pull-forward.
