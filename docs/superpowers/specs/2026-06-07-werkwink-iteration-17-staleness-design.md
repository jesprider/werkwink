# werkwink — Iteration 17: Staleness satellites (design)

**Date:** 2026-06-07  
**Status:** Approved (amended during implementation — satellites replace color lerp)  
**Parent spec:** `docs/werkwink-design-spec.md` (§5.8 staleness satellites)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 17)  
**Builds on:** iteration 15 (ghost trails), iteration 16 (`lastMovedAt` only bumps on real moves)

Dots that have not moved recently show small red **staleness satellites** on the
upper arc of the main marker. The side panel states how many days without movement.
Main dot fill stays the project color.

---

## 1. Goal

After this iteration:

- **Staleness satellites** — small `#C04A2D` circles on the upper arc of each live
  dot (projects on overview; project + tasks on project view). One satellite per
  day without movement, starting on **day 2**, max **4**, placed left → right along
  the arc.
- **Grace day** — moved yesterday → 0 satellites (no visual alarm yet).
- **Side panel** — when `daysSinceLastMove ≥ 1`, show “N day(s) without movement”
  in the Position section.
- **Done skip** — at `position === 100`, no satellites and no panel note.
- **Ghost trails** — project palette color only; satellites apply to the live dot.
- **Recompute trigger** — when marker models rebuild (store change, navigation, page
  load). No midnight timer.
- **Vitest** — calendar-day math, satellite count, done skip, panel day helper.

**Out of scope:** Changing when `lastMovedAt` is written; staleness on ghost dots;
midnight auto-refresh.

---

## 2. Decisions (brainstorm + implementation lock-in)

| Topic | Decision |
|-------|----------|
| Visual model | **Satellites** — not fill reddening / lerp (original spec amended) |
| Satellite meaning | **One per day without movement**, from day 2, max 4 |
| Grace day | **Moved yesterday → 0 satellites** |
| Placement | **Upper arc**, evenly spaced slots left → right |
| Main dot color | **Project palette** — unchanged |
| Ghost trail color | **Project palette only** |
| Done at 100 | **Skip** satellites and panel note |
| Panel copy | **“N day(s) without movement”** when days ≥ 1 |
| Architecture | **Pure domain helpers** in `staleness.ts`; pre-compute in `chartMarkers.ts` |
| Recompute | **On marker rebuild** — no timer |

---

## 3. Domain: `src/domain/staleness.ts`

### 3.1 Constants

```ts
export const STALE_RED = '#C04A2D'
export const STALENESS_MAX_SATELLITES = 4
export const STALENESS_SATELLITE_START_DAY = 2
export const DONE_POSITION = 100
```

### 3.2 Calendar-day difference

```ts
export function daysSinceLastMove(lastMovedAt: string, today = new Date()): number
```

Local calendar days from `lastMovedAt`'s day through today (today = 0). Uses
`localDateString` from `src/lib/localDate.ts`.

### 3.3 Satellite count

```ts
export function stalenessSatelliteCount(
  lastMovedAt: string,
  position: number,
  today = new Date(),
): number
```

- If `position === DONE_POSITION` → **0**
- If `daysSinceLastMove < STALENESS_SATELLITE_START_DAY` → **0**
- Else → `min(daysSinceLastMove - 1, STALENESS_MAX_SATELLITES)`

| Days since move | Satellites |
|-----------------|------------|
| 0 (today) | 0 |
| 1 (yesterday) | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 |
| 5+ | 4 |

### 3.4 Panel copy helper

```ts
export function daysWithoutMovement(
  lastMovedAt: string,
  position: number,
  today = new Date(),
): number
```

Returns **0** at `DONE_POSITION`; otherwise `daysSinceLastMove`. Panel shows copy
when result ≥ 1.

---

## 4. Marker models: `src/composables/chartMarkers.ts`

```ts
export interface ChartMarker {
  id: string
  position: number
  color: string       // project palette hex — main dot and ghost trail
  radius: number
  name: string
  up: number
  down: number
  stalenessSatellites: number
  ghosts: TrailGhost[]
}
```

`stalenessSatellites: stalenessSatelliteCount(lastMovedAt, position)` per trackable.

---

## 5. Rendering

### 5.1 `MarkerChart.vue`

- Props include `stalenessSatellites: number`.
- Draw main dot at `color` (project palette).
- Draw `stalenessSatellites` small circles on the upper arc (`STALE_RED`), using
  evenly spaced slot angles left → right (max 4 slots).

### 5.2 `HillChart.vue`

- `MarkerTrail` and `MarkerChart` → `m.color` (project palette)
- `MarkerChart` also receives `:staleness-satellites="m.stalenessSatellites"`

### 5.3 `SidePanel.vue`

In Position section, after slider:

- `daysWithoutMovement(lastMovedAt, position)` → label when ≥ 1
- “1 day without movement” / “N days without movement”

---

## 6. Data flow

1. Store holds `lastMovedAt` on each trackable.
2. `overviewMarkers` / `markersForProject` compute `stalenessSatellites`.
3. User drags dot → `setPosition` → `lastMovedAt` now → satellites clear.
4. User selects dot at 100 → no satellites, no panel staleness line.

---

## 7. Tests

### 7.1 `src/domain/staleness.test.ts`

- Calendar-day diff edge cases
- Satellite count: grace day, 2→1, cap at 4, skip at position 100
- `daysWithoutMovement` skip at 100

### 7.2 `src/composables/chartMarkers.test.ts`

- Fresh `lastMovedAt` → 0 satellites
- Old `lastMovedAt` → 4 satellites
- Position 100 → 0 satellites

### 7.3 Manual verification

- [ ] Grace day: moved yesterday → no satellites; panel shows “1 day”
- [ ] 2+ days → satellites appear left → right on upper arc
- [ ] Done dot at 100 → no satellites or panel note
- [ ] Drag stale dot → satellites disappear
- [ ] `npm run lint && npm run test && npm run build`

---

## 8. Files touched

| File | Change |
|------|--------|
| `src/domain/staleness.ts` | Day math, satellite count, panel helper |
| `src/domain/staleness.test.ts` | Domain unit tests |
| `src/composables/chartMarkers.ts` | `stalenessSatellites` on `ChartMarker` |
| `src/composables/chartMarkers.test.ts` | Satellite assertions |
| `src/components/MarkerChart.vue` | Render satellites on upper arc |
| `src/components/HillChart.vue` | Pass `stalenessSatellites` prop |
| `src/components/SidePanel.vue` | Days-without-movement copy |
| `docs/domain-vocabulary.md` | Staleness satellite terms |
| `docs/werkwink-design-spec.md` | §5.8, checklist item 30 |

---

## 9. Spec self-review

- [x] Reflects shipped satellite model (not color lerp).
- [x] Grace day, max 4, done skip, panel copy documented.
- [x] Ghost trails unchanged.
- [x] Vocabulary aligned with `docs/domain-vocabulary.md`.
