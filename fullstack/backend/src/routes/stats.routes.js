const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');
const auth = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/stats
 * @desc    Get basic platform statistics (for landing page)
 * @access  Public — only exposes aggregate counts, no sensitive data
 */
router.get('/', statsController.getStats);

/**
 * @route   GET /api/stats/overview
 * @desc    Get platform overview statistics (user counts, etc.)
 * @access  Admin only
 */
router.get('/overview', auth('admin', 'super_admin'), statsController.getOverview);

/**
 * @route   GET /api/stats/analytics
 * @desc    Get detailed analytics (scan breakdowns, trends)
 * @access  Admin only
 */
router.get('/analytics', auth('admin', 'super_admin'), statsController.getAnalytics);

module.exports = router;
