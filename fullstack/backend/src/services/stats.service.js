const { Op, fn, col, literal } = require('sequelize');
const { User, Scan, Article, Conversation, Knowledge } = require('../models');

const getOverview = async () => {
  const [totalUsers, totalScans, totalArticles, totalConversations, totalKnowledges] =
    await Promise.all([
      User.count(),
      Scan.count(),
      Article.count({ where: { published: true } }),
      Conversation.count(),
      Knowledge.count(),
    ]);

  return { totalUsers, totalScans, totalArticles, totalConversations, totalKnowledges };
};

const getScanStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [scansPerDay, topObjects, ripenessDistribution, consumableCount, notConsumableCount] =
    await Promise.all([
      Scan.findAll({
        where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
        attributes: [
          [fn('DATE', col('createdAt')), 'date'],
          [fn('COUNT', col('id')), 'count'],
        ],
        group: [fn('DATE', col('createdAt'))],
        order: [[fn('DATE', col('createdAt')), 'ASC']],
        raw: true,
      }),
      Scan.findAll({
        attributes: ['object_name', [fn('COUNT', col('id')), 'count']],
        where: { object_name: { [Op.ne]: null } },
        group: ['object_name'],
        order: [[fn('COUNT', col('id')), 'DESC']],
        limit: 10,
        raw: true,
      }),
      Scan.findAll({
        attributes: ['ripeness_level', [fn('COUNT', col('id')), 'count']],
        where: { ripeness_level: { [Op.ne]: null } },
        group: ['ripeness_level'],
        raw: true,
      }),
      Scan.count({ where: { is_consumable: true } }),
      Scan.count({ where: { is_consumable: false } }),
    ]);

  return {
    scansPerDay,
    topObjects,
    ripenessDistribution,
    consumableRatio: {
      consumable: consumableCount,
      notConsumable: notConsumableCount,
      total: consumableCount + notConsumableCount,
    },
  };
};

module.exports = { getOverview, getScanStats };
