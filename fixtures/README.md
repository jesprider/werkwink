# Hill chart fixtures

## `hill-chart-import-demo.json`

Comprehensive **tracker-import** shaped JSON for manual testing of **Import** on `/projects`.

This file mirrors the built-in `src/data/sample.ts` seed: **the same ten scenarios,
positions, forces, and tasks**. The only differences are that this file uses static
ISO/calendar dates (so it can live as a checked-in `.json`) and its own `proj_demo_*`
ids, so you can tell an imported chart apart from the demo seed.

**Layout** — projects are evenly spread across the hill (positions `0, 12, 18, 32, 50,
64, 76, 88, 99, 100`).

**Showcases**

| Feature | Where in file |
|---------|----------------|
| External sources (Jira, GitLab, GitHub, Linear, Trello, ClickUp, Asana, Monday) | One per project |
| Unknown tracker (generic link icon) | `proj_demo_generic` |
| No source (internal only) | `proj_demo_internal` |
| Active up/down forces + resolved past forces | `proj_demo_uphill`, `proj_demo_downhill` |
| Peak at 50 with active blockers | `proj_demo_peak` |
| Downhill with no active blockers | `proj_demo_downhill` |
| Project clamped at 99 by an open task | `proj_demo_clamped` |
| Done dot at 100 (satellites suppressed) | `proj_demo_done` |
| Tasks under projects | `proj_demo_uphill`, `proj_demo_clamped`, `proj_demo_done` |
| Snapshot history / ghost trails | Most projects (select a dot after import) |
| Notes history (export-only) | `proj_demo_downhill` |
| Staleness satellites (1 / 2 / 4) | `proj_demo_backlog` (1), `proj_demo_internal` (2), `proj_demo_blocked` (4) |

**Staleness** is intentionally limited to **three** dots so the overview stays clean:
backlog (2 days → 1 satellite), internal item (3 days → 2 satellites), and the blocked
item (5+ days → 4 = max). Every other dot moved today or yesterday.

**How to use**

1. Open the app with demo sample data (fresh profile or **Clean** then reload).
2. Click **Import** (or drag this file onto the overview).
3. Confirm replacing demo data when prompted.
4. Explore overview and project views — click dots for the side panel, select dots for trails.

The file is validated in CI via `src/schema/validate.test.ts`.

**Note:** `lastMovedAt` and snapshot dates are static (anchored around the
`exportedAt` date). Staleness satellites shift as real calendar time passes, so the
"three stale dots" picture is exact only near that date — re-anchor the dates if you
need a pristine import demo later. The built-in `sample.ts` seed uses relative dates
and always shows exactly those three stale dots on first load.
