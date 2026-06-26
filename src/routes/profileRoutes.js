const express = require('express');
const router  = express.Router();
const {
  analyzeProfile,
  listProfiles,
  getProfile,
  removeProfile,
  checkRateLimit,
} = require('../controllers/profileController');

// ── Profile Routes ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/profiles/analyze/:username
 * @desc    Fetch from GitHub, compute insights, store in DB
 * @access  Public
 */
router.post('/profiles/analyze/:username', analyzeProfile);

/**
 * @route   GET /api/profiles
 * @desc    List all stored profiles
 * @query   page, limit, search, sortBy, order
 * @access  Public
 */
router.get('/profiles', listProfiles);

/**
 * @route   GET /api/profiles/:username
 * @desc    Get a single stored profile with insights + history
 * @access  Public
 */
router.get('/profiles/:username', getProfile);

/**
 * @route   DELETE /api/profiles/:username
 * @desc    Remove a profile from the database
 * @access  Public
 */
router.delete('/profiles/:username', removeProfile);

// ── GitHub Utility Routes ────────────────────────────────────────────────────

/**
 * @route   GET /api/github/rate-limit
 * @desc    Check GitHub API rate limit status
 * @access  Public
 */
router.get('/github/rate-limit', checkRateLimit);

module.exports = router;
