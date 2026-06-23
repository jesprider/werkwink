# Azure DevOps (ADO)

## Transport

| Priority | Method |
|----------|--------|
| 1 | Azure DevOps MCP (if enabled) |
| 2 | `az boards` CLI (Azure CLI extension) |
| 3 | REST `https://dev.azure.com/{org}/{project}/_apis/wit/...` with PAT |
| 4 | Paste query results |

## Scope Queries

| User intent | Fetch approach |
|-------------|----------------|
| Epic + children | WIQL: `System.Parent = {epicId}` or epic link |
| Query | Saved query or WIQL string user provides |
| Area / iteration | Filter; ask if area path defines grouping |

**Ask user:** User Story vs Task vs Bug under epic — usually all → `Task`. Include
sub-tasks (different from child work items)?

## Mapping

| ADO | werkwink |
|-----|----------|
| Epic | `Project` |
| Feature (optional) | `Project` or intermediate — ask if user uses Features |
| User Story / Task / Bug | `Task` |
| Sub-task (task type) | `Task` only if scope includes substasks |

## Source

```json
{
  "system": "azure-devops",
  "id": "12345",
  "url": "https://dev.azure.com/{org}/{project}/_workitems/edit/12345"
}
```

Use work item id for `source.id`; include type in summary (`#12345 [User Story]`).

## Assignee

`System.AssignedTo.displayName` → Owner.

## WIQL Example

```sql
SELECT [System.Id] FROM WorkItems
WHERE [System.Parent] = {epicId} AND [System.State] <> 'Removed'
```

Read MCP / REST schemas for `workitems`, `wiql`, `expand=relations`.
