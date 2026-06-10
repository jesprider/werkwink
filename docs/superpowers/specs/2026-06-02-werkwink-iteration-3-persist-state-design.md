# werkwink — Iteration 3: Persist State (design)

**Date:** 2026-06-02
**Status:** Approved
**Parent spec:** `docs/werkwink-design-spec.md` (full v1)
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 3)
**Builds on:** `docs/superpowers/specs/2026-05-29-werkwink-iteration-2-project-view-tasks-design.md`

State survives browser refresh. Dragging a dot writes through to `localStorage`;
reloading restores positions. Invalid stored data fails loud with a blocking error
page — no silent fallback, no in-app recovery button.

---

## 1. Goal

After this iteration:

- A first-time visitor (empty `localStorage`) sees the same sample data as today.
- After dragging any dot, a refresh keeps the new positions (overview and project
  view stay in sync — unchanged from iteration 2, now persisted).
- Corrupt or structurally invalid stored JSON blocks the app with a full-screen
  error that names the storage key and shows the parse/validation message.

No new UI features beyond the error page. No import/export, no schema migration.

---

## 2. Stack

Add one dependency:

- **`pinia-plugin-persistedstate`** v4.x (Pinia 3 compatible; peer `pinia >= 3`)

Everything else unchanged (Vue 3, Vite, TypeScript, Pinia, Vitest, Tailwind v4).

---

## 3. Architecture

**Approach A (locked in): pre-flight validation in `main.ts`, plugin for sync.**

### 3.1 Storage key

Export a constant used everywhere:

```ts
export const HILL_CHART_STORAGE_KEY = 'hill-chart-state'
```

Matches parent spec §7.

### 3.2 Pure loader — `src/storage/loadState.ts`

```ts
/** Returns null when the key is absent (first visit). Throws StorageLoadError on bad data. */
export function readStoredStateRaw(): string | null

/** Parse + minimal structural validation. Throws StorageLoadError with a descriptive message. */
export function parseStoredState(raw: string): HillChartState
```

**Validation rules (minimal, iteration 3 only):**

1. Valid JSON — on `JSON.parse` failure, throw e.g. `Invalid JSON: <parser message>`.
2. Root must be a plain object (not array, not null).
3. `version` must be present and typeof `number`.
4. `projects` must be present and `Array.isArray(projects)`.

Do **not** validate nested project/task/force shape — that belongs to iteration 12
(`schema/validate.ts`). Do **not** require `exportedAt`; the plugin may omit
fields Pinia does not track until first write.

`StorageLoadError` extends `Error` with a stable `name` for typing in bootstrap.

### 3.3 Bootstrap — `main.ts`

```
read localStorage[HILL_CHART_STORAGE_KEY]
  ├─ key absent     → boot app normally (store seeds from sample.ts)
  ├─ key present, parse fails → mount StorageErrorView only (no router, no store)
  └─ key present, parse ok    → boot app normally (plugin hydrates on store init)
```

Boot sequence on success:

```ts
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
createApp(App).use(pinia).use(router).mount('#app')
```

Pre-flight and plugin hydrate both read the same key on the happy path (double
parse). Acceptable for v1 data size; keeps fail-loud logic independent of plugin
internals.

On failure, mount a **separate minimal Vue app** with only `StorageErrorView` —
do not register Pinia or Router.

### 3.4 Store — `stores/hillChart.ts`

Add persist config to the existing store:

```ts
persist: {
  key: HILL_CHART_STORAGE_KEY,
},
```

Keep `state: (): HillChartState => structuredClone(sampleState)` as the fallback
when no saved state exists. No new actions.

### 3.5 Error page — `views/StorageErrorView.vue`

Full-viewport blocking page (warm palette, Fraunces heading, Inter body — match
existing tokens). Content:

- Heading: **Could not load saved data**
- The storage key in monospace: `hill-chart-state`
- The error message in a `<pre>` (parse error or structural failure detail)
- One line of neutral copy: data is stored locally in the browser; clearing the
  key in DevTools and reloading will start fresh.

**No** "Clear data" or "Reset" button. User fixes it themselves.

---

## 4. Data flow

### 4.1 First visit

1. `localStorage` has no `hill-chart-state`.
2. Pre-flight returns early; app mounts.
3. Store initializes from `structuredClone(sampleState)`.
4. First `setPosition` (or any state mutation) triggers plugin write.

Until the user interacts, refresh still re-seeds from sample — correct.

### 4.2 Return visit

1. Pre-flight parses and validates stored JSON.
2. App mounts; plugin hydrates store from the same key.
3. Views read hydrated positions.

### 4.3 Drag → persist

Unchanged interaction path: `HillChart` → `@move` → `setPosition` → plugin
persists full store state automatically.

### 4.4 Invalid storage

1. Pre-flight `parseStoredState` throws.
2. Only `StorageErrorView` mounts.
3. Pinia never initializes; no partial/corrupt state in memory.

---

## 5. Testing

Add Vitest unit tests for `parseStoredState` (and `readStoredStateRaw` if it
wraps `localStorage` — mock `localStorage` or test parse in isolation):

| Case | Expect |
|------|--------|
| Valid minimal object `{ version: 1, projects: [] }` | Returns parsed state |
| Valid sample-shaped JSON | Returns parsed state |
| Malformed JSON (`{broken`) | Throws with JSON detail |
| Missing `version` | Throws naming the field |
| `version` not a number | Throws |
| Missing `projects` | Throws |
| `projects` not an array | Throws |

Existing `hillChart.test.ts` stays unchanged — tests use plain `createPinia()`
without the persist plugin; seed-from-sample behavior is preserved in tests.

Manual smoke (not automated this iteration):

1. Fresh profile → sample data visible.
2. Drag dot → refresh → position kept.
3. Paste garbage into `hill-chart-state` in DevTools → reload → error page with
   detail; app does not render.

`npm run build` and `npm test` must pass.

---

## 6. Likely touch

| File | Change |
|------|--------|
| `package.json` | Add `pinia-plugin-persistedstate` |
| `src/main.ts` | Pre-flight + conditional boot |
| `src/stores/hillChart.ts` | `persist` option, import storage key |
| `src/storage/loadState.ts` | **New** — parse + validate |
| `src/storage/loadState.test.ts` | **New** — unit tests |
| `src/views/StorageErrorView.vue` | **New** — blocking error UI |

No changes to views, `HillChart`, or interaction code beyond bootstrap.

---

## 7. Out of scope this iteration

- Import / export / Clean (iterations 12–13)
- Full schema validation (`schema/validate.ts`, iteration 12)
- Schema version migration
- Toast / banner error UX (iteration 4+ chrome)
- In-app "reset storage" control
- Persist plugin configuration beyond default `localStorage` serializer
- Overview header stubs (iteration 4)

---

## 8. Delivery

- Work on branch `feature/iteration-3-persist-state` (legacy name without
  prefix: `iteration-3-persist-state`).
- Commits authored as Roman only — no Co-Authored-By / Claude mentions.
- No PR opened by the agent unless the user asks.
- Done when: drag survives refresh, invalid `localStorage` shows blocking error
  page, `npm run build` and `npm test` pass.

---

## Spec self-review (2026-06-02)

- No TBD placeholders.
- Fail-loud + self-service recovery aligns with user decision (no silent fallback).
- Minimal validation (`version` + `projects` array) scoped; full validate deferred to iteration 12.
- Pre-flight (approach A) independent of plugin error-handling quirks.
- Double-parse on happy path documented and accepted.
