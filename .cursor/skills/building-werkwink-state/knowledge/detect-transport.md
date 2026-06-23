# Detect Transport

Probe available connectors at runtime. **Do not ask** the user "MCP or CLI?" up
front — try and report.

## Probe Order

1. **MCP server** — list enabled MCP servers; read tool schemas before calling
2. **Official CLI** — `jira`, `linear`, `gh`, `asana`, etc. (`which <cmd>`)
3. **REST API** — only if user provides token/URL in session
4. **Manual paste** — user exports CSV/JSON from tracker UI

## MCP

- Always read tool descriptor JSON before `CallMcpTool`
- On auth error: `mcp_auth` once for that server, retry, then fall through
- Common servers: Atlassian (Jira), Linear, GitHub, Asana

## CLI Examples

```bash
which linear jira gh
linear issue view ENG-42 --json
gh issue list --repo owner/repo --json
```

## Announce Result

Tell the user which transport worked:

> Pulled via Linear MCP (issue + children endpoints).

Or:

> Linear MCP unavailable; used `linear` CLI. If wrong, check `linear auth status`.

## Pagination

For large result sets, paginate until scope is satisfied or user cap is hit. Mention
truncation in summary ("showing 50 of 120 — narrow filter or select IDs?").
