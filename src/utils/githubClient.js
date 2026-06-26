const axios = require('axios');

const BASE_URL = 'https://api.github.com';

const githubClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN && {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    }),
  },
});

/**
 * Fetch a GitHub user's public profile.
 */
async function fetchGitHubUser(username) {
  const { data } = await githubClient.get(`/users/${username}`);
  return data;
}

/**
 * Fetch up to 100 public repositories for a user.
 * Sorted by recently updated so we get the most relevant ones.
 */
async function fetchUserRepos(username) {
  const repos = [];
  let page = 1;
  const perPage = 100;

  // GitHub caps at 100 per page; fetch at most 2 pages (200 repos) to keep it fast
  while (page <= 2) {
    const { data } = await githubClient.get(`/users/${username}/repos`, {
      params: { per_page: perPage, page, sort: 'updated', type: 'public' },
    });
    repos.push(...data);
    if (data.length < perPage) break;
    page++;
  }

  return repos;
}

/**
 * Get remaining GitHub API rate-limit info.
 */
async function getRateLimit() {
  const { data } = await githubClient.get('/rate_limit');
  return data.rate;
}

module.exports = { fetchGitHubUser, fetchUserRepos, getRateLimit };
