# Asana

## Transport

| Priority | Method |
|----------|--------|
| 1 | Asana MCP |
| 2 | `asana` CLI if installed |
| 3 | REST `https://app.asana.com/api/1.0/...` with personal access token |
| 4 | Paste task list / CSV export |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Project + tasks | Project GID or URL → tasks in project |
| Section within project | Filter by section (e.g. "In progress") — ask which sections |
| Portfolio / goal | Ask: treat goal as project, linked projects as tasks, or expand each project? |

**Ask user:** subtasks included? completed tasks? Asana subtasks nest under a parent
task — default direct children only unless user wants full subtree.

## Mapping

| Asana | werkwink |
|-------|----------|
| Project | `Project` |
| Section (optional grouping) | Usually filter only; not a separate werkwink level |
| Task | `Task` |
| Subtask | `Task` only if scope includes substasks |

When user names one parent task as the container, that task → `Project`; its
subtasks → `Task`.

## Source

```json
{
  "system": "asana",
  "id": "<task_gid>",
  "url": "https://app.asana.com/0/<project_gid>/<task_gid>"
}
```

Use human-readable name in summary; `id` should be stable GID or permalink id.

## Assignee

`assignee.name` → Owner force. Null if unassigned.

## MCP Notes

Read Asana MCP schemas for: get task, list tasks in project, list subtasks. Common
params: `project_gid`, `section_gid`, `opt_fields` for assignee and permalink.
