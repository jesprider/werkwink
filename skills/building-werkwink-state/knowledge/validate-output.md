# Validate Output

**Never deliver JSON without validation.** The app shows errors on import, but
catching them here saves a round trip.

## In werkwink Repo

When working inside the werkwink codebase:

```bash
node --experimental-strip-types -e "
import { readFileSync } from 'node:fs';
import { validateHillChartJson } from './src/schema/validate.ts';
const r = validateHillChartJson(readFileSync('hill-chart.json','utf8'));
if (!r.ok) { console.error(r.errors.join('\n')); process.exit(1); }
console.log('OK:', r.state.projects.length, 'projects');
"
```

Or run `npm test -- src/schema/validate.test.ts` after adding a fixture.

## Rules Checklist

- `version === 1`
- Unique `id` across all projects and tasks
- Each project: valid `color`, `position` 0–100, `lastMovedAt` ISO
- Each trackable: exactly one active primary up force
- Resolved forces: `resolvedAt` set when `status === 'resolved'`
- `snapshots[].position` 0–100

## Reference Files

- `src/schema/types.ts` — types
- `src/schema/validate.ts` — validator
- `src/schema/testFixtures.ts` — `MINIMAL_IMPORT_JSON`
- `fixtures/hill-chart-import-demo.json` — full example with sources and tasks

## On Failure

Fix structural errors in the builder; do not ask the user to hand-edit JSON unless
they prefer to. Re-run validation until `ok: true`.

## Sanity Checks (after validator passes)

- Project count matches agreed scope
- Every imported task has `source` when tracker provided URLs
- Child count matches fetch summary
