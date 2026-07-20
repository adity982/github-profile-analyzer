# 🔍 GitHub Profile Analyzer API

A reference Node.js backend that fetches public GitHub profiles, computes portfolio insights, and stores analysis snapshots in MySQL.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Profile Analysis** | Fetches full profile + up to 200 repos per user |
| **Rich Insights Engine** | Computes 15+ derived metrics per analysis |
| **MySQL Persistence** | Profiles + per-run snapshots stored; analysis history tracked |
| **In-Memory Cache** | Redis-free caching via `node-cache` (configurable TTL) |
| **Rate Limiting** | API-wide rate limiting via `express-rate-limit` |
| **Pagination + Search** | List endpoint supports page/limit/search/sort/order |
| **Security** | `helmet`, `cors`, input validation, parameterized queries |
| **Health Check** | `/health` endpoint for deployment monitoring |

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.x (via `mysql2/promise`)
- **External API**: GitHub REST API v3
- **Libraries**: `axios`, `dotenv`, `helmet`, `cors`, `morgan`, `express-rate-limit`, `node-cache`

---

## 📁 Project Structure

```
github-analyzer/
├── src/
│   ├── app.js                    # Express entry point
│   ├── config/
│   │   └── database.js           # MySQL connection pool
│   ├── controllers/
│   │   └── profileController.js  # Route handlers
│   ├── middleware/
│   │   └── errorHandler.js       # Global error + 404 handlers
│   ├── models/
│   │   └── profileModel.js       # DB queries (upsert, fetch, delete)
│   ├── routes/
│   │   └── profileRoutes.js      # Express router
│   └── utils/
│       ├── githubClient.js       # Axios-based GitHub API client
│       └── insightsEngine.js     # Insight computation logic
├── sql/
│   └── schema.sql                # DB schema + view definitions
├── .env.example                  # Environment variable template
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/adity982/github-profile-analyzer.git
cd github-profile-analyzer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=github_analyzer

# GitHub Personal Access Token (optional but recommended)
# Increases rate limit from 60 → 5000 requests/hour
# Create one at: https://github.com/settings/tokens (no scopes needed for public data)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Cache TTL in seconds (default: 300 = 5 min)
CACHE_TTL=300
```

### 4. Set up the MySQL database

```bash
# Log into MySQL
mysql -u root -p

# Run the schema
source /path/to/github-analyzer/sql/schema.sql;
```

Or directly:

```bash
mysql -u root -p < sql/schema.sql
```

### 5. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:3000`

---

## 📡 API Reference

### Base URL
```
http://localhost:3000/api
```

---

### `POST /api/profiles/analyze/:username`
Fetch a GitHub user's profile and repos, compute insights, and store everything in the database.

**Example:**
```bash
curl -X POST http://localhost:3000/api/profiles/analyze/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile 'torvalds' analyzed and stored successfully.",
  "data": {
    "profile": {
      "id": 1,
      "username": "torvalds",
      "name": "Linus Torvalds",
      "public_repos": 7,
      "followers": 236000,
      ...
    },
    "insights": {
      "top_languages": ["C", "Perl"],
      "total_stars_received": 210000,
      "profile_score": 75,
      "follower_ratio": 236000.0,
      "has_recent_activity": true,
      ...
    }
  }
}
```

---

### `GET /api/profiles`
List all analyzed profiles with their latest insights.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | Page number |
| `limit` | int | `20` | Results per page (max 100) |
| `search` | string | `""` | Filter by username |
| `sortBy` | string | `last_analyzed_at` | Sort field |
| `order` | string | `DESC` | `ASC` or `DESC` |

**Sort options:** `followers`, `public_repos`, `total_stars_received`, `profile_score`, `last_analyzed_at`, `username`

**Example:**
```bash
curl "http://localhost:3000/api/profiles?page=1&limit=10&sortBy=followers&order=DESC"
```

---

### `GET /api/profiles/:username`
Get full stored data for a single profile, including the last 10 analysis snapshots.

```bash
curl http://localhost:3000/api/profiles/torvalds
```

> Responses are cached in memory for `CACHE_TTL` seconds (default: 5 min).

---

### `DELETE /api/profiles/:username`
Remove a profile and all its insight history from the database.

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

### `GET /api/github/rate-limit`
Check your current GitHub API rate limit status.

```bash
curl http://localhost:3000/api/github/rate-limit
```

---

### `GET /health`
Health check — verifies server + database connectivity.

```bash
curl http://localhost:3000/health
```

---

## 🧠 Insights Computed

| Insight | Description |
|---|---|
| `top_languages` | Top 10 programming languages across all public repos |
| `language_diversity` | Count of unique languages used |
| `total_stars_received` | Sum of ⭐ across all repos |
| `total_forks_received` | Sum of forks across all repos |
| `avg_stars_per_repo` | Average stars per repo |
| `avg_forks_per_repo` | Average forks per repo |
| `most_starred_repo` | Name + count of the most starred repo |
| `forked_repos_count` | How many repos are forks (vs original) |
| `original_repos_count` | How many repos are original work |
| `has_recent_activity` | Any push in the last 6 months |
| `active_repos_count` | Number of repos updated in the last 6 months |
| `topics_used` | Top tags/topics used across repos |
| `follower_ratio` | followers / following (influence signal) |
| `profile_score` | 0–100 completeness score |
| `score_breakdown` | Per-field score breakdown (bio, avatar, blog, etc.) |

---

## 🗄️ Database Schema

Two tables + one view:

- **`github_profiles`** — Core profile data, upserted on every analysis
- **`profile_insights`** — One row per analysis run (history preserved)
- **`profile_summary`** (VIEW) — Joins each profile with its latest insight row

See [`sql/schema.sql`](./sql/schema.sql) for full schema with indexes.

---

## 🚀 Deployment

### Railway / Render / Fly.io

1. Set all environment variables from `.env.example` in your platform dashboard
2. Set start command to `npm start`
3. Provision a MySQL database and point `DB_*` vars at it
4. Run `sql/schema.sql` against your production DB

### Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📦 Postman Collection

Import `GitHub_Analyzer.postman_collection.json` from the repo root.

Set the collection variable `base_url` to your deployed or local URL.

---

## ✅ Validation

This repository currently includes a manual smoke-test path:

1. Start MySQL and apply `sql/schema.sql`.
2. Run `npm install` and `npm start`.
3. Check `GET /health` for server and database status.
4. Analyze a public account with `POST /api/profiles/analyze/:username`.
5. Confirm the saved result with `GET /api/profiles/:username`.

Automated tests and CI are not included yet; treat this as a reference implementation until that gap is closed.

---

## 📝 Notes

- Without a `GITHUB_TOKEN`, the GitHub API allows 60 requests/hour. With a token, this increases to **5,000/hour**. Tokens for public data require no scopes.
- The `profile_insights` table keeps a full history of every analysis run, so you can track metric changes over time.
- All DB queries use parameterized statements — no SQL injection risk.


---

## 📄 License

Licensed under the [ISC License](LICENSE).
