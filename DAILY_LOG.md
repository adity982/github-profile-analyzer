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
