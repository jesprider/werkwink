# Jira

## Transport

| Priority | Method |
|----------|--------|
| 1 | Atlassian MCP (Jira tools) |
| 2 | `jira` CLI if installed |
| 3 | REST `https://<site>.atlassian.net/rest/api/3/...` with user token |
| 4 | Paste issue JSON / Jira export |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Epic + children | Issue `MOB-101` + JQL `parent = MOB-101` or epic link field |
| JQL filter | Run JQL; group by epic/parent for project/task mapping |
| Issue list | Fetch each key; infer parent from epic link or parent field |

**Ask user:** epic link vs sub-task parent vs "issues in epic" field — Jira config
varies. Default: `parent` for sub-tasks, `"Epic Link"` / `parentEpic` for stories
under epic.

## Mapping

| Jira | werkwink |
|------|----------|
| Epic | `Project` |
| Story / Task / Bug (child of epic) | `Task` |
| Sub-task | `Task` only if user includes substasks in scope |

## Source

```json
{
  "system": "jira",
  "id": "MOB-101",
  "url": "https://<site>.atlassian.net/browse/MOB-101"
}
```

## Assignee

`fields.assignee.displayName` → Owner force `owner`. Null if unassigned.

## MCP Notes

Read Atlassian MCP tool schemas for: get issue, search JQL, list children. Tool
names vary by MCP package version.
