const assert = require('node:assert/strict');
const test = require('node:test');

const { computeInsights } = require('../src/utils/insightsEngine');

const user = {
  name: 'Example User',
  bio: 'Developer',
  avatar_url: 'https://avatars.githubusercontent.com/u/1',
  location: null,
  blog: '',
  email: null,
  company: null,
  twitter_username: null,
  hireable: false,
  public_repos: 3,
  followers: 10,
  following: 2,
};

test('computing insights preserves repository order', () => {
  const repos = [
    { name: 'recent', stargazers_count: 1, forks_count: 0, watchers_count: 1, fork: false, pushed_at: new Date().toISOString() },
    { name: 'popular', stargazers_count: 50, forks_count: 3, watchers_count: 50, fork: false, pushed_at: new Date().toISOString() },
    { name: 'older', stargazers_count: 5, forks_count: 1, watchers_count: 5, fork: true, pushed_at: '2020-01-01T00:00:00Z' },
  ];
  const originalOrder = repos.map((repo) => repo.name);

  const insights = computeInsights(user, repos);

  assert.deepEqual(repos.map((repo) => repo.name), originalOrder);
  assert.equal(insights.most_starred_repo, 'popular');
  assert.equal(insights.most_starred_count, 50);
});

test('empty repository lists produce null most-starred details', () => {
  const insights = computeInsights({ ...user, public_repos: 0 }, []);

  assert.equal(insights.most_starred_repo, null);
  assert.equal(insights.most_starred_count, 0);
});
