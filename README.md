# GitHub Profile Analyzer API

A Node.js API that turns public GitHub profile data into useful portfolio insights and stores analysis history in MySQL.

[![CI](https://github.com/adity982/github-profile-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/adity982/github-profile-analyzer/actions/workflows/ci.yml)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

## Why this project exists

A repository count alone says little about a developer portfolio. This API combines profile and repository data into signals such as original-vs-forked work, stars and forks received, language diversity, topic usage, recent activity, and profile completeness. Each run is saved so applications can show how a profile changes over time.

## Features

| Feature | What it provides |
|---|---|
| Profile analysis | Public profile plus up to 200 recently updated repositories |
| Portfolio insights | Stars, forks, languages, topics, activity, and completeness metrics |
| Analysis history | MySQL snapshots for every run, not just the latest result |
| Local cache | Configurable in-memory caching without a Redis dependency |
| API protection | Helmet, CORS, request limits, validation, and parameterized queries |
| Operations | Database-aware health check and GitHub rate-limit endpoint |

## Quickstart

### Prerequisites

- Node.js 18 or newer
- MySQL 8.x
- Optional GitHub token for a higher public API rate limit

### 1. Install

```bash
git clone https://github.com/adity982/github-profile-analyzer.git
cd github-profile-analyzer
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Set the MySQL connection values in `.env`. `GITHUB_TOKEN` is optional; for public data, use a fine-grained token with no repository permissions.

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=github_analyzer
GITHUB_TOKEN=
CACHE_TTL=300
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Create the database

```bash
mysql -u root -p < sql/schema.sql
```

### 4. Run

```bash
npm start
```

The API starts at `http://localhost:3000`.

### 5. Analyze a profile

```bash
curl -X POST http://localhost:3000/api/profiles/analyze/torvalds
curl http://localhost:3000/api/profiles/torvalds
```

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/profiles/analyze/:username` | Fetch, analyze, and save a public profile |
| `GET` | `/api/profiles` | List saved profiles with pagination, search, and sorting |
| `GET` | `/api/profiles/:username` | Return a profile and its latest analysis history |
| `DELETE` | `/api/profiles/:username` | Remove a profile and its snapshots |
| `GET` | `/api/github/rate-limit` | Show the current GitHub API allowance |
| `GET` | `/health` | Check server and database readiness |

The list endpoint accepts `page`, `limit`, `search`, `sortBy`, and `order`. Supported sort fields are `followers`, `public_repos`, `total_stars_received`, `profile_score`, `last_analyzed_at`, and `username`.

Example:

```bash
curl "http://localhost:3000/api/profiles?page=1&limit=10&sortBy=total_stars_received&order=DESC"
```

## Insights computed

- top languages and language diversity
- total and average stars and forks
- total watchers
- most-starred repository
- original and forked repository counts
- recently active repository count
- commonly used repository topics
- follower-to-following ratio
- profile completeness score with a field-by-field breakdown

## Project structure

```text
src/
├── app.js                    # Express entry point and health route
├── config/database.js        # MySQL connection pool
├── controllers/              # Request handlers
├── middleware/               # Error and 404 handling
├── models/                   # Parameterized database queries
├── routes/                   # API routes
└── utils/
    ├── githubClient.js       # GitHub REST client and pagination
    └── insightsEngine.js     # Side-effect-free insight computation
sql/schema.sql                # Tables, indexes, and summary view
test/insightsEngine.test.js   # Deterministic regression tests
```

## Validation

The insight tests are isolated from GitHub and MySQL, so contributors can run them quickly and without credentials:

```bash
npm run lint
npm test
```

GitHub Actions runs the same checks on Node.js 18, 20, and 22 for every pull request and every push to `main`. The regression suite covers aggregate metrics, empty profiles, recent activity, profile scoring, and input-order stability.

For an end-to-end smoke test, start MySQL, apply `sql/schema.sql`, run the server, check `/health`, analyze a public account, and read the saved result back from `/api/profiles/:username`.

## Database model

- `github_profiles` stores the latest core profile fields.
- `profile_insights` stores one immutable snapshot per analysis run.
- `profile_summary` joins each profile to its latest insight row.

See [`sql/schema.sql`](sql/schema.sql) for the complete schema.

## Deployment

The service can run on Railway, Render, Fly.io, or another Node.js host with MySQL:

1. Provision a MySQL database.
2. Apply `sql/schema.sql` once.
3. Set the variables from `.env.example` in the platform dashboard.
4. Use `npm start` as the start command.
5. Monitor `/health` for database readiness.

## Operational notes

- Anonymous GitHub API access is limited to 60 requests per hour; authenticated public requests typically allow 5,000 per hour.
- The analyzer intentionally caps repository fetching at 200 repositories per profile.
- Cached reads use the `CACHE_TTL` value and do not require Redis.
- Never commit `.env` or a GitHub token. The included `.gitignore` excludes local environment files.

## License

Licensed under the [ISC License](LICENSE).
