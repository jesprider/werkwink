# Interpreting werkwink State

Translate raw fields into meaning. Read every dot through four lenses —
**direction, current state, the why, projection** — then keep only what's worth
saying.

Schema reminders: snapshots and notes are sorted **newest-first** (`[0]` is most
recent). Positions are integers 0–100. Forces have `direction` (up/down),
`status` (active/resolved), `isPrimary`, `owner`, `createdAt`, `resolvedAt`.

---

## Position = how figured-out the work is

The x-axis is *certainty*, not percent-complete. This is the single most
important thing to get right.

| Where | Read it as |
|-------|-----------|
| Low uphill (0–20) | Just started / still vague — we don't yet know how |
| High uphill (20–49) | Actively de-risking — shaping the approach, closing unknowns |
| At/near peak (~50) | The hard thinking is done; the path is clear |
| Downhill (51–99) | Heads-down execution — no surprises expected, just doing it |
| 99 | Project is effectively finished but waiting on its last task(s) to hit done |
| 100 | Shipped / done |

**Never** translate a position to a percentage of completion. Uphill 40 is *not*
"40% done" — it may be 10% of the effort but most of the risk.

---

## Trail (snapshots) = direction and momentum

Compare snapshots inside the window. The *shape* of movement is the story.

| Pattern | Meaning |
|---------|---------|
| Rising steadily | Healthy progress; momentum |
| Rising fast then flat | Early clarity, now grinding — check for a fresh blocker |
| Flat across the window | Stalled (cross-check staleness + active down forces) |
| Crossed 50 upward | **Beat:** moved from figuring-out into building — call this out |
| Climbing in downhill (e.g. 60→90) | Closing in on done |
| Dropped to 45 | **Snap-back:** a blocker forced a "done thinking" item back to rethink |
| Other drop | Re-opened uncertainty — scope grew or an assumption broke |
| No snapshots in window | Quiet — nothing captured; say so plainly, don't infer progress |

Velocity = position delta ÷ days between snapshots. Use it for projection, not as
a quoted number.

---

## Forces = what's helping and what's in the way

- **Active down forces** = the live blockers/risks. These are the spine of the
  "where things stand / what's at risk" section. Name them in plain words.
- **Primary up force** (`isPrimary: true`) = the **owner** (`owner` field). Use to
  attribute work and say who to ask. `owner: null` = unassigned — itself worth flagging.
- **Other up forces** = helpers, tailwinds, extra hands → momentum or recent reinforcement.
- **Recently resolved down force** (`resolvedAt` in window) = a **win**. A blocker
  that cleared right before a jump explains the jump: "clearing the vendor
  dependency unblocked real progress."
- `resolutionReason` is **not captured in v1** (always null). Don't rely on it —
  infer the "why" from notes and the movement around `resolvedAt`.

A downhill item with an active down force is contradictory on purpose — that's the
state right after a snap-back. Read it as "thought it was settled; hit a wall."

---

## Notes = the between-the-lines source

`notes[]` is dated free text the person wrote during standups. This is where the
human story lives — the *why* behind the movement. Mine it:

- Use notes to explain a jump, a stall, or a blocker in the team's own words.
- Paraphrase; quote only a short, vivid phrase when it earns its place.
- A note with no movement still tells you something (thinking, waiting, debating).
- Reconcile note vs position: if a note sounds done but the dot is uphill, trust
  the dot for state and use the note for color — or flag the mismatch gently.

Notes are export-only and never shown in the app, so the reader hasn't seen them.
You are their narrator.

---

## Staleness = stalled work

`daysSinceLastMove` (see `src/domain/staleness.ts`): ≥2 days without movement
starts showing red satellites (max 4 at 5+ days). Done dots (100) are never stale.

| Stale + region | Read it as |
|----------------|-----------|
| Uphill, stale | Stuck in discovery — likely needs a decision or input |
| Downhill, stale | Execution stalled — someone's blocked or pulled away |
| Many dots stale at once | Capacity/attention problem, not a per-project one |

---

## Projection = honest trajectory

- **Downhill + steady velocity** → you may project a soft landing ("on track to
  finish in the next week or two if nothing breaks"). No invented hard dates.
- **Uphill** → resist ETAs. The honest projection is "still shaping — a timeline
  firms up once it's past the peak." Saying this *is* the insight, not a cop-out.
- **Blocked or stale** → projection is conditional on the blocker: "stuck until X
  clears." Lead with what would unstick it.
- **Thin data** → "too early to call." Don't manufacture a curve from one point.

Tie projection to the active down forces and owner: who needs to do what for the
optimistic path to happen.

---

## Roll-up: projects vs tasks

Report at the **project** level. Pull a specific **task** into the story only when
it *is* the story — e.g. one blocked task is holding a project at 99, or a task's
snap-back explains the project's stall. Otherwise summarize tasks into the
project's direction and state.
