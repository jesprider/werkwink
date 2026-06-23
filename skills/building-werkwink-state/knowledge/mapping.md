# Tracker → HillChartState Mapping

Uniform two-level mapping regardless of tracker vocabulary.

## Hierarchy

| werkwink | Tracker examples |
|----------|------------------|
| `Project` | Epic, initiative, milestone, Linear project, Trello list, GitHub milestone |
| `Task` | Story, issue, ticket, card, sub-issue |

## Project Fields

```ts
{
  id: string           // stable slug, e.g. proj_eng_42
  name: string         // tracker title
  color: ProjectColor  // round-robin from PALETTE_ORDER
  source?: {
    system: string     // "jira" | "linear" | "github" | "trello" | ...
    id: string         // MOB-101, ENG-42, etc.
    url: string        // direct browse link
  }
  position: 0          // new imports start at 0
  lastMovedAt: string  // ISO now for new items
  forces: [primaryOwnerForce]
  snapshots: []
  tasks: Task[]
}
```

## Task Fields

Same as `HillTrackable` without `color` / `tasks`. Include `source` when available.

## Primary Owner Force

One per project and task:

```ts
{
  id: string           // f_<unique>, e.g. f_eng_42_owner
  direction: 'up',
  label: 'Owner',
  owner: string | null // assignee display name; null if unassigned
  isPrimary: true,
  status: 'active',
  createdAt: string,   // ISO now for new
  resolvedAt: null,
  resolutionReason: null,
}
```

**Do not** import tracker blockers, labels, or links as forces in v1.

## ID Stability

Derive ids from tracker identifiers for merge-friendly re-runs:

- `proj_<normalized_id>` for projects
- `task_<normalized_id>` for tasks
- `f_<normalized_id>_owner` for owner forces

Normalize: lowercase, replace non-alphanumeric with `_`.

## Colors

Cycle `PALETTE_ORDER` from werkwink (`terracotta`, `mustard`, `olive`, `rust`,
`plum`, `sage`, `dusty-blue`, `warm-pink`) across new projects in file order.

## Root Document

```ts
{
  version: 1,
  exportedAt: string | null,  // ISO now when writing
  demo: false,                // omit ok; import forces false
  projects: Project[]
}
```

Preserve `exportedAt`, positions, forces, snapshots, and `notes` for items already in a
merge export — see `merge-with-existing.md`. A legacy `lastDailyDate` field may appear in
older exports; it is obsolete (removed in the Capture rework) and import ignores it, so
drop it when rewriting.
