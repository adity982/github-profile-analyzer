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
