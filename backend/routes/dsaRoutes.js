const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const dsa = require('../controllers/dsaController');

// Public (optional auth to include user progress)
router.get('/sheets',          optionalAuth, dsa.getSheets);
router.get('/sheets/:slug',    optionalAuth, dsa.getSheetBySlug);
router.get('/search',          optionalAuth, dsa.searchProblems);
router.get('/topics',                        dsa.getTopics);
router.get('/companies',                     dsa.getCompanies);
router.get('/roadmaps',                      dsa.getRoadmaps);
router.get('/contests',        optionalAuth, dsa.getContests);
router.get('/contests/:slug/leaderboard', optionalAuth, dsa.getContestLeaderboard);

// Auth required
router.get('/progress',                 protect, dsa.getUserProgress);
router.post('/bookmark/:problemId',     protect, dsa.toggleBookmark);
router.get('/bookmarks',                protect, dsa.getBookmarks);
router.get('/recommendations',          protect, dsa.getRecommendations);
router.get('/contests/:slug',           protect, dsa.getContestDetail);

module.exports = router;
