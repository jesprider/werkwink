# GitLab Issues

## Transport

| Priority | Method |
|----------|--------|
| 1 | GitLab MCP (if enabled) |
| 2 | `glab` CLI (`glab issue list`, `glab issue view`) |
| 3 | GitLab REST API with token |
| 4 | Paste issue export |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Project + label/milestone | `project_id` + `milestone` or `labels` |
| Epic (Premium/Ultimate) | Epic → child issues via epic API |
| Issue list | Fetch by IID list |

**Ask user:** GitLab epics available? If not, group by milestone or label. Include
closed issues?

## Mapping

| GitLab | werkwink |
|--------|----------|
| Epic | `Project` |
| Milestone | `Project` when no epics |
| Issue | `Task` |
| Task (incident type) | `Task` |

Same flat-board rules as GitHub — see `scope-negotiation.md` when no parent exists.

## Source

```json
{
  "system": "gitlab",
  "id": "group/project#123",
  "url": "https://gitlab.com/<namespace>/<project>/-/issues/123"
}
```

Self-hosted: use instance hostname in `url`; `system` stays `gitlab`.

## Assignee

`assignees[0].name` or username → Owner.

## CLI Notes

`glab issue list -R namespace/project --milestone "v1" --json iid,title,webUrl,assignees`
