# Monday.com

## Transport

| Priority | Method |
|----------|--------|
| 1 | Monday MCP (if enabled) |
| 2 | Monday GraphQL API with API token |
| 3 | Paste board export |

No widely used official CLI — API or MCP preferred.

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Board + items | Board ID or URL → all items (rows) |
| Group / section | Filter by group name — ask which groups |
| Workspace filter | List boards; user picks |

**Ask user:** Monday "subitems" included? Default: parent items only; subitems →
`Task` only when user includes substasks in scope.

## Mapping

| Monday | werkwink |
|--------|----------|
| Board | `Project` when user scopes whole board as one stream |
| Group | `Project` when user wants one werkwink project per group (common) |
| Item (row) | `Task` when board → single project; or `Task` under group-project |
| Subitem | `Task` only if scope includes subitems |

Default for "board X": **each group → Project, items in group → Tasks**. Confirm
if board has no groups (flat items → single project).

## Source

```json
{
  "system": "monday",
  "id": "<item_id>",
  "url": "https://<account>.monday.com/boards/<board_id>/pulses/<item_id>"
}
```

## Assignee

`column_values` for people column, or `assignee` field → first person as Owner.

## API Notes

GraphQL: `boards`, `items_page_by_column_values`, `subitems`. Request `id`, `name`,
`url`, assignee columns explicitly.
