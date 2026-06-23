# GitHub Issues

## Transport

| Priority | Method |
|----------|--------|
| 1 | GitHub MCP |
| 2 | `gh issue list/view` |
| 3 | GitHub REST API |
| 4 | Paste issue list |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Repo + label/milestone | `gh issue list --repo owner/repo --label foo` |
| Issue numbers | `gh issue view 123 --json ...` per id |
| No natural parent | **Ask** partition: milestone → project, or single project |

GitHub is often flat. Use `scope-negotiation.md` for grouping.

## Mapping

| GitHub | werkwink |
|--------|----------|
| Milestone | `Project` (common default) |
| Issue | `Task` |
| Parent issue (if sub-issues enabled) | `Project` or `Task` per user scope |

## Source

```json
{
  "system": "github",
  "id": "owner/repo#123",
  "url": "https://github.com/owner/repo/issues/123"
}
```

## Assignee

`assignees[0].login` or display name → Owner (first assignee only in v1).
