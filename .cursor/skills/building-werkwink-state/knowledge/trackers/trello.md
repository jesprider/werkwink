# Trello

## Transport

| Priority | Method |
|----------|--------|
| 1 | Trello MCP (if enabled) |
| 2 | Trello REST API (key + token) |
| 3 | Paste board export / CSV |

## Scope Queries

Trello has **no native epic layer**. Always negotiate:

| Option | Mapping |
|--------|---------|
| Each list → project | List name = project; cards = tasks |
| Single list | One project; cards = tasks |
| Labels as grouping | Ask user — non-standard |

**Ask:** which board? which lists? open cards only or include archived?

## Mapping

| Trello | werkwink |
|--------|----------|
| List | `Project` (default) |
| Card | `Task` |

## Source

```json
{
  "system": "trello",
  "id": "<cardId>",
  "url": "https://trello.com/c/<shortLink>"
}
```

## Assignee

Card members → first member name as Owner, or null.
