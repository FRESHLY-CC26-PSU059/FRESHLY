const { Op } = require('sequelize');
const { Token } = require('../models');
const logger = require('../config/logger');

const cleanupExpiredTokens = async () => {
  try {
    const deleted = await Token.destroy({
      where: {
        expires: { [Op.lt]: new Date() },
      },
    });
    if (deleted > 0) {
      logger.info(`Cleaned up ${deleted} expired token(s)`);
    }
    return deleted;
  } catch (err) {
    logger.error(`Token cleanup failed: ${err.message}`);
    return 0;
  }
};

// Run cleanup every 6 hours
const startTokenCleanupSchedule = () => {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  setInterval(cleanupExpiredTokens, SIX_HOURS);
  logger.info('Token cleanup scheduled (every 6 hours)');
};

module.exports = { cleanupExpiredTokens, startTokenCleanupSchedule };
