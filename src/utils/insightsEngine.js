/**
 * Derives all computed insights from raw GitHub API data.
 */

const SIX_MONTHS_AGO = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d;
};

/**
 * Compute language distribution across all repos.
 * Returns top N languages sorted by repo count.
 */
function computeLanguages(repos, topN = 10) {
  const freq = {};
  for (const repo of repos) {
    if (repo.language) {
      freq[repo.language] = (freq[repo.language] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([lang]) => lang);
}

/**
 * Collect unique topics used across repos.
 */
function computeTopics(repos, topN = 20) {
  const freq = {};
  for (const repo of repos) {
    for (const topic of repo.topics || []) {
      freq[topic] = (freq[topic] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([t]) => t);
}

/**
 * Profile completeness score (0-100).
 * Each field contributes a weight.
 */
function computeProfileScore(user) {
  const checks = {
    name:      { value: !!user.name,           weight: 15 },
    bio:       { value: !!user.bio,            weight: 20 },
    avatar:    { value: user.avatar_url && !user.avatar_url.includes('gravatar'), weight: 10 },
    location:  { value: !!user.location,       weight: 10 },
    blog:      { value: !!user.blog,           weight: 10 },
    email:     { value: !!user.email,          weight: 10 },
    company:   { value: !!user.company,        weight: 5  },
    twitter:   { value: !!user.twitter_username, weight: 5 },
    hireable:  { value: !!user.hireable,       weight: 5  },
    has_repos: { value: user.public_repos > 0, weight: 10 },
  };

  const breakdown = {};
  let score = 0;
  for (const [key, { value, weight }] of Object.entries(checks)) {
    const earned = value ? weight : 0;
    score += earned;
    breakdown[key] = { earned, max: weight };
  }

  return { score, breakdown };
}

/**
 * Main function: derive all insights from user + repos.
 */
function computeInsights(user, repos) {
  const sixMonthsAgo = SIX_MONTHS_AGO();

  // Stars / forks
  const totalStars  = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
  const totalForks  = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
  const totalWatch  = repos.reduce((s, r) => s + (r.watchers_count || 0), 0);

  // Repo type breakdown
  const forkedRepos   = repos.filter(r => r.fork);
  const originalRepos = repos.filter(r => !r.fork);

  // Most starred
  const mostStarred = repos.reduce((best, repo) => {
    if (!best) return repo;
    return (repo.stargazers_count || 0) > (best.stargazers_count || 0) ? repo : best;
  }, null);

  // Activity
  const activeRepos = repos.filter(r => {
    const pushed = new Date(r.pushed_at);
    return pushed >= sixMonthsAgo;
  });

  // Languages & topics
  const topLanguages     = computeLanguages(repos);
  const topicsUsed       = computeTopics(repos);
  const languageDiversity = topLanguages.length;

  // Profile completeness
  const { score: profileScore, breakdown: scoreBreakdown } = computeProfileScore(user);

  // Follower ratio (meaningful signal of influence)
  const followerRatio = user.following > 0
    ? parseFloat((user.followers / user.following).toFixed(4))
    : user.followers > 0 ? user.followers : 0;

  return {
    top_languages:        topLanguages,
    language_diversity:   languageDiversity,
    total_stars_received: totalStars,
    total_forks_received: totalForks,
    total_watchers:       totalWatch,
    avg_stars_per_repo:   repos.length ? parseFloat((totalStars / repos.length).toFixed(2)) : 0,
    avg_forks_per_repo:   repos.length ? parseFloat((totalForks / repos.length).toFixed(2)) : 0,
    forked_repos_count:   forkedRepos.length,
    original_repos_count: originalRepos.length,
    most_starred_repo:    mostStarred?.name || null,
    most_starred_count:   mostStarred?.stargazers_count || 0,
    has_recent_activity:  activeRepos.length > 0,
    active_repos_count:   activeRepos.length,
    topics_used:          topicsUsed,
    profile_score:        profileScore,
    score_breakdown:      scoreBreakdown,
    follower_ratio:       followerRatio,
  };
}

module.exports = { computeInsights };
