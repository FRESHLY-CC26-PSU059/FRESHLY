const express = require('express');
const { sequelize } = require('../models');

const router = express.Router();

// Get api and database connection health status
router.get('/', async (_req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    await sequelize.authenticate();
    healthcheck.database = 'connected';
  } catch (_error) {
    healthcheck.status = 'error';
    healthcheck.database = 'disconnected';
    return res.status(503).json(healthcheck);
  }

  return res.json(healthcheck);
});

module.exports = router;
