# Tracker Index

Load the matching file when the user names a tracker or URL pattern implies one.

| Tracker | File | URL hints |
|---------|------|-----------|
| Jira | `jira.md` | `*.atlassian.net/browse/` |
| Linear | `linear.md` | `linear.app/*/issue/` |
| GitHub Issues | `github-issues.md` | `github.com/*/issues/` |
| GitLab Issues | `gitlab.md` | `gitlab.com/*/issues/` |
| Azure DevOps | `azure-devops.md` | `dev.azure.com/*/workitems/` |
| Asana | `asana.md` | `app.asana.com/0/` |
| Monday.com | `monday.md` | `*.monday.com/boards/` |
| ClickUp | `clickup.md` | `app.clickup.com/t/` |
| Trello | `trello.md` | `trello.com/c/` |
| Notion | `notion.md` | `notion.so/`, database URLs |
| Basecamp | `basecamp.md` | `3.basecamp.com/` |

**Add new trackers:** copy any file above; update this table. Probe MCP/CLI first;
document tool names in that file after first successful run.

**Unknown tracker:** Run `detect-transport.md`; if MCP exists, read its schemas and
draft mapping using `mapping.md` two-level rule; ask user to confirm parent/child
vocabulary for that tool.
