# werkwink — CI Pipeline (design)

**Date:** 2026-06-02
**Status:** Approved

Every pull request and push to `main` runs lint, format check, tests, and a
production build. CI mirrors local commands — no CI-only scripts or config paths.

---

## 1. Goal

After this change:

- Opening or updating a PR triggers a GitHub Actions workflow.
- The workflow fails if lint, Prettier format, tests, or build/typecheck fail.
- Pushes to `main` run the same checks to catch direct-push regressions.
- Developers can reproduce any CI failure with four local commands.

No deploy, coverage, Dependabot, or pre-commit hooks in this iteration.

---

## 2. Checks enforced

| Step | Script | Command | Notes |
|------|--------|---------|-------|
| Lint | `lint` | `eslint .` | Already exists |
| Format | `format:check` | `prettier --check src/` | **New script**; mirrors existing `format` |
| Test | `test` | `vitest run` | Already exists; 5 files, node environment |
| Build | `build` | `vue-tsc --noEmit && vite build` | Already exists; covers typecheck + Vite build |

Local parity command:

```bash
npm run lint && npm run format:check && npm run test && npm run build
```

---

## 3. Architecture

**Approach A (locked in): single job, sequential steps.**

One workflow file, one job. `npm ci` runs once; checks run in order. Chosen over
parallel jobs because the test suite is small (~3 s locally) and a single job
minimizes CI minutes and maintenance.

### 3.1 Workflow file — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test
      - run: npm run build
```

**Triggers:**

- `pull_request` — all PRs against any branch
- `push` to `main` — post-merge and direct-push safety net

**Concurrency:** Cancel in-progress runs for the same ref so stale commits don't
queue behind newer pushes.

**Runner:** `ubuntu-latest`

**Node:** Version read from `.nvmrc` (24) via `actions/setup-node@v4` with npm
cache enabled. Matches `package.json` `engines.node >= 24`.

**Actions pinned to major versions:** `actions/checkout@v4`, `actions/setup-node@v4`.

### 3.2 Package.json change

Add one script:

```json
"format:check": "prettier --check src/"
```

No other script or config changes.

---

## 4. Branch protection (manual, post-deploy)

The workflow file does not block merges by itself. After the first successful CI
run on `main`, configure in **Settings → Branches → Branch protection rules**:

- Require status check: **CI / ci**
- Require a pull request before merging to `main`

This step is documented here but not automated from the repo.

---

## 5. Out of scope

- Deploy, preview URLs, or release workflows
- Dependabot / Renovate
- Code coverage reporting
- Parallel job matrix or reusable workflows
- Pre-commit hooks (local convenience only; CI is the enforcement gate)
- Changes to ESLint, Vitest, Vite, or Prettier configuration

---

## 6. Validation

Before merging the implementation PR:

1. Run locally: `npm run lint && npm run format:check && npm run test && npm run build`
2. Push branch and confirm the **CI / ci** check passes on the PR
3. Optionally enable branch protection per §4

---

## 7. Files touched

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | **New** — workflow definition |
| `package.json` | Add `format:check` script |
