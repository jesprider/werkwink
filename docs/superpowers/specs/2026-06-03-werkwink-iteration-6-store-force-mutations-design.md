# werkwink — Iteration 6: Store force mutations (design)

**Date:** 2026-06-03  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (full v1 — peak rule amended below)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 6)  
**Builds on:** iteration 5 (read-only side panel)

Pinia actions for the force lifecycle, with domain rules for blocker snap-back.
The side panel stays read-only; iteration 7 wires forms and chips to these
actions. Peak **drag** blocking is deferred to iteration 16 (spec updated in
roadmap).

---

## 1. Goal

After this iteration:

- **Docs (same branch, before or with implementation):** iteration 6 design doc,
  roadmap updates (iterations 6, 7, 16), and parent spec §2 peak-transition
  amendment — all committed on `feature/iteration-6-store-force-mutations`, not
  `main`.
- The store exposes `addForce`, `updateForce`, `resolveForce`, and
  `unresolveForce` for any project or task dot (`trackableId`).
- Primary assignee forces cannot be resolved.
- Adding or re-activating a **down** force while `position > 50` snaps the dot
  to **45** and updates `lastMovedAt`.
- Vitest covers pure rule helpers and store actions.
- UI unchanged except persisted state reflects mutations if tests call actions
  manually.

---

## 2. Product rule change (peak & blockers)

The parent spec §2 currently says crossing the peak auto-resolves all forces.
**Amended plan** (locked in during iteration 6 design):

| Situation | Behavior | Iteration |
|-----------|----------|-----------|
| Drag/slider past 50 with active down forces | Clamp at 50; panel shows inline hint | 16 |
| Add down force while `position > 50` | Allow; snap to 45 | **6** |
| Unresolve down force while `position > 50` | Allow; snap to 45 | **6** |
| Add down force while `position ≤ 50` | Allow; no position change | **6** |
| New down forces blocked on downhill | **Rejected** — blockers pull the dot back instead | — |

Constants (shared module, reused in iteration 16):

```ts
export const PEAK_POSITION = 50
export const BLOCKER_SNAP_POSITION = 45
```

Rationale: blockers stay consequential. The team must resolve downs before
moving into execution (downhill), but capturing a new blocker while downhill
explicitly pulls work back uphill.

---

## 3. Architecture

**Approach (locked in): pure helpers + thin Pinia actions.**

### 3.1 New module: `src/domain/forceRules.ts`

- Export `PEAK_POSITION`, `BLOCKER_SNAP_POSITION`.
- `hasActiveDownForces(forces: Force[]): boolean`
- `snapIfDownhillWithBlockers(trackable: HillTrackable): void` — if
  `position > PEAK_POSITION` and active downs exist, set
  `position = BLOCKER_SNAP_POSITION` and `lastMovedAt = now`.
- `canCrossPeak(forces: Force[], newPosition: number, currentPosition: number): boolean` — for iteration 16: false when crossing right past peak with active downs (document only; not implemented in iter 6).

### 3.2 Store: `src/stores/hillChart.ts`

Reuse existing `findTrackableById` (or move to shared lookup later). New
actions delegate to `forceRules` where needed.

| Action | Signature | Behavior |
|--------|-----------|----------|
| `addForce` | `(trackableId, direction, label, owner?)` | Append force: `id: \`f_${crypto.randomUUID()}\``, `isPrimary: false`, `status: 'active'`, `createdAt: now`, `resolvedAt: null`, `resolutionReason: null`. If `direction === 'down'`, call `snapIfDownhillWithBlockers`. No-op if trackable missing. |
| `updateForce` | `(trackableId, forceId, { label?, owner? })` | Patch `label` and/or `owner` only. No-op if trackable, force, or patch missing. |
| `resolveForce` | `(trackableId, forceId, reason?)` | Set `status: 'resolved'`, `resolvedAt: now`, `resolutionReason: reason ?? null`. No-op if primary, already resolved, or ids invalid. |
| `unresolveForce` | `(trackableId, forceId)` | Set `status: 'active'`, clear `resolvedAt` and `resolutionReason`. If force is down, call `snapIfDownhillWithBlockers`. No-op if not resolved or ids invalid. |

Invalid ids and guarded no-ops follow existing `setPosition` convention: silent
return, no throw.

### 3.3 ID generation

Use `crypto.randomUUID()` with `f_` prefix (no new dependency). Matches
existing `f_*` sample ids.

---

## 4. Out of scope

- Side panel forms, chips, resolve buttons (iteration 7).
- `setPosition` peak clamp and panel hint (iteration 16).
- Peak auto-resolve on cross (removed from plan).
- `addProject` / `addTask` primary force creation (iterations 10–11).
- Bulk resolve, delete force, change `isPrimary` or direction.

---

## 5. Testing

**File:** `src/domain/forceRules.test.ts` (helpers) + extend
`src/stores/hillChart.test.ts` (action smoke).

| Case | Expected |
|------|----------|
| `addForce` up at position 70 | Force added; position stays 70 |
| `addForce` down at position 70 | Force added; position → 45 |
| `addForce` down at position 40 | Force added; position stays 40 |
| `resolveForce` on primary | Unchanged |
| `resolveForce` with `reason` | `resolutionReason` stored |
| `unresolveForce` down at position 60 | Force active; position → 45 |
| `updateForce` label/owner | Patched; other fields unchanged |
| Unknown trackable/force id | No-op, no throw |

Verify: `npm run test && npm run build`.

---

## 6. Deliverables & likely touch

**Documentation (iteration 6 branch):**

- `docs/superpowers/specs/2026-06-03-werkwink-iteration-6-store-force-mutations-design.md` (this file)
- `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` — iterations 6, 7, 16 peak rules
- `docs/werkwink-design-spec.md` — §2 peak transition and checklist item 13

**Implementation:**

- `src/domain/forceRules.ts` (new)
- `src/domain/forceRules.test.ts` (new)
- `src/stores/hillChart.ts`
- `src/stores/hillChart.test.ts`

**Branch:** `feature/iteration-6-store-force-mutations` (per `AGENTS.md`; off
`main`).

---

## 7. Handoff to iteration 7

- Wire `ForceChip.vue` / `ForceAddForm.vue` to these actions.
- `+ Down force` always available (store handles snap-back).
- Primary chip: no resolve button.
- No peak-clamp UI yet (iteration 16 adds hint when drag blocked at 50).

---

## Spec self-review (2026-06-03)

- No TBD placeholders.
- Peak drag clamp explicitly deferred to iteration 16 with shared constants.
- Snap-back symmetric for `addForce` (down) and `unresolveForce` (down).
- Scope fits a single PR; no panel UI required.
