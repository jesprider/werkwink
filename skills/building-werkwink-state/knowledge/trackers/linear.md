# Linear

## Transport

| Priority | Method |
|----------|--------|
| 1 | Linear MCP |
| 2 | `linear` CLI (`linear issue view`, `linear issue list`) |
| 3 | Linear GraphQL API with API key |
| 4 | Paste issue export |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Issue + children | `ENG-42` + issues where `parentId` = epic id |
| Project filter | Linear project → multiple issues; ask: one werkwink project per Linear project or group by epic? |
| Team filter | List issues; user selects or group by project/epic |

**Default for "epic X child issues":** direct children (`parent` relationship), all
statuses unless user says open only.

## Mapping

| Linear | werkwink |
|--------|----------|
| Project (container) | `Project` when user scopes at project level |
| Issue (epic/parent) | `Project` when user names one parent issue |
| Child issue | `Task` |
| Sub-issue (nested) | `Task` only if scope includes descendants |

## Source

```json
{
  "system": "linear",
  "id": "ENG-42",
  "url": "https://linear.app/<team>/issue/ENG-42"
}
```

Use `identifier` for `id`, `url` from Linear.

## Assignee

`assignee.name` or display name → Owner force.

## Example

See `fixtures/hill-chart-import-demo.json` in werkwink repo (`ENG-42`, `ENG-108`).
