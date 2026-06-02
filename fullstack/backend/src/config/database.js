const { Sequelize } = require('sequelize');
const config = require('./env');
const logger = require('./logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: config.env === 'production' ? 2 : 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: { max: 3 },
});

module.exports = sequelize;
