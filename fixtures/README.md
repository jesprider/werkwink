# Hill chart fixtures

## `hill-chart-import-demo.json`

Comprehensive **tracker-import** shaped JSON for manual testing of **Import** on `/projects`.
Distinct from the built-in `sample.ts` seed (different project names and ids).

**Showcases (iterations 1–17)**

| Feature | Where in file |
|---------|----------------|
| External sources (Linear, Jira, GitHub) | All three projects |
| Active up/down forces + resolved past forces | Platform API, Customer onboarding |
| Peak at 50 with active blockers | Platform API migration (`position: 50`) |
| Downhill with active downs | Webhook retry task at 58 |
| Snapshot history / ghost trails | All projects (select a dot after import) |
| Staleness satellites | Varied `lastMovedAt` (grace day, 1–4 red satellites on upper arc) |
| Done dot at 100 | Observability rollout |
| Tasks under projects | Platform API, Customer onboarding |

**How to use**

1. Open the app with demo sample data (fresh profile or **Clean** then reload).
2. Click **Import** (or drag this file onto the overview).
3. Confirm replacing demo data when prompted.
4. Explore overview and project views — click dots for the side panel, select dots for trails.

The file is validated in CI via `src/schema/validate.test.ts`.

**Note:** `lastMovedAt` and snapshot dates are static ISO/calendar values. Staleness
satellites shift as real calendar time passes; the built-in `sample.ts` seed uses
relative dates and always demos staleness on first load.
