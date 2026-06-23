# Merge with Existing Export

When the user supplies `hill-chart.json` (or exported state), **merge** new tracker
items instead of replacing everything.

## Match Key

Match existing trackables by `source.system` + `source.id` when both present. Fall
back to exact `name` match only if no source (discourage).

## For Matched Items

**Preserve:** `position`, `lastMovedAt`, `forces`, `snapshots`, `notes`, `id`, `color`
(projects). Drop any legacy root `lastDailyDate` (obsolete since the Capture rework).

**Update optionally:** `name` if changed in tracker (ask if user wants title sync).

## For New Items

- `position: 0`
- `lastMovedAt`: now (ISO)
- `snapshots: []`
- `notes: []`
- Primary Owner force from current tracker assignee
- New `id` if no match
- Next `PALETTE_ORDER` color for new projects

## Unmatched in Export

Items in export but not in tracker fetch: **keep** unless user asks to prune.

## Output

Write merged full `HillChartState` — same validation as fresh build. User flow when
chart already has real data:

1. Export from werkwink
2. Run skill with export + tracker scope
3. Clean chart in app
4. Import merged file

Import is disabled when `demo: false` and `projects.length > 0` without Clean.
