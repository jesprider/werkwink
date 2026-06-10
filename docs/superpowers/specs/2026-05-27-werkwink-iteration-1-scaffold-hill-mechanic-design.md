# werkwink — Iteration 1: Scaffold + Hill Mechanic (design)

**Date:** 2026-05-27
**Status:** Approved
**Parent spec:** `docs/werkwink-design-spec.md` (full v1)

**Naming (current code):** [`docs/domain-vocabulary.md`](../../domain-vocabulary.md). This doc uses historical names (`Dot.vue`, etc.).

A first prototype to evaluate the core idea. This iteration scaffolds the full
app stack and builds the bare hill mechanic — a hill with draggable dots and
force-count badges. No side panel, no persistence, no time dimension.

---

## 1. Goal

A running Vue app where the `/projects` overview renders the hill curve with all
project dots. Each dot:

- is **draggable** horizontally along the curve (snaps to the curve's y);
- carries its **project color** and a **name label**;
- shows an **`↑N ↓N` badge** of its active up/down force counts.

The full stack (Pinia + Vue Router + Tailwind tokens + fonts) is wired up so
later iterations slot in cleanly, but the hill drag is the only *interactive*
feature this round.

This is enough to feel the central interaction — dragging work along the
uncertainty curve — without building the rest of v1.

---

## 2. Stack

Per the parent spec:

- **Framework:** Vue 3, Composition API, `<script setup>`
- **Build:** Vite
- **Language:** TypeScript
- **Store:** Pinia (no persist plugin this iteration — see §6)
- **Router:** Vue Router, HTML5 history mode
- **Styling:** Tailwind CSS, warm palette as design tokens
- **Testing:** Vitest
- **Linting:** ESLint + Prettier (standard Vue + TS setup)
- **Charting:** native SVG + pointer events, no charting library

Node 24 LTS, pinned via `.nvmrc` and `package.json` `engines`.

---

## 3. Project layout

```
src/
  main.ts
  App.vue                      app shell + <router-view>
  router.ts                    3 routes (see §4)
  stores/
    hillChart.ts               Pinia store; state = schema; setPosition(id, pos) action
  schema/
    types.ts                   Project, Task, Force, Snapshot interfaces (full schema)
  data/
    sample.ts                  ~4 seed projects with forces
  views/
    LandingView.vue            stub (placeholder content)
    OverviewView.vue           live — renders the hill with project dots
    ProjectView.vue            stub (placeholder content)
  components/
    HillChart.vue              the SVG curve + dot layout
    Dot.vue                    single dot: color, label, ↑/↓ badge, drag handle
  composables/
    useHillCurve.ts            curve math + pointer→position mapping
  styles/
    fonts.css                  Fraunces + Inter (Google Fonts)
(Tailwind v4: tokens live in `src/styles/main.css` via `@theme` — no `tailwind.config.ts`)
public/
  _redirects                   SPA fallback: /*  /index.html  200
.nvmrc                         24
```

---

## 4. Routing

Three routes, matching the parent spec, with only the overview live:

- `/` → `LandingView.vue` — stub: app name + one-line description + a link to `/projects`.
- `/projects` → `OverviewView.vue` — **live** hill chart.
- `/projects/:id` → `ProjectView.vue` — stub: shows the project name + a back link.

Side panel is component state (not routed) and is out of scope this iteration.

---

## 5. The hill mechanic

### 5.1 Curve

Symmetric bell, x-axis 0–100, peak at 50, rendered as an SVG path.

**Curve function (chosen):** raised cosine

```
yNorm(x) = (1 − cos(2π · x / 100)) / 2      // 0 at x=0 and x=100, 1 at x=50
```

Considered alternatives: half-sine (`sin(πx/100)` — a single arch, less bell-like
tails) and a Gaussian (faithful but needs a σ to tune). Raised cosine hits 0 at
both ends and 1 at the peak with smooth flat tails and no tuning, closest to the
Basecamp hill feel.

The composable exposes:

- `curveY(x)` → SVG y pixel for a given position `x` (0–100), using the chart's
  width/height and padding.
- `curvePath()` → the SVG path `d` string sampling the curve across 0–100.
- `pointerToPosition(clientX, svgEl)` → maps a pointer x to an **integer 0–100**,
  clamped.

### 5.2 Drag

Native SVG pointer events; no drag library.

- `pointerdown` on a dot starts a drag (pointer capture).
- `pointermove` → `pointerToPosition(...)` → calls store `setPosition(id, pos)`.
- `pointerup` ends the drag.
- We track only `x`/`position`; `y` is always derived from `curveY(x)`, so a dot
  can never leave the curve.

`setPosition` writes `position` and sets `lastMovedAt` to now (free; powers
staleness later, unused this iteration).

### 5.3 Dot rendering

Each project dot:

- filled in its project color (from the palette token);
- a name label rendered beneath the dot (plain per-dot text — **no** leader-line
  overlap resolution this iteration);
- an `↑N ↓N` badge counting active up vs. active down forces from the dot's
  `forces` array.

Done-stacking, staleness satellites, and snapshot trails are **not** rendered.

---

## 6. Data & persistence

- `schema/types.ts` defines the **full** schema (`Project`, `Task`, `Force`,
  `Snapshot`) even where fields are unused this round — the schema types are core
  to the design.
- `data/sample.ts` provides ~4 seed projects, each with a primary up force
  ("Owner") and a mix of additional up/down forces so the badges show varied
  counts. Positions spread across the curve (uphill, near peak, downhill).
- `stores/hillChart.ts` initialises state from `sample.ts` on creation.
- **No persistence this iteration:** the `pinia-plugin-persistedstate` wiring is
  deferred to the iteration that adds real editing. The store re-seeds from
  `sample.ts` on each load — the same starting chart every time, good for
  repeatedly evaluating the drag.

---

## 7. Testing

Vitest unit tests on the pure `useHillCurve` math:

- `yNorm` / `curveY`: endpoints (x=0 and x=100 sit on the baseline) and peak
  (x=50 is the maximum).
- `pointerToPosition`: maps representative pointer x values to the expected
  integer position and **clamps** outside the chart to 0 / 100.

The drag DOM interaction itself is not unit-tested in this spike.

---

## 8. Out of scope this iteration

Deferred to later iterations (all specified in the parent spec):

- Side panel; force add / edit / resolve UX
- Snapshots, "End daily", position trail
- Staleness satellites
- Done-dot stacking column
- Peak-crossing auto-resolve of forces
- Import / Export / Clean
- Landing-page content (kept as a stub)
- `/projects/:id` task view (kept as a stub)
- `localStorage` persistence (`pinia-plugin-persistedstate`)
- Cloudflare deployment (only the trivial `_redirects` / `.nvmrc` are included now)
- The separate tracker-import Claude skill

---

## 9. Delivery

- Work happens on a **new branch**.
- Commits are authored as Roman only — no Claude mentions / no Co-Authored-By
  trailer.
- No PR is opened by the agent; Roman creates the PR.
- Done when `npm run dev` serves the live `/projects` hill with draggable dots
  and `↑/↓` badges, `npm run build` succeeds, and the `useHillCurve` tests pass.
