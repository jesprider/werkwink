# werkwink — Iteration 20: Landing page (design)

**Date:** 2026-06-10  
**Status:** Approved  
**Parent spec:** `docs/werkwink-design-spec.md` (§4.1, §8.7)  
**Roadmap:** `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` (iteration 20)  
**Builds on:** iteration 1 (landing stub), iteration 12 (overview empty state links back to `/`)

Cold visitors understand the app: the hill metaphor, forces, the daily ritual, and
the privacy boundary. Completes **M6** (final v1 polish).

---

## 1. Goal

After this iteration:

- **Landing page** (`/`) — full static content per parent spec §4.1, minus the
  secondary Import CTA (deferred).
- **`LandingHillIllustration.vue`** — static SVG hill using `useHillCurve` (same
  shape as the live chart); one decorative dot; uphill/downhill labels.
- **Forces section** — prose with inline `↑N ↓N` badge samples (chart visual language).
- **Daily ritual** — three numbered steps.
- **Privacy note** — localStorage-only boundary per §8.7.
- **Primary CTA** — **Try it live →** links to `/projects` (demo chart on first visit).
- **Roadmap** — iteration 20 marked `done` when implementation ships; link this doc
  in “Completed iteration docs”.

**Out of scope:** Secondary Import JSON link on landing; draggable landing demo;
`ForceChip` / side panel preview; `AppHeader` on landing; Pinia or store imports on
landing; parent spec §9 tracker skill.

---

## 2. Decisions (brainstorm lock-in)

| Topic | Decision |
|-------|----------|
| Hill illustration | **Static inline SVG** via `useHillCurve` — matches live chart geometry |
| Interactivity | **None** — no drag, no local state that mimics the app |
| Page structure | **`LandingView` + `LandingHillIllustration`** — two files; no section subcomponents |
| Primary CTA copy | **Try it live →** |
| Primary CTA target | **`/projects`** — first visit shows demo seed (`demo: true`) |
| Secondary Import CTA | **Omitted** — overview empty state + header Import remain the import path |
| Forces explainer | **Prose + inline badge spans** — `text-force-up` / `text-force-down`; no `ForceChip` |
| Privacy placement | **Muted box** above the bottom CTA |
| Header chrome | **Wordmark only** — `werkwink` links to `/`; no `AppHeader` |
| Parent spec §4.1 CTA | Primary label updated to **Try it live →** in implementation branch |

---

## 3. Page layout

Single scrolling column, centered `max-w-2xl`, generous vertical spacing (`space-y-12`
or equivalent section margins). Top to bottom:

1. **Header** — `werkwink` wordmark (`font-heading text-xl`), `RouterLink` to `/`.
2. **Hero** — H1 + subtitle (existing copy from stub / parent spec).
3. **The hill** — H2, illustration, one supporting sentence.
4. **Forces** — H2, two paragraphs + closing line (badge samples inline).
5. **The daily ritual** — H2, ordered list (3 steps).
6. **Privacy** — bordered muted box (`border-hill-sand/60 bg-hill-sand/20 rounded-xl`).
7. **CTA** — terracotta pill button at the bottom only (not duplicated in hero).

No Pinia, no `ImportButton`, no chart store reads or writes.

### 3.1 Copy (draft)

**Hero**

- H1: `Run your daily on a hill`
- Subtitle: `A manager's view of where each project sits on the uncertainty curve, and what's pushing it back.`

**The hill** (H2: `The hill`)

- Supporting sentence: `Position on the curve is uncertainty — left is still figuring it out; right is execution once you know how.`

**Forces** (H2: `Forces`)

- Paragraph 1 (up): Explain assignee, helpers, alternative approaches. Inline sample:
  `<span class="font-medium text-force-up">↑2</span>`.
- Paragraph 2 (down): Explain blockers, obstacles, dependencies. Inline sample:
  `<span class="font-medium text-force-down">↓1</span>`.
- Closing: `During the daily, the conversation aims to keep up > down while you're still on the uphill.`

**The daily ritual** (H2: `The daily ritual`)

1. Open the chart and walk through each project with the team.
2. Drag dots and capture blockers and helpers as forces.
3. Click **End daily** to commit today's snapshot.

