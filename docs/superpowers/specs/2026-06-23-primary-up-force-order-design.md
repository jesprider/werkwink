# werkwink — Primary up force pinned first (design)

**Date:** 2026-06-23  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.4 side panel)  
**Builds on:** iteration 7 panel force UX (`forcesByStatus` display ordering)

In the side panel **Active up forces** list, the primary Owner force should
always appear first, regardless of when other up forces were added.

---

## 1. Goal

After this change:

- The primary up force (`isPrimary: true`, label `"Owner"`) is always **first** in
  the Active up forces section.
- Other active up forces remain sorted **newest first** (`createdAt` desc) below
  the primary force.
- Active down forces and past (resolved) lists are **unchanged**.

**Out of scope:** Store mutations, schema changes, chip UX, resolve/unresolve
behavior, down-force ordering.

---

## 2. Root cause

`forcesByStatus` in `src/domain/trackableLookup.ts` sorts all active forces by
`createdAt` descending. Newly added up forces have a later `createdAt` than the
primary Owner force created at project/task birth, so they render above Owner.

Iteration 7 locked ordering as `createdAt` desc without a primary pin rule.

---

## 3. Decision (brainstorm)

| Topic | Decision |
|-------|----------|
| What “owner on top” means | Primary force only (`isPrimary: true`), not forces with a non-null `owner` field |
| Where to implement | **`forcesByStatus`** sort comparator (recommended over SidePanel-only reorder) |
| Pin scope | Active **up** forces only |
| Tie-break among non-primary | `createdAt` desc (unchanged) |
| Resolved / past up forces | No pin — still `resolvedAt` desc |

Rejected alternatives:

- **SidePanel computed reorder** — duplicates logic; drifts if another consumer
  lists forces.
- **Dedicated `activeUpForcesOrdered` helper** — extra surface for a few lines;
  `forcesByStatus` already owns display order for all four panel lists.

---

## 4. Implementation

### 4.1 `forcesByStatus` sort

In `src/domain/trackableLookup.ts`, extend the sort comparator:

1. When `direction === 'up'` and `status === 'active'`:
   - If `a.isPrimary && !b.isPrimary` → `a` first (`-1`).
   - If `!a.isPrimary && b.isPrimary` → `b` first (`1`).
2. Otherwise fall through to existing date sort:
   - Active: `createdAt` desc.
   - Resolved: `resolvedAt ?? createdAt` desc.

Validation guarantees exactly one active primary up force per trackable, so no
multi-primary tie-break is needed.

### 4.2 Consumers

`SidePanel.vue` already uses `forcesByStatus` for all four force lists. No
component changes required.

---

## 5. Testing

Add a unit test in `src/domain/trackableLookup.test.ts`:

- Fixture: one primary up force (older `createdAt`) + one non-primary active up
  force (newer `createdAt`).
- Assert `forcesByStatus(forces, 'up', 'active')[0].isPrimary === true`.
- Assert non-primary is second.

Keep existing resolved-sort test unchanged.

Run: `npm run test`

---

## 6. Verification checklist

- [ ] Open a project with Owner + at least one other active up force — Owner is
  first in the panel.
- [ ] Add a new up force — Owner stays first; new force appears below Owner,
  above older non-primary forces.
- [ ] Active down and past sections sort unchanged.
