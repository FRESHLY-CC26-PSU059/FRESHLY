// Load environment variables FIRST - before anything else
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
}

const app = require('./app');
const config = require('./config/env');
const logger = require('./config/logger');
const { sequelize } = require('./models');
const { cleanupExpiredTokens, startTokenCleanupSchedule } = require('./utils/token-cleanup');

let server;

const SHUTDOWN_TIMEOUT = 30000;

const connectWithRetry = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('Connected to PostgreSQL successfully');
      return;
    } catch (err) {
      logger.error(`Database connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw err;
      }
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const startServer = async () => {
  try {
    await connectWithRetry();
    server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} [${config.env}]`);
    });

    // Cleanup expired tokens on startup + schedule periodic cleanup
    await cleanupExpiredTokens();
    startTokenCleanupSchedule();
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await sequelize.close();
        logger.info('Database connections closed');
      } catch (err) {
        logger.error('Error closing database connections:', err);
      }
      clearTimeout(forceExit);
      process.exit(0);
    });
  } else {
    clearTimeout(forceExit);
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Exit immediately on programming errors — orchestrator will restart.
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();
