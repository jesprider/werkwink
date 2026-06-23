# ClickUp

## Transport

| Priority | Method |
|----------|--------|
| 1 | ClickUp MCP (if enabled) |
| 2 | ClickUp REST API v2 with personal token |
| 3 | Paste export |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| List / folder | Space → folder → list hierarchy; user names list or folder |
| Space | Ask: one project per list, or folder as project? |
| Filter by status | Open / custom status — confirm with user |

ClickUp hierarchy: **Space → Folder → List → Task → Subtask**. Negotiate which
level becomes werkwink `Project`.

## Mapping

| ClickUp | werkwink |
|---------|----------|
| List | `Project` (default when user names a list) |
| Folder | `Project` when user scopes at folder level |
| Task | `Task` |
| Subtask | `Task` only if scope includes substasks |

Default for "list X": list → one `Project`, tasks in list → `Task`.

## Source

```json
{
  "system": "clickup",
  "id": "<task_id>",
  "url": "https://app.clickup.com/t/<task_id>"
}
```

Custom task id (e.g. `DEV-42`) may appear in `custom_id` — prefer for `source.id`
when present.

## Assignee

`assignees[0].username` or display name → Owner (first assignee in v1).

## API Notes

`GET /list/{list_id}/task`, `GET /task/{task_id}`, `include_subtasks=true` only
when user scope includes substasks.
