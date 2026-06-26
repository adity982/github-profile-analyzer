const { pool } = require('../config/database');

/**
 * Upsert a GitHub profile and insert a new insights snapshot.
 * Returns the saved profile row.
 */
async function upsertProfile(userData, insights) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // --- Upsert github_profiles ---
    const profileSQL = `
      INSERT INTO github_profiles (
        username, name, bio, email, location, company, blog,
        avatar_url, github_url, twitter_handle,
        public_repos, public_gists, followers, following,
        github_id, account_type, is_hireable, site_admin, account_created_at,
        first_analyzed_at, last_analyzed_at, analysis_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 1)
      ON DUPLICATE KEY UPDATE
        name              = VALUES(name),
        bio               = VALUES(bio),
        email             = VALUES(email),
        location          = VALUES(location),
        company           = VALUES(company),
        blog              = VALUES(blog),
        avatar_url        = VALUES(avatar_url),
        github_url        = VALUES(github_url),
        twitter_handle    = VALUES(twitter_handle),
        public_repos      = VALUES(public_repos),
        public_gists      = VALUES(public_gists),
        followers         = VALUES(followers),
        following         = VALUES(following),
        is_hireable       = VALUES(is_hireable),
        site_admin        = VALUES(site_admin),
        last_analyzed_at  = NOW(),
        analysis_count    = analysis_count + 1
    `;

    const profileValues = [
      userData.login,
      userData.name || null,
      userData.bio || null,
      userData.email || null,
      userData.location || null,
      userData.company || null,
      userData.blog || null,
      userData.avatar_url || null,
      userData.html_url || null,
      userData.twitter_username || null,
      userData.public_repos || 0,
      userData.public_gists || 0,
      userData.followers || 0,
      userData.following || 0,
      userData.id,
      userData.type || 'User',
      userData.hireable ? 1 : 0,
      userData.site_admin ? 1 : 0,
      userData.created_at ? new Date(userData.created_at) : null,
    ];

    const [profileResult] = await conn.execute(profileSQL, profileValues);

    // Get the profile id (insertId for new row, else query for existing)
    let profileId = profileResult.insertId;
    if (!profileId) {
      const [rows] = await conn.execute(
        'SELECT id FROM github_profiles WHERE username = ?',
        [userData.login]
      );
      profileId = rows[0].id;
    }

    // --- Insert profile_insights ---
    const insightSQL = `
      INSERT INTO profile_insights (
        profile_id, analyzed_at,
        top_languages, language_diversity,
        total_stars_received, total_forks_received, total_watchers,
        avg_stars_per_repo, avg_forks_per_repo,
        forked_repos_count, original_repos_count,
        most_starred_repo, most_starred_count,
        has_recent_activity, active_repos_count, topics_used,
        profile_score, score_breakdown, follower_ratio
      ) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insightValues = [
      profileId,
      JSON.stringify(insights.top_languages),
      insights.language_diversity,
      insights.total_stars_received,
      insights.total_forks_received,
      insights.total_watchers,
      insights.avg_stars_per_repo,
      insights.avg_forks_per_repo,
      insights.forked_repos_count,
      insights.original_repos_count,
      insights.most_starred_repo || null,
      insights.most_starred_count,
      insights.has_recent_activity ? 1 : 0,
      insights.active_repos_count,
      JSON.stringify(insights.topics_used),
      insights.profile_score,
      JSON.stringify(insights.score_breakdown),
      insights.follower_ratio,
    ];

    await conn.execute(insightSQL, insightValues);
    await conn.commit();

    return { profileId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get all analyzed profiles with their latest insights.
 * Supports pagination + optional search by username.
 */
async function getAllProfiles({ page = 1, limit = 20, search = '', sortBy = 'last_analyzed_at', order = 'DESC' }) {
  const offset = (page - 1) * limit;

  const allowedSort = ['followers', 'public_repos', 'total_stars_received', 'profile_score', 'last_analyzed_at', 'username'];
  const allowedOrder = ['ASC', 'DESC'];
  const safeSort  = allowedSort.includes(sortBy) ? sortBy : 'last_analyzed_at';
  const safeOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  const searchClause = search ? 'WHERE username LIKE ?' : '';
  const params = search ? [`%${search}%`] : [];

  const [rows] = await pool.query(
    `SELECT * FROM profile_summary ${searchClause} ORDER BY ${safeSort} ${safeOrder} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
    params
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM github_profiles ${searchClause}`,
    params
  );

  return { profiles: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * Get a single profile with its full latest insights.
 */
async function getProfileByUsername(username) {
  const [rows] = await pool.execute(
    `SELECT * FROM profile_summary WHERE username = ?`,
    [username]
  );
  if (!rows.length) return null;

  // Also pull insights history (last 10 snapshots)
  const [history] = await pool.execute(
    `SELECT analyzed_at, total_stars_received, total_forks_received,
            profile_score, follower_ratio, language_diversity, active_repos_count
     FROM profile_insights pi
     JOIN github_profiles gp ON gp.id = pi.profile_id
     WHERE gp.username = ?
     ORDER BY analyzed_at DESC LIMIT 10`,
    [username]
  );

  return { ...rows[0], analysis_history: history };
}

/**
 * Delete a profile (and cascade-delete insights).
 */
async function deleteProfile(username) {
  const [result] = await pool.execute(
    'DELETE FROM github_profiles WHERE username = ?',
    [username]
  );
  return result.affectedRows > 0;
}

module.exports = { upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile };