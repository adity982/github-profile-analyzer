const NodeCache = require('node-cache');
const { fetchGitHubUser, fetchUserRepos, getRateLimit } = require('../utils/githubClient');
const { computeInsights } = require('../utils/insightsEngine');
const { upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile } = require('../models/profileModel');

// In-memory cache (TTL from env, default 5 min)
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 300, checkperiod: 60 });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profiles/analyze/:username
// Fetch from GitHub → compute insights → upsert to DB → return result
// ─────────────────────────────────────────────────────────────────────────────
async function analyzeProfile(req, res) {
  const { username } = req.params;

  if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
    return res.status(400).json({ success: false, message: 'Invalid GitHub username format.' });
  }

  try {
    // Fetch from GitHub
    let githubUser, repos;
    try {
      [githubUser, repos] = await Promise.all([
        fetchGitHubUser(username),
        fetchUserRepos(username),
      ]);
    } catch (err) {
      if (err.response?.status === 404) {
        return res.status(404).json({ success: false, message: `GitHub user '${username}' not found.` });
      }
      if (err.response?.status === 403) {
        return res.status(429).json({ success: false, message: 'GitHub API rate limit exceeded. Add a GITHUB_TOKEN to increase limits.' });
      }
      throw err;
    }

    // Compute insights
    const insights = computeInsights(githubUser, repos);

    // Persist to MySQL
    const { profileId } = await upsertProfile(githubUser, insights);

    // Invalidate cached entry so fresh data is returned
    cache.del(`profile:${username.toLowerCase()}`);

    return res.status(200).json({
      success: true,
      message: `Profile '${username}' analyzed and stored successfully.`,
      data: {
        profile: {
          id:           profileId,
          username:     githubUser.login,
          name:         githubUser.name,
          bio:          githubUser.bio,
          location:     githubUser.location,
          avatar_url:   githubUser.avatar_url,
          github_url:   githubUser.html_url,
          public_repos: githubUser.public_repos,
          followers:    githubUser.followers,
          following:    githubUser.following,
          account_created_at: githubUser.created_at,
        },
        insights,
      },
    });
  } catch (err) {
    console.error('[analyzeProfile] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profiles
// List all stored profiles with pagination, search, sorting
// ─────────────────────────────────────────────────────────────────────────────
async function listProfiles(req, res) {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const sortBy = req.query.sortBy || 'last_analyzed_at';
    const order  = req.query.order  || 'DESC';

    const result = await getAllProfiles({ page, limit, search, sortBy, order });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[listProfiles] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profiles/:username
// Fetch stored data for a single profile (with analysis history)
// ─────────────────────────────────────────────────────────────────────────────
async function getProfile(req, res) {
  const { username } = req.params;

  const cacheKey = `profile:${username.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, source: 'cache', data: cached });
  }

  try {
    const profile = await getProfileByUsername(username);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Profile '${username}' not found in database. Use POST /api/profiles/analyze/${username} to analyze it first.`,
      });
    }

    cache.set(cacheKey, profile);
    return res.status(200).json({ success: true, source: 'database', data: profile });
  } catch (err) {
    console.error('[getProfile] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/profiles/:username
// Remove a profile (and its insights) from the DB
// ─────────────────────────────────────────────────────────────────────────────
async function removeProfile(req, res) {
  const { username } = req.params;
  try {
    const deleted = await deleteProfile(username);
    if (!deleted) {
      return res.status(404).json({ success: false, message: `Profile '${username}' not found.` });
    }
    cache.del(`profile:${username.toLowerCase()}`);
    return res.status(200).json({ success: true, message: `Profile '${username}' deleted.` });
  } catch (err) {
    console.error('[removeProfile] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/github/rate-limit
// Convenience endpoint to check GitHub API quota
// ─────────────────────────────────────────────────────────────────────────────
async function checkRateLimit(req, res) {
  try {
    const rate = await getRateLimit();
    return res.status(200).json({ success: true, data: rate });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { analyzeProfile, listProfiles, getProfile, removeProfile, checkRateLimit };
