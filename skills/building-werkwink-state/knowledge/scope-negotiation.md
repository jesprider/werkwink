# Scope Negotiation

Confirm what to pull **before** fetching. Fetching first and filtering later wastes
API calls and confuses the user when counts don't match expectations.

## When to Ask

| Signal | Question |
|--------|----------|
| Named epic/project only | "Include all child issues, or a subset?" |
| Multiple parents mentioned | "One werkwink project per parent, or group differently?" |
| "Issues I'm working on" (vague) | Tracker filter vs hand-pick after list? |
| Flat board (Trello, ungrouped GitHub) | How to partition into projects + tasks? |
| Sub-issues / nested tasks exist | Direct children only, or include nested substasks? |
| Status unclear | All statuses, open only, or in-progress only? |

## When NOT to Ask

User already specified all dimensions, e.g.:

> "Linear epic ENG-42, all open child issues, direct children only"

Confirm in the summary; don't re-prompt.

## Scope Options (present as needed)

Use `AskQuestion` or conversational choices:

**Children depth**

1. Direct children only (default for "child issues of epic X")
2. All descendants (nested sub-issues)
3. User picks from a list after you show titles + IDs

**Status filter**

1. All statuses (default)
2. Open / active only
3. Exclude done/canceled

**Selection mode**

1. All matching query
2. Specific IDs the user lists (`ENG-108, ENG-109`)
3. Interactive: fetch list → user selects rows

**Flat tracker partition** (Trello, GitHub without milestones)

1. Each list/column → project, cards/issues → tasks
2. Each milestone → project
3. Single project, every card → task
4. User describes custom grouping

## Document the Decision

In the delivery summary, state scope explicitly:

```
Scope: Linear epic ENG-42 → 1 project; 7 direct child issues (open only);
substasks excluded.
```

If the user changes scope mid-run, re-fetch or filter — don't silently widen/narrow.
