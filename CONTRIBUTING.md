# Contributing

Thanks for helping improve GitHub Profile Analyzer.

## Development setup

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env` only when exercising the API with MySQL.
4. Run the fast checks before opening a pull request:

```bash
npm run lint
npm test
```

The insight regression tests do not require GitHub credentials or a database.

## Pull requests

Keep each pull request focused on one maintainable improvement. Include:

- the user or developer problem being solved
- tests for behavior changes
- documentation updates when commands, endpoints, or metrics change
- the checks you ran and any environment-specific limitations

Never commit access tokens, `.env` files, private profile exports, or database dumps.

## Useful contribution areas

- GitHub API error and rate-limit handling
- deterministic insight metrics and fixtures
- database integration tests
- API response examples and OpenAPI documentation
- accessibility and visualization clients built on the API

For new metrics, explain what the signal means, its limitations, and how it avoids rewarding spammy or superficial activity.
