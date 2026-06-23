# Report Structure

A werkwink report is a **short read**: a few sentences of story, then the few
things that matter. Length scales with how much actually happened, not with the
number of projects.

## Default shape

```markdown
# Progress — {window, e.g. week of Jun 16}

{Headline: 2–3 sentences. The single story across the portfolio — overall
direction, where momentum is, where the risk is. A busy reader could stop here.}

## What moved
{Prose, only the interesting dots. Each is a beat: what changed and what it
means (peak crossings, real progress, blockers cleared). Group small wins.}

## Where things stand
{Current state with the risks up front: active blockers, stalled work, who owns
what. This is the section a manager scans for "what needs me".}

## What's next
{Honest projection. What's on track, what's conditional on a blocker clearing,
what needs a decision — and from whom.}
```

Drop any section with nothing real to say. A quiet week might be just a headline
plus "What's next". Never pad an empty section.

## Optional skim line

For portfolios with many projects, you may append a compact one-line-per-project
ledger *after* the narrative, for skimmers:

```markdown
---
- **Auth revamp** — building, on track · owner: Sam
- **Billing migration** — stuck on vendor API · owner: Dana
- **Search index** — shipped
```

Keep it to one clause of meaning + owner. It supplements the prose; it never
replaces it.

## Window

- Default: **last 7 days** (the weekly cadence). Bound it with snapshot dates.
- "Since last report": since the previous distinct snapshot cluster.
- State the window in the title so the reader knows the frame.
- Movement *outside* the window is context, not news — mention only if it explains
  the current state.

## Audience variants

Same truth, different altitude and length. Pick one; ask only if unclear.

| Audience | Length | Lead with | Voice |
|----------|--------|-----------|-------|
| **Team standup** | Shortest | Blockers + who's on what | Direct, first-person-plural, candid |
| **Manager** | Short | What's at risk + what needs a decision | Plain, confident, no spin |
| **Exec / stakeholder** | Shortest narrative, no jargon | Direction + confidence + the one risk | Calm, outcome-focused; zero tracker jargon |

Across all: never hide bad news, never inflate good news. An exec report is
*shorter and higher*, not rosier.

## Per-project beat — the unit of the report

When a project earns a mention, write one tight beat:

1. **State** in hill terms ("past the peak", "stuck in discovery", "nearly done").
2. **Change** in the window, as meaning ("cleared the design unknowns this week").
3. **Why**, from the notes, in the team's words (paraphrased).
4. **Risk/next**, if any ("waiting on the vendor API before it can move").

Not every beat needs all four — only what's true and interesting. Two crisp
sentences usually beats four.
