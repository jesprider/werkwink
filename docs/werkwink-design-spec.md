# Hill Chart — Design Spec (v1)

A team manager's tool for running the daily standup using Basecamp-style hill charts, with a focus on the uphill (uncertainty) phase and the forces acting on each piece of work.

---

## 1. Purpose & ritual

A single user — **the manager** — drives the app live during the daily. The team talks through their work; the manager drags dots and captures blockers/helpers in real time. The chart is screen-shared. No team-member editing, no auth, no sync.

End of standup: one **"End daily"** click commits today's positions as a snapshot. Tomorrow's chart shows yesterday's trail behind each dot.

---

## 2. Conceptual model

**Hill.** A symmetric curve. X-axis ranges 0–100 left to right; peak at 50. Uphill is uncertainty (figuring it out); downhill is execution (the work you still have, but you know how to do it).

**Dots.** Two kinds, identical in shape but different size:

- **Project dot** — one per project. Appears on both the overview (all projects together) and inside its own project view (larger, alongside its tasks).
- **Task dot** — children of a project. Appear only in the project view.

Project and task dots are positioned **independently and manually**. No automatic aggregation: a project can be near the peak even if some tasks are still at the start, and vice versa.

**Forces.** Attached to any dot. Two directions:

- **Up forces** — the assignee (always present, can't be resolved), plus optional helpers/alternative approaches.
- **Down forces** — blockers, obstacles, dependencies.

Forces are **context for the conversation**, not physics. They don't move the dot — the manager drags. But they make imbalance visible at a glance.

**Peak transition.** The peak is at position 50. A dot cannot move **past** the
peak (into the downhill, position > 50) while it has **active down forces** —
drag and slider clamp at 50 until blockers are resolved. Adding or re-opening a
down force while already downhill snaps the dot back to **45** (just before the
peak). No new down forces are blocked outright; the chart reflects renewed
uncertainty instead.

**Done.** Position 100 = done. Done items leave the curve (no archival). When no dot is selected, they appear in a **done panel** in the reserved right column — a card list with dot + name rows. Click a row to open the side panel; hover **↩ Restore** to return the dot to the peak (50).

**Staleness.** Dots that have not moved recently show small **staleness satellites** — red circles on the upper arc of the main marker. One satellite per day without movement from day 2, max 4; the main dot keeps its project color. See §5.8.

### Terms in code

In conversation and UI we say **dot** (project dot, task dot). In the codebase:

- **Project** and **Task** are domain entities (`schema/types.ts`); both implement **HillTrackable** (position, forces, snapshots).
- **Chart marker** is what you see on the SVG — a presentation projection (`ChartMarker`), not a third entity.
- **Resolve** is reserved for forces (`resolveForce`). Use **lookup** / **find** for locating a project or task by id.

Full glossary: [`docs/domain-vocabulary.md`](domain-vocabulary.md).

---

## 3. Data model

### JSON schema (nested)

```json
{
  "version": 1,
  "exportedAt": "2026-05-21T10:00:00Z",
  "projects": [
    {
      "id": "proj_abc",
      "name": "Q3 Mobile Redesign",
      "color": "terracotta",
      "source": {
        "system": "jira",
        "id": "MOB-101",
        "url": "https://your-org.atlassian.net/browse/MOB-101"
      },
      "position": 23,
      "lastMovedAt": "2026-05-19T10:00:00Z",
      "forces": [
        {
          "id": "f_001",
          "direction": "up",
          "label": "Owner",
          "owner": "Alex",
          "isPrimary": true,
          "status": "active",
          "createdAt": "2026-05-01T10:00:00Z",
          "resolvedAt": null,
          "resolutionReason": null
        },
        {
          "id": "f_002",
          "direction": "down",
          "label": "Waiting on Q2 budget approval",
          "owner": null,
          "isPrimary": false,
          "status": "active",
          "createdAt": "2026-05-15T10:00:00Z",
          "resolvedAt": null,
          "resolutionReason": null
        }
      ],
      "snapshots": [
        { "date": "2026-05-20", "position": 18 },
        { "date": "2026-05-19", "position": 18 }
      ],
      "tasks": [
        {
          "id": "task_xyz",
          "name": "Wire up new auth flow",
          "source": { "system": "jira", "id": "MOB-205", "url": "https://your-org.atlassian.net/browse/MOB-205" },
          "position": 12,
          "lastMovedAt": "2026-05-20T10:00:00Z",
          "forces": [ /* same shape */ ],
          "snapshots": [ /* same shape */ ]
        }
      ]
    }
  ]
}
```

### Field semantics

- `position` — integer 0–100.
- `color` — one of 8 named warm tones (terracotta, mustard, olive, rust, plum, sage, dusty-blue, warm-pink). Auto-assigned at creation, round-robin from the palette.
- `lastMovedAt` — set on every position change. Powers staleness satellites and the side-panel “days without movement” note.
- `source` — **optional** object describing where this dot came from in an external project-management tool. All sub-fields optional:
  - `source.system` — free-text identifier of the tracker (e.g. `"jira"`, `"linear"`, `"asana"`, `"github"`, `"monday"`, `"clickup"`, `"trello"`). Used to render an appropriate icon next to the link if known, otherwise falls back to a generic link icon.
  - `source.id` — the item's human-readable identifier in that system (e.g. `"MOB-101"`, `"ENG-205"`, `"owner/repo#42"`).
  - `source.url` — direct link to the item; opens in a new tab from the side panel.
  - Items with no `source` are "internal only" — created manually in the app, no external link.
- `force.isPrimary` — exactly one per dot, the assignee. Cannot be resolved (UI hides the resolve button).
- `force.status` — `"active"` or `"resolved"`. Resolved forces stay in the array; UI renders them in the "Past" sections.
- `snapshots` — at most one entry per calendar date; "End daily" replaces today's if it exists. Skipped days simply have no entry (gaps in the trail are fine).

---

## 4. Views

### 4.1 Landing page (`/`)

A static, content-only page explaining what the app is. No chart, no data, no state. Purpose: someone (you, a teammate, a future-you) opens the app cold and immediately understands the concept and the ritual.

Suggested contents, top to bottom:

- **Hero** — short tagline ("Run your daily on a hill") and one sentence: "A manager's view of where each project sits on the uncertainty curve, and what's pushing it back."
- **The hill** — the original Basecamp illustration (or a clean Vue/SVG recreation) showing uphill = figuring it out, downhill = execution.
- **Forces** — a small explainer: each dot has up forces (the assignee, helpers, alternative approaches) and down forces (blockers, obstacles). The goal during the daily is to keep up > down on the uphill.
- **The daily ritual** — three short steps: open the app → walk through projects with the team, drag dots and capture blockers → click "End daily" to commit today's snapshot.
- **Primary CTA** — a single button: **"Try it live →"** linking to `/projects`.
- **Secondary CTA** — *deferred*; Import JSON remains on the overview empty state and header (not on the landing page in v1).

Visual style matches the rest of the app: cream background, Fraunces headings, Inter body, generous whitespace, the warm palette. No nav chrome on this page beyond the app name in the header.

### 4.2 Projects overview (`/projects`)

Single full-screen hill chart with **all project dots**. Each project dot:

- Carries its project color and an always-visible name label (labels stack with leader lines on overlap).
- Shows a tiny badge: `↑3 ↓2` — counts of active up and down forces.
- **Draggable directly on the overview** (writes to the project's position).
- Clickable to either drill into the project view, or open the side panel — TBD interaction (see §5.2).

Done projects collapse into the stacked column at bottom-right.

**Header controls:** app name (links back to `/`), Import / Export / Clean buttons, "+ Project" button, "End daily" button.

**Empty state:** prominent CTAs for "Import JSON" and "+ Add your first project." A subtle link back to the landing page ("New here? Read what this app is →").

### 4.3 Project view (`/projects/:id`)

Single full-screen hill chart with **one big project dot + smaller task dots**, all in the project's color (slightly varied stroke/size to distinguish). Project name in header with a back-arrow to `/projects`.

- Both the project dot and task dots are draggable.
- Each carries name label and `↑/↓` badges.
- "+ Task" button in the header.

### 4.4 Side panel

Opens to the right when you click a dot. Component state (not in the URL). Sections, top to bottom:

1. **Header** — dot name (inline editable), type badge (Project / Task), external link (if `source.url` is set, opens in a new tab; an icon hints at the system when `source.system` is recognised).
2. **Position** — fine-grained slider 0–100, plus "At the peak" indicator when applicable. Editing the slider mirrors dragging on the chart.
3. **Notes** — while the daily is open (`canEndDaily`), a short textarea for today's standup update on this dot. Hidden after End daily. Non-empty drafts commit to `notes` history on End daily (not shown in the panel).
4. **Active up forces** — chip per force: label + optional owner. Primary force has a small "primary" mark and no resolve button. `+ Up force` button at end.
5. **Active down forces** — same shape. `+ Down force` button.
6. **Past boosters** — collapsible, resolved up forces, most recent first.
7. **Past blockers** — collapsible, resolved down forces, most recent first.
8. **Delete** — trash icon at the bottom-right of the panel; confirm before removing project or task.

### 4.5 Force add UX

Clicking `+ Up force` or `+ Down force` reveals an **inline form** (label input, owner input). Enter saves; Esc cancels.

---

## 5. Interactions

### 5.1 Dragging dots

- Constrained to the curve: you drag horizontally, dot snaps to the curve's y at that x.
- Position resolves to integer 0–100.
- Drag updates `position` and `lastMovedAt`.

### 5.2 Click on a dot

- **In the project view:** click a dot → opens the side panel for that dot.
- **In the projects overview:** TBD between (a) single-click opens side panel + double-click drills into project view, or (b) single-click drills + a side affordance opens the panel. Will be settled in implementation; default proposal: single-click opens side panel, dedicated "Open project →" button in the panel drills in. (See open questions.)

### 5.3 End daily

A header button. On click:

- Captures every dot's current `position` as a snapshot stamped with today's date.
- If today already has a snapshot for this dot, it's replaced.
- No confirmation dialog; no summary modal in v1.

### 5.4 Import / Export / Clean

- **Import** — only available when state is empty. Drag-drop a `.json` file or open a file picker. Validates against schema; reports errors. Loads into the store.
- **Export** — downloads the current state as `hill-chart.json` (timestamp in filename).
- **Clean** — wipes the store with a confirm dialog ("This will delete all projects, tasks, and history. Export first?"). Re-enables Import.

The workflow for "I want to add more from my tracker after first import": Export → take JSON to the skill → skill edits → Clean → Import.

### 5.5 Manual creation

- **+ Project (overview)** — modal: project name, optional external URL (paste a link from your tracker; the app infers `source.system` and `source.id` from the URL where it can, e.g. Jira/Linear/GitHub URL patterns). Submit creates a project with a round-robin color, position = 0, and a primary up force labeled "Owner" with empty owner field.
- **+ Task (project view)** — same shape: name, optional external URL.

### 5.6 Editing

- Name is inline-editable in the side panel header.
- External link is editable in the same header.
- Forces are editable in place (label and owner).
- Resolving a force = clicking a small ✓ button on the chip; moves it to past section with `resolvedAt` set.
- Un-resolving = clicking the chip in the past section (un-resolves back to active).

### 5.7 Trail rendering

- Last **10 snapshots** rendered behind the current dot.
- Oldest at ~10% opacity, newest (still historical) at ~70%, current dot at 100%.
- Older snapshots remain in storage (export / history) but are not rendered in the side panel.

### 5.8 Staleness satellites

Dots that have not moved recently show small **staleness satellites** — red circles on the upper arc of the main marker (`#C04A2D`). The main dot keeps its project color.

- `daysSinceLastMove = (today − lastMovedAt) in local calendar days`
- **Grace day:** moved yesterday → 0 satellites (no alarm yet)
- **From day 2:** one satellite per day without movement, left to right along the upper arc, **max 4**
- **Done dots** (`position === 100`): no satellites, no panel note
- **Side panel:** when `daysSinceLastMove ≥ 1`, show “N day(s) without movement” in the Position section
- Ghost trails keep project palette color; satellites apply to the live dot only
- Recompute on marker rebuild (store change, navigation, refresh); no midnight timer

---

## 6. Visual design

**Palette (Tailwind tokens):**

- `bg-cream` `#FDFAF4` — page background.
- `hill-sand` `#E8D9BD` — hill curve fill/stroke.
- `text-warm` `#3C3530` — primary text.
- Project palette (8): `terracotta` `#C56B4A`, `mustard` `#D9A441`, `olive` `#7A8A4F`, `rust` `#A8472B`, `plum` `#7C4A6A`, `sage` `#8DA77A`, `dusty-blue` `#6D8AA0`, `warm-pink` `#D49584`.
- `force-up` `#8DA77A` (sage), `force-down` `#C04A2D` (clay red), `force-past` `#A39B92` (muted warm grey).
- `stale-red` `#C04A2D` — staleness satellite fill color.

**Typography:**

- Headings: **Fraunces** (Google Fonts) — friendly, warm serif.
- Body / UI: **Inter** (Google Fonts).
- Mono (for tracker IDs, etc.): default system mono.

**General principles:** generous whitespace, no hard borders, soft shadows. Buttons are pill-shaped with warm fills, not flat outlines. Side panel uses a subtle off-white card.

---

## 7. Tech stack

- **Framework:** Vue 3 (Composition API + `<script setup>`).
- **Build:** Vite.
- **Store:** Pinia, with `pinia-plugin-persistedstate` syncing to `localStorage` under a single key (`werkwink-state`).
- **Router:** Vue Router with three routes: `/` (landing page), `/projects` (overview), and `/projects/:id` (project detail).
- **Styling:** Tailwind CSS v4 with the warm palette as design tokens declared via the `@theme` block in `src/styles/main.css` (no `tailwind.config.ts` in v4).
- **Chart rendering:** SVG (native drag, crisp at any zoom). No charting library needed.
- **Language:** TypeScript (recommended — schema types are core to the design).
- **Linting:** ESLint + Prettier (standard Vue+TS setup).

Suggested directory shape:

```
src/
  main.ts
  App.vue
  router.ts
  stores/
    hillChart.ts       (Pinia store; the JSON schema is the state)
  views/
    LandingView.vue
    OverviewView.vue
    ProjectView.vue
  components/
    HillChart.vue      (the SVG curve + chart markers)
    ChartMarker.vue    (single marker with badges + drag)
    SidePanel.vue
    ForceChip.vue
    ForceAddForm.vue
    ImportButton.vue
    EndDailyButton.vue
    DonePanel.vue
  composables/
    useDrag.ts
    useStaleness.ts
  schema/
    types.ts           (Project, Task, HillTrackable, Force, Snapshot interfaces)
    validate.ts        (JSON import validation)
  styles/
    fonts.css
```

---

## 8. Deployment & hosting

The app is a static SPA — no backend, no server-side rendering — so hosting is just static files plus an SPA route fallback.

### 8.1 Platform: Cloudflare Pages

Hosted on **Cloudflare Pages**. Chosen for unlimited bandwidth on the free tier (no surprise overage if the link gets shared widely), a fast global edge network, native GitHub auto-deploy, and trivial SPA fallback config. No vendor-specific code in the app — switching to Vercel / Netlify / GitHub Pages later is a config change, not a rewrite.

### 8.2 Build configuration

Standard Vite defaults, set in the Cloudflare Pages project settings on first connection:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm ci` (uses the lockfile, deterministic)
- **Node version:** 24 LTS (pin via `package.json` engines field and/or a `.nvmrc`)

No `wrangler.toml` is needed for a plain static SPA.

### 8.3 SPA fallback

Vue Router uses HTML5 history mode (clean URLs like `/projects/abc`). Without a rewrite rule, a direct visit to `/projects/abc` would 404 because no file exists at that path. The fix is a one-line `_redirects` file committed to `public/` (Vite copies it verbatim into `dist/`):

```
/*    /index.html   200
```

Every unmatched request is served `index.html` with a 200 status, and Vue Router takes over client-side. The same file format works on Netlify if you ever migrate.

### 8.4 Repository & auto-deploy

- Push the project to a **public GitHub repo** (so visitors with the deploy URL can also read the source if curious).
- In Cloudflare Pages: "Create a project" → connect GitHub → select the repo → confirm the build settings above.
- Default behavior: pushes to `main` trigger production deploys to `<project>.pages.dev`. Pushes to other branches create **preview deploys** with their own unique URLs — useful for showing teammates a work-in-progress version without affecting production.
- Rollback by clicking any previous deploy in the Pages dashboard.

### 8.5 URL & sharing

- Default URL: `https://<project>.pages.dev` — pick a short, memorable project slug (e.g. `hill-chart`).
- **Custom domain** (optional, later): point a subdomain like `hill.your-domain.com` via a CNAME record. Free on the Pages plan, no upgrade required.

### 8.6 Analytics & security (optional, deferred)

- **Cloudflare Web Analytics** — privacy-respecting, no cookies, free. Enable in the project dashboard if you want to know how often the link is opened. Not in v1.
- **Security headers** — add a `public/_headers` file with sensible defaults (CSP, X-Frame-Options, Referrer-Policy) when getting closer to wider sharing. Not needed for the early-share phase.

### 8.7 Privacy boundary (important for the landing page)

A reminder worth surfacing on the landing page itself: **all data is local to the visitor's own browser** via localStorage. There is no shared backend. Two people opening the same URL see different (empty) charts; the manager's chart only exists on the manager's machine. Exporting JSON is the only way to move data between browsers or share it with someone else.

---

## 9. Tracker import skill

A separate Claude skill that reads from your project-management tool of choice and produces the hill-chart JSON. **The app itself is tracker-agnostic**; the skill is the only boundary where tracker-specific knowledge lives. Adding support for a new tracker is a skill change, not an app change.

### 9.1 Supported trackers

Any tool with an MCP server, an official CLI, or a documented API the skill can reach. Common examples: Jira, Linear, Asana, GitHub Issues, Monday, ClickUp, Trello, Notion databases, Basecamp itself. The list is open-ended — if a connector exists, the skill can use it.

### 9.2 Input

The user can give the skill any of:

- A native query in the tracker's own language (JQL for Jira, Linear's filter syntax, GitHub's `is:issue is:open label:foo`, an Asana project URL, etc.)
- A list of item identifiers (e.g. `MOB-101, WEB-42` for Jira; `ENG-205` for Linear; `owner/repo#123` for GitHub Issues)
- Free-form natural language ("the initiatives I own that are in progress")
- **Optionally**, the user's current exported `hill-chart.json` — when present, the skill **merges new items into it** (preserving existing positions, forces, snapshots) rather than producing a fresh file. New items get `position: 0` and a primary up force derived from the tracker's assignee.

### 9.3 Tracker access

Skill probes for available transports in this order at runtime:

1. **MCP server** for the tracker (Atlassian MCP, Linear MCP, GitHub MCP, Asana MCP, etc.)
2. **Official CLI** (`jira`, `linear`, `gh`, `asana-cli`, etc.)
3. **REST API** with credentials the user provides ad hoc
4. **Manual paste fallback** — asks the user to paste exported data from the tracker UI

The skill announces which transport it picked so the user can troubleshoot connectivity issues.

### 9.4 Mapping

A uniform two-level mapping, regardless of tracker:

- **Parent unit → app Project.** Whatever the tracker calls a container of work (epic, initiative, milestone, project, objective, sprint goal, list). `name` = parent's title; `source.system` = the tracker name; `source.id` = parent's tracker identifier; `source.url` = direct link.
- **Child unit → app Task.** Whatever the tracker calls an individual piece of work (story, task, issue, ticket, card). Same `source` shape with the child's identifier and URL.
- **Assignee → primary up force.** `label` = `"Owner"`; `owner` = assignee display name (or empty if unassigned); `isPrimary: true`.
- Initial `position: 0` for everything new. No forces beyond the assignee.

When a tracker doesn't have a natural two-level shape (e.g. flat Trello lists, ungrouped GitHub issues), the skill asks the user how to partition: "Treat each list as a project, with its cards as tasks?" or "Group these issues by milestone?"

### 9.5 Output

Skill writes `hill-chart.json` to the workspace folder and provides a `computer://` link. The app's Import button (drag-drop or file picker) accepts the file. The skill **never writes back** to the tracker — the data flow is strictly one-way, tracker → JSON → app.

### 9.6 Files (skill package)

```
hill-chart-skill/
  SKILL.md                          (description + invocation; tracker-agnostic)
  prompts/
    detect-tracker.md               (find a usable transport)
    fetch-by-query.md               (native-query path)
    fetch-by-ids.md                 (id-list path)
    fetch-from-natural-language.md
    merge-with-existing.md
  knowledge/
    trackers/
      jira.md                       (per-tracker notes: query syntax, MCP tool names, URL patterns)
      linear.md
      github-issues.md
      asana.md
      monday.md
      (extend as new trackers are added)
  schema/
    hill-chart.schema.json
```

Per-tracker knowledge files keep tracker-specific quirks out of the main prompts, so adding a new tracker is a single-file change (plus its entry in `detect-tracker.md`).

---

## 10. Out of scope for v1

- Multi-user editing, real-time sync, auth.
- Backend / server. Everything is browser-local.
- Mobile / responsive design (desktop-only assumption for the daily).
- Push integration with the tracker (read or write) — the app never talks to the tracker directly; all sync happens via the import skill.
- Slack / email notifications.
- A "presentation mode" with dedicated fullscreen styling.
- Bulk operations (resolve all forces on a project, archive a project, etc.).
- Public/shareable read-only URLs.
- Keyboard shortcuts (defer to v1.1).
- Undo/redo.

---

## 11. Open questions / deferred

1. **Overview click semantics** — on `/projects`, single-click opens side panel vs drills in. Default: side panel; "Open project" button inside the panel to drill in. Revisit during implementation.
2. **Force ordering** in the side panel — by `createdAt` desc, or by direction first then created? Default: by direction, then `createdAt` desc within each.
3. **Stacked done dots** — exact threshold for stacking vs showing individually (e.g. always stack when 3+, or always stack). Default: always stack when ≥1 done dots exist; max 4 inline names + "+ N more."
4. **Trail rendering style** — ghost dots only, dashed line, or both? Default: ghost dots only, no connecting line, to keep it calm.
5. **`lastMovedAt` accounting on import** — for items pre-existing in a merged import, do we touch `lastMovedAt`? Default: no, preserve existing.

---

## 12. Decisions ledger (interview record)

Captured during the design interview so future-you can see the reasoning:

1. Manager-only, live during daily.
2. Manual drag; forces are visible context (not physics).
3. No connection between project dot and its task dots — all independent.
4. Forces persist until resolved; resolved go to "Past blockers / Past boosters."
5. Assignee is a permanent up force per dot (`isPrimary`), can't be resolved.
6. Snapshot per daily, faint trail (last 10) on chart; older snapshots kept in storage only.
7. Project dots have their own forces (not just task forces).
8. Force schema = direction + label + optional owner + status (+ auto timestamps).
9. Stack: Vue 3 + Pinia + Vue Router + Tailwind + Vite.
10. Storage: `localStorage` via `pinia-plugin-persistedstate`.
11. No incremental import; lifecycle is Import → Export → (skill edits) → Clean → Import.
12. JSON schema is nested (tasks inside projects).
13. Crossing the peak blocked while active down forces remain; new/reopened downs on downhill snap to 45.
14. Done dots stay at 100; can be dragged back; stack into a column on the right.
15. Snapshot trigger = explicit "End daily" button.
16. Force display = `↑/↓` badge counts on the dot + side panel on click.
17. Overview project distinction = warm color + name label.
18. Tasks share the project color.
19. Creation: both JSON import AND manual add.
20. Skill input: flexible (JQL / keys / NL / + optional existing JSON).
21. Tracker mapping (uniform across all systems): parent unit (epic / initiative / milestone / etc.) → Project, child unit (story / task / issue / card / etc.) → Task, assignee → primary up force.
22. Visual: cream background, terracotta/olive palette, Fraunces + Inter.
23. Side panel sections: Header / Position / Active forces / Past; delete icon bottom-right.
24. Skill output: `.json` file in the workspace.
25. Routing: `/` (landing page), `/projects` (overview), `/projects/:id` (project detail); side panel is component state.
26. "End daily" replaces today's snapshot; skipped days are gaps.
27. Dots draggable on both overview and project view.
28. Assignee optional at manual creation; placeholder primary force is set automatically.
29. Trail length on chart = last 10; no side-panel history chart in v1.
30. Staleness satellites: one red dot per day without movement from day 2, max 4; panel shows days without movement; skipped at position 100.
31. Done items show in a right-column done panel; hover ↩ Restore returns to peak (50).
32. Display during daily = ordinary screen-share; no dedicated presentation mode in v1.
33. Hosted on Cloudflare Pages: public GitHub repo, auto-deploy on `main`, preview deploys per branch, SPA fallback via a `public/_redirects` file. Custom domain and analytics deferred.
34. App is **tracker-agnostic**. Each dot may carry an optional `source: { system, id, url }` referencing an external project-management tool. Tracker-specific logic lives only in the import skill (Jira, Linear, Asana, GitHub Issues, Monday, ClickUp, Trello, etc. all supported via per-tracker knowledge files). The app never talks to any tracker directly.
