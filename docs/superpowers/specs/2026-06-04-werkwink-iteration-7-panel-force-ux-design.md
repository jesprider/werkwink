# werkwink — Iteration 7: Panel force UX (design)

**Date:** 2026-06-04  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.4–4.5, §5.6)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 7)  
**Builds on:** iteration 5 (read-only side panel), iteration 6 (store force mutations)

Wire the project-view side panel to force lifecycle actions: add, edit, resolve,
and unresolve — with click-to-edit chips and inline add forms.

---

## 1. Goal

After this iteration, a manager running the daily on the **project view** can:

- Add up and down forces from the side panel (`+ Up force` / `+ Down force`).
- Edit force label and owner in place on active chips (including primary).
- Resolve non-primary forces with a ✓ control.
- Restore resolved forces by clicking chips in past sections.
- See chart badge counts and positions update (including blocker snap-back to 45
  when adding or restoring a down force downhill — store behavior from iteration 6).

**Out of scope:** Overview side panel (iteration 9); dot name/position/source edits
(iteration 8); peak drag clamp and panel hint (iteration 16); `resolutionReason`
UI; force delete.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Force editing in v7 | Full in-place label/owner edit (`updateForce`), not add/resolve only |
| Resolve | ✓ only; `resolutionReason` always null in UI |
| Active chip edit UX | Click-to-edit; Enter/blur save, Esc cancel |
| Edit affordance | Hover cues editability (`cursor-text`, subtle underline/ring); if noisy in review, fall back to pencil icon (same edit mode) |
| Primary force | Same edit UX; no resolve button |
| Concurrent edit | One chip in edit mode; opening another cancels previous (discard draft) |
| Add vs edit focus | Opening add form cancels chip edit; starting chip edit closes add form |
| Empty label | Reject save/add; keep form or edit mode open |
| Past forces | Click whole chip → `unresolveForce`; no inline edit on past chips |
| Force ordering | Within each list: `createdAt` desc (active); resolved: `resolvedAt` desc |

---

## 3. Architecture

**Recommended structure:** `SidePanel` orchestrates; `ForceChip` and `ForceAddForm`
are focused child components (roadmap + parent spec §7 file list).

### 3.1 `SidePanel.vue`

- Props unchanged: `project`, `trackableId`.
- State: `editingForceId: string | null`, `addingDirection: 'up' | 'down' | null`.
- Replace read-only force `<li>` elements with `ForceChip` / `ForceAddForm`.
- Call store: `useHillChartStore()` → `addForce`, `updateForce`, `resolveForce`,
  `unresolveForce` with `trackableId`.
- Clear `editingForceId` and `addingDirection` when `trackableId` changes or panel
  closes.

### 3.2 `ForceChip.vue`

Props (illustrative):

- `force`, `variant: 'active' | 'past'`, `isEditing`, `showResolve`

Emits:

- `edit-start`, `save({ label, owner })`, `cancel`, `resolve` (active only)
- Past variant: `@click` → parent calls `unresolveForce` (or emit `unresolve`)

**Active — display mode:** Read-only label + owner; primary badge; resolve ✓ when
`!force.isPrimary`. Hover: `cursor-text`, light underline/ring on label,
`title="Click to edit"` (tune in implementation).

**Active — edit mode:** Label and owner inputs; Enter or blur on last field saves
(trim label; reject empty); Esc cancels.

**Past:** Muted chip styling; click restores; hover hint e.g. “Click to restore”;
`aria-label` for restore action.

### 3.3 `ForceAddForm.vue`

- Inline row: label + owner inputs.
- Enter → parent `addForce` after trim/non-empty label check.
- Esc → parent closes form.
- `autofocus` on label when opened.

### 3.4 Store

No new actions expected. Existing behavior:

- `resolveForce` no-ops for primary.
- `addForce` / `unresolveForce` on down may call `snapIfDownhillWithBlockers`.
- `updateForce` patches label/owner only.

---

## 4. Data flow

### 4.1 Edit active chip

1. User clicks chip body → `edit-start` → panel sets `editingForceId`.
2. User edits draft locally in `ForceChip`.
3. Enter or blur on last field → trim label; if empty, stay in edit; else
   `updateForce` → clear `editingForceId`.
4. Esc → cancel draft → clear `editingForceId`.
5. Opening edit on another chip or add form → cancel previous edit (discard).

### 4.2 Add force

1. User clicks `+ Up force` or `+ Down force` → `addingDirection` set; chip edit
   cleared.
2. `ForceAddForm` shown at end of that section.
3. Enter with non-empty trimmed label → `addForce` → close form.
4. Esc → close form without store call.

`+ Down force` is always available (including at peak and downhill).

### 4.3 Resolve / unresolve

- **Resolve:** ✓ on active non-primary chip → `resolveForce(trackableId, forceId)`
  (no reason).
- **Unresolve:** click past chip → `unresolveForce(trackableId, forceId)`.

### 4.4 Chart sync

Reactive store updates refresh `HillChart` markers and panel position readout.
Position remains read-only in the panel until iteration 8.

---

## 5. Error handling & accessibility

- Store no-ops (missing ids): silent; UI prevents invalid resolve on primary.
- Empty label: client-side block only; optional `aria-invalid` on label input.
- Snap-back to 45: no extra copy in v7; position number updates on re-render.
- Resolve button: `aria-label="Resolve force"`.
- Add buttons: include direction in accessible name.
- Past chip: `aria-label` describing restore action.

---

## 6. Testing

**Required CI/local gate:** `npm run lint && npm run format:check && npm run test && npm run build`.

**Store:** Covered by iteration 6; no new store tests required for v7 unless a
regression is found.

**Component tests:** Optional. If added, cover: empty label rejected on save;
primary hides resolve control.

**Manual test plan**

- [ ] Project view: select dot → panel shows forces.
- [ ] Add up/down; Enter/Esc; empty label blocked.
- [ ] Edit active and primary forces (hover affordance); only one edit at a time.
- [ ] Resolve non-primary; listed under past; click past chip → active.
- [ ] Add/restore down while position > 50 → snaps to 45; persists after refresh.
- [ ] Chart `↑/↓` badges update after mutations.

---

## 7. Files

| File | Action |
|------|--------|
| `src/components/ForceChip.vue` | Create |
| `src/components/ForceAddForm.vue` | Create |
| `src/components/SidePanel.vue` | Update |
| `docs/superpowers/specs/2026-06-04-werkwink-iteration-7-panel-force-ux-design.md` | This doc |

**Branch (implementation):** `feature/iteration-7-panel-force-ux` off `main`.

---

## 8. Spec self-review (2026-06-04)

- [x] No TBD placeholders.
- [x] Consistent with iteration 6 store API and snap-back rules.
- [x] Scope limited to project-view panel; no iteration 8/9/16 pull-forward.
- [x] Empty label and single-edit rules explicit.
- [x] Hover-first edit affordance with documented pencil fallback.
