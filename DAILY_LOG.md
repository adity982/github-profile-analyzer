# Shipping log

## 2026-07-24

### Shipped

- made insight computation side-effect free by replacing in-place repository sorting
- added deterministic regression tests with Node's built-in test runner
- added syntax checks and CI across Node.js 18, 20, and 22
- rewrote the README around the user problem, quickstart, API, validation, deployment, and operational limits

### Validation

- branch is five commits ahead of `main` with no divergence before this log entry
- regression coverage exercises aggregate metrics, empty inputs, recent activity, profile scoring, and caller input order
- GitHub Actions is configured to run `npm run lint` and `npm test` on pull requests

### Metrics to watch

- CI pass rate across supported Node.js versions
- repository stars, forks, clones, and unique visitors
- README-to-quickstart conversion through issues or discussions
- first external bug report or contribution

### Next move

Add an integration-test seam around the GitHub client and database boundary, then publish a small example response fixture or API demo screenshot without exposing tokens or personal data.

## 2026-07-26

### Shipped

- squash-merged PR #1 as commit `09f168dafb9f535edfb94c74fbc8dfe4d43ba981`
- published the regression tests, Node.js 18/20/22 CI matrix, README rewrite, contributor guide, and repository templates to `main`
- avoided opening another upstream contribution while the authored PR queue remains large

### Validation

- PR #1 had no review threads, comments, or requested changes
- GitHub Actions run `30071220075` passed on Node.js 18, 20, and 22, including the successful rerun
- the improved README was fetched and verified from `main` after the merge
- draft PR #4 remains open and is now non-mergeable because it overlaps the shipped insight-order fix

### Metrics to watch

- repository stars, forks, clones, unique visitors, and README traffic
- CI pass rate on future pull requests
- first external issue, contribution, or API user
- open authored PR count and review turnaround

### Next move

Rebase or recreate draft PR #4 as a focused startup-import change, dropping the already-shipped insight-order work. Add an integration test around app import/start behavior, and do not open another upstream PR until the existing queue has been reduced.

## 2026-07-27

### Shipped

- recreated the stale draft as focused PR #5 from current `main`, carrying only the import-safe startup change, its regression test, and README guidance
- guarded server startup with `require.main === module` and exported `start()` for explicit lifecycle control
- added a credential-free subprocess test that detects accidental MySQL connections or HTTP listeners during import
- closed superseded PR #4 with a pointer to the clean replacement

### Validation

- branch started from commit `aa7031d44a512bb50953d0d61ffe0d4c8f85a2f7` with no divergence
- the functional diff is limited to `src/app.js`, `test/app.test.js`, and README guidance
- GitHub Actions run `30241223234` passed syntax checks and regression tests on Node.js 18, 20, and 22
- PR #5 has no review comments, threads, or requested changes at shipping time

### Metrics to watch

- stars, forks, clones, unique visitors, and README traffic
- CI stability and time to first external issue or contribution
- issue-to-merge cycle time and authored open-PR backlog

### Next move

Merge PR #5 after the final documentation-only CI pass, then add a safe example response fixture or OpenAPI contract so users can evaluate the API before provisioning MySQL.

## 2026-07-28

### Shipped

- published a complete synthetic success response at `docs/example-analyze-response.json`
- linked the fixture from the quickstart and documented it in the project structure
- added GitHub Profile Analyzer to the public profile README as a recently shipped, regression-protected project
- avoided another upstream contribution because the authored pull-request queue is already large

### Validation

- parsed the fixture as strict JSON
- matched all 17 insight fields against `computeInsights()` and the success envelope against `analyzeProfile()`
- verified the score breakdown totals 70 out of 100 and no component exceeds its maximum
- used only synthetic identity data; no token, credential, database row, or real profile export is included

### Metrics to watch

- repository stars, forks, clones, unique visitors, and README-to-fixture clicks
- first external issue, contribution, or API user
- profile visits to GitHub Profile Analyzer
- open authored PR count and review turnaround

### Next move

Publish an OpenAPI 3.1 contract generated from the existing routes and response fields, then validate it in CI. Defer new upstream PRs until the current review queue has materially reduced.

