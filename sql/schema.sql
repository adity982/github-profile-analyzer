-- ============================================================
-- GitHub Profile Analyzer - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS github_analyzer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE github_analyzer;

-- ---------------------------------------------------------------
-- Table: github_profiles
-- Stores core GitHub user profile data
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS github_profiles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(39) NOT NULL UNIQUE,   -- GitHub max username length = 39
  name            VARCHAR(255),
  bio             TEXT,
  email           VARCHAR(255),
  location        VARCHAR(255),
  company         VARCHAR(255),
  blog            VARCHAR(500),
  avatar_url      VARCHAR(500),
  github_url      VARCHAR(500),
  twitter_handle  VARCHAR(100),

  -- Core metrics
  public_repos    INT DEFAULT 0,
  public_gists    INT DEFAULT 0,
  followers       INT DEFAULT 0,
  following       INT DEFAULT 0,

  -- Account info
  github_id       BIGINT UNIQUE,
  account_type    ENUM('User','Organization') DEFAULT 'User',
  is_hireable     BOOLEAN DEFAULT FALSE,
  site_admin      BOOLEAN DEFAULT FALSE,
  account_created_at  DATETIME,

  -- Analysis timestamps
  first_analyzed_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_analyzed_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  analysis_count      INT DEFAULT 1,

  INDEX idx_username (username),
  INDEX idx_followers (followers),
  INDEX idx_public_repos (public_repos),
  INDEX idx_last_analyzed (last_analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------
-- Table: profile_insights
-- Stores computed/derived insights per analysis run
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_insights (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  profile_id            INT NOT NULL,
  analyzed_at           DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Language stats (top languages across repos)
  top_languages         JSON,              -- e.g. ["JavaScript","Python","Go"]
  language_diversity    INT DEFAULT 0,     -- number of unique languages used

  -- Repository insights
  total_stars_received  INT DEFAULT 0,
  total_forks_received  INT DEFAULT 0,
  total_watchers        INT DEFAULT 0,
  avg_stars_per_repo    DECIMAL(10,2) DEFAULT 0.00,
  avg_forks_per_repo    DECIMAL(10,2) DEFAULT 0.00,
  forked_repos_count    INT DEFAULT 0,
  original_repos_count  INT DEFAULT 0,
  most_starred_repo     VARCHAR(255),
  most_starred_count    INT DEFAULT 0,

  -- Activity signals
  has_recent_activity   BOOLEAN DEFAULT FALSE,   -- pushed within last 6 months
  active_repos_count    INT DEFAULT 0,            -- repos updated in last 6 months
  topics_used           JSON,                     -- popular topics/tags used across repos

  -- Profile completeness score (0–100)
  profile_score         INT DEFAULT 0,
  score_breakdown       JSON,             -- e.g. {"bio":20,"avatar":10,"blog":10,...}

  -- Engagement ratio (followers / following, capped insights)
  follower_ratio        DECIMAL(10,4) DEFAULT 0.0000,

  FOREIGN KEY (profile_id) REFERENCES github_profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_analyzed_at (analyzed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ---------------------------------------------------------------
-- View: profile_summary
-- Joins profiles with their latest insights for easy querying
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW profile_summary AS
SELECT
  p.id,
  p.username,
  p.name,
  p.bio,
  p.location,
  p.avatar_url,
  p.github_url,
  p.public_repos,
  p.followers,
  p.following,
  p.account_created_at,
  p.analysis_count,
  p.last_analyzed_at,
  i.top_languages,
  i.total_stars_received,
  i.total_forks_received,
  i.most_starred_repo,
  i.most_starred_count,
  i.profile_score,
  i.follower_ratio,
  i.has_recent_activity,
  i.language_diversity
FROM github_profiles p
LEFT JOIN profile_insights i
  ON i.profile_id = p.id
  AND i.id = (
    SELECT id FROM profile_insights
    WHERE profile_id = p.id
    ORDER BY analyzed_at DESC
    LIMIT 1
  );
