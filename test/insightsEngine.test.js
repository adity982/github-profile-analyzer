const test = require('node:test');
const assert = require('node:assert/strict');

const { computeInsights } = require('../src/utils/insightsEngine');

function completeEnoughUser(overrides = {}) {
  return {
    name: 'Ada Example',
    bio: 'Builds useful developer tools',
    avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
    location: null,
    blog: null,
    email: null,
    company: null,
    twitter_username: null,
    hireable: false,
    public_repos: 2,
    followers: 12,
    following: 3,
    ...overrides,
  };
}

test('computeInsights aggregates repository and profile metrics', () => {
  const repos = [
    {
      name: 'starter',
      stargazers_count: 2,
      forks_count: 1,
      watchers_count: 2,
      fork: false,
      language: 'JavaScript',
      topics: ['github', 'api'],
      pushed_at: new Date().toISOString(),
    },
    {
      name: 'popular',
      stargazers_count: 5,
      forks_count: 2,
      watchers_count: 4,
      fork: true,
      language: 'Python',
      topics: ['api'],
      pushed_at: '2000-01-01T00:00:00.000Z',
    },
  ];

  const insights = computeInsights(completeEnoughUser(), repos);

  assert.equal(insights.total_stars_received, 7);
  assert.equal(insights.total_forks_received, 3);
  assert.equal(insights.total_watchers, 6);
  assert.equal(insights.avg_stars_per_repo, 3.5);
  assert.equal(insights.forked_repos_count, 1);
  assert.equal(insights.original_repos_count, 1);
  assert.equal(insights.most_starred_repo, 'popular');
  assert.equal(insights.most_starred_count, 5);
  assert.equal(insights.active_repos_count, 1);
  assert.deepEqual(insights.top_languages, ['JavaScript', 'Python']);
  assert.deepEqual(insights.topics_used, ['api', 'github']);
  assert.equal(insights.profile_score, 55);
  assert.equal(insights.follower_ratio, 4);
});

test('computeInsights does not reorder the caller repository array', () => {
  const repos = [
    { name: 'first', stargazers_count: 1, topics: [], pushed_at: '2000-01-01T00:00:00.000Z' },
    { name: 'second', stargazers_count: 20, topics: [], pushed_at: '2000-01-01T00:00:00.000Z' },
  ];
  const originalOrder = repos.map(repo => repo.name);

  const insights = computeInsights(completeEnoughUser(), repos);

  assert.equal(insights.most_starred_repo, 'second');
  assert.deepEqual(repos.map(repo => repo.name), originalOrder);
});

test('computeInsights returns safe zero values for an empty repository list', () => {
  const insights = computeInsights(completeEnoughUser({ public_repos: 0, followers: 0, following: 0 }), []);

  assert.equal(insights.total_stars_received, 0);
  assert.equal(insights.avg_stars_per_repo, 0);
  assert.equal(insights.most_starred_repo, null);
  assert.equal(insights.most_starred_count, 0);
  assert.equal(insights.has_recent_activity, false);
  assert.equal(insights.follower_ratio, 0);
});
