const { Scan, User, Article, Conversation, Knowledge } = require('../models');
const { Sequelize } = require('sequelize');
const catchAsync = require('../utils/catch-async');

/**
 * Get platform overview statistics
 */
exports.getOverview = catchAsync(async (req, res) => {
  const [totalUsers, totalScans, totalArticles, totalConversations, totalKnowledges] =
    await Promise.all([
      User.count(),
      Scan.count(),
      Article.count(),
      Conversation.count(),
      Knowledge.count(),
    ]);

  res.json({
    status: 'success',
    data: {
      stats: {
        totalUsers,
        totalScans,
        totalArticles,
        totalConversations,
        totalKnowledges,
      },
    },
  });
});

/**
 * Get platform statistics
 */
exports.getStats = catchAsync(async (req, res) => {
  // Total scans analyzed
  const totalScans = await Scan.count();

  // Average confidence (accuracy)
  const avgConfidence = await Scan.findOne({
    attributes: [[Sequelize.fn('AVG', Sequelize.col('confidence')), 'avg']],
    raw: true,
  });

  // Total unique fruit varieties detected
  const uniqueVarieties = await Scan.count({
    distinct: true,
    col: 'object_name',
    where: {
      object_name: { [Sequelize.Op.ne]: null },
    },
  });

  // Average scan processing time (estimated from createdAt intervals)
  const recentScans = await Scan.findAll({
    attributes: ['createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 100,
    raw: true,
  });

  let avgProcessingTime = 1.5; // default fallback in seconds
  if (recentScans.length > 1) {
    const intervals = [];
    for (let i = 0; i < recentScans.length - 1; i++) {
      const diff = new Date(recentScans[i].createdAt) - new Date(recentScans[i + 1].createdAt);
      if (diff < 10000) {
        intervals.push(diff / 1000);
      }
    }
    if (intervals.length > 0) {
      avgProcessingTime = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }
  }

  res.json({
    status: 'success',
    data: {
      totalScans,
      accuracy: avgConfidence?.avg ? Math.round(avgConfidence.avg * 100) : 94,
      uniqueVarieties,
      avgProcessingTime: avgProcessingTime.toFixed(1),
    },
  });
});

/**
 * Get detailed analytics
 */
exports.getAnalytics = catchAsync(async (req, res) => {
  // Scans by fruit type
  const scansByFruit = await Scan.findAll({
    attributes: ['object_name', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    where: {
      object_name: { [Sequelize.Op.ne]: null },
    },
    group: ['object_name'],
    order: [[Sequelize.literal('count'), 'DESC']],
    limit: 10,
    raw: true,
  });

  // Scans by ripeness level
  const scansByRipeness = await Scan.findAll({
    attributes: ['ripeness_level', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
    where: {
      ripeness_level: { [Sequelize.Op.ne]: null },
    },
    group: ['ripeness_level'],
    raw: true,
  });

  // Daily scan trend (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyScans = await Scan.findAll({
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('createdAt')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    where: {
      createdAt: { [Sequelize.Op.gte]: sevenDaysAgo },
    },
    group: [Sequelize.fn('DATE', Sequelize.col('createdAt'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('createdAt')), 'ASC']],
    raw: true,
  });

  res.json({
    status: 'success',
    data: {
      scansByFruit,
      scansByRipeness,
      dailyScans,
    },
  });
});