**Privacy**

> **Your data stays on your device.** Everything is stored in your browser's
> localStorage. There is no shared backend — two people opening the same link see
> separate charts. Export JSON is how you move data between machines.

---

## 4. `LandingHillIllustration.vue`

New component under `src/components/`.

- Import `useHillCurve`: `CHART`, `curvePath`, `curveX`, `curveY`.
- SVG `viewBox`: `0 0 ${CHART.width} ${CHART.height}`.
- Classes: `h-auto w-full max-w-xl mx-auto select-none`.
- `role="img"` and `aria-label="Hill curve: uphill on the left, downhill on the right, peak in the center"`.

**Paths** (match `HillChart.vue` styling):

- Filled area under curve: fill `#E8D9BD`, opacity `0.45`.
- Curve stroke: `#E8D9BD`, stroke-width `3`.
- Baseline: horizontal line at `CHART.height - CHART.bottomPad`.

**Static demo dot** at position **28**:

- Circle: fill terracotta (`#c56b4a` or `PALETTE` lookup if convenient), radius `16`,
  stroke cream `#FDFAF4`, stroke-width `2`.
- No name label, no force badges, no drag handlers, no staleness satellites.

**Region labels** (SVG `<text>` or HTML overlay — prefer SVG for simplicity):

- Left (~x=15%): `Uphill — figuring it out` — `text-sm`, `fill` warm text at reduced opacity.
- Right (~x=70%): `Downhill — execution` — same style.
- Optional peak hint at x=50: small label `Peak` or omit if cluttered.

Fixed constants only — no props required in v1.

---

## 5. CTA

```html
<RouterLink
  to="/projects"
  class="inline-block rounded-full bg-terracotta px-6 py-3 text-cream hover:opacity-90"
>
  Try it live →
</RouterLink>
```

Placed once, after the privacy box.

---

## 6. Documentation updates (implementation branch)

### 6.1 `docs/werkwink-design-spec.md`

- §4.1: note primary CTA label **Try it live →**; mark secondary Import link as
  deferred (overview / empty state remain the import entry points).

### 6.2 `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md`

- Progress tracker: iteration 20 → **done** when shipped.
- “Current codebase snapshot” bullet: landing page complete.
- Add row to “Completed iteration docs” table linking this file.

---

## 7. Testing

**Required gate:** `npm run lint && npm run format:check && npm run test && npm run build`

| Area | Coverage |
|------|----------|
| Unit | None required (static content) |
| Manual | See checklist below |

**Manual checklist:**

- [ ] Visit `/` — hero, hill illustration, forces, ritual, privacy, CTA all visible.
- [ ] Hill SVG renders; uphill/downhill labels readable; demo dot visible.
- [ ] **Try it live →** navigates to `/projects` with demo projects.
- [ ] Landing does not mutate chart data (visit `/`, then `/projects` — data unchanged vs direct `/projects` visit).
- [ ] Overview empty state link “New here? Read what this app is →” still reaches `/`.
- [ ] Responsive: content readable at ~375px width (no horizontal scroll from illustration).

---

## 8. Files touched

| File | Change |
|------|--------|
| `src/views/LandingView.vue` | Full section layout + copy |
| `src/components/LandingHillIllustration.vue` | New static hill SVG |
| `docs/werkwink-design-spec.md` | §4.1 CTA + secondary Import note |
| `docs/superpowers/specs/2026-06-02-werkwink-v1-roadmap-design.md` | Iteration 20 done + snapshot |
| `docs/superpowers/specs/2026-06-10-werkwink-iteration-20-landing-page-design.md` | This doc |

**Branch:** `feature/iteration-20-landing-page` off `main`.

---

## Spec self-review

- [x] No TBD placeholders.
- [x] Static illustration only; interactivity explicitly out of scope.
- [x] Secondary Import CTA omitted by explicit decision; overview import path unchanged.
- [x] No store coupling on landing — privacy and “no data on this page” preserved.
- [x] Scope fits single iteration; no pull-forward from post-v1 work.
- [x] Parent spec + roadmap updates listed for implementation branch.
