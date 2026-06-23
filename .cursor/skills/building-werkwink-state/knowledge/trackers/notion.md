# Notion

## Transport

| Priority | Method |
|----------|--------|
| 1 | Notion MCP |
| 2 | Notion API with integration token |
| 3 | Paste database export / CSV |

## Scope Queries

Notion is a database, not a native epic/task tree. **Always negotiate:**

| User intent | Fetch approach |
|-------------|----------------|
| Database URL | Query all pages in database |
| Filter / view | Apply filter (status, person) — confirm formula |
| Parent relation | If DB has self-relation "Epic" → parent/child mapping |

**Ask user:**

- Which property = title, assignee, status, URL?
- Relation property for parent/child, or flat rows → single project?
- Include archived / done pages?

## Mapping

| Notion | werkwink |
|--------|----------|
| Database (flat) | One `Project` (database name); each row → `Task` |
| Parent row (via relation) | `Project` |
| Child row | `Task` |
| Linked sub-pages | `Task` only if user includes nested pages |

Default for flat task DB: **one project named after the database**, all open rows →
tasks.

## Source

```json
{
  "system": "notion",
  "id": "<page_id>",
  "url": "https://www.notion.so/<workspace>/<page_id>"
}
```

Strip hyphens from UUID for API; keep canonical URL in `source.url`.

## Assignee

People property → first person name as Owner. Null if empty.

## API Notes

`databases.query`, `pages.retrieve`. Map `properties` dynamically — schema differs
per workspace. Read database schema before bulk fetch.
