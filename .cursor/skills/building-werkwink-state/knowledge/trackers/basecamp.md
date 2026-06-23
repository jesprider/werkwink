# Basecamp

## Transport

| Priority | Method |
|----------|--------|
| 1 | Basecamp MCP (if enabled) |
| 2 | Basecamp 3/4 REST API with OAuth token |
| 3 | Paste todolist / card table export |

No official CLI. API requires account id and project id from URL.

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Project + todos | Project URL → todo lists → todos |
| Card table | Column / card board — ask which lists/columns |
| Hill chart (BC feature) | Not werkwink — map todos/cards only |

**Ask user:** which todo lists or card columns? Include completed todos?

## Mapping

| Basecamp | werkwink |
|----------|----------|
| Project (container) | Rarely one werkwink project — usually split below |
| Todo list / Card column | `Project` |
| Todo / Card | `Task` |

Default: **each todo list (or card column) → Project**, items → Tasks.

## Source

```json
{
  "system": "basecamp",
  "id": "<todo_id>",
  "url": "https://3.basecamp.com/<account>/buckets/<project>/todos/<id>"
}
```

Card tables use card URL pattern; set `system` to `basecamp` either way.

## Assignee

Basecamp todos often lack assignee — Owner force with `owner: null`. Card assignees
→ map when API returns `assignees`.

## API Notes

`GET /buckets/{project_id}/todosets/{todoset_id}/todos.json`, card table
endpoints per Basecamp 3 API docs. Fetch account id from user URL when possible.
