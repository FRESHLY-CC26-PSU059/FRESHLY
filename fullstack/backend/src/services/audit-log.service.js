const { Op } = require('sequelize');
const { AuditLog, User } = require('../models');
const logger = require('../config/logger');

/**
 * Log an action. Call this from controllers/services after mutations.
 * @param {object} params
 * @param {number} [params.userId]
 * @param {string} params.action - e.g. 'create', 'update', 'delete', 'login'
 * @param {string} params.entity - e.g. 'user', 'article', 'role', 'scan'
 * @param {number} [params.entityId]
 * @param {string} [params.details]
 * @param {string} [params.ipAddress]
 */
const log = async ({ userId, action, entity, entityId, details, ipAddress }) => {
  try {
    await AuditLog.create({
      user_id: userId || null,
      action,
      entity,
      entity_id: entityId || null,
      details: details || null,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    // Audit logging should never break the main flow
    logger.error('Audit log error: %s', err.message);
  }
};

const getLogs = async ({ page, limit, search, entity, action, userId, sortBy, sortOrder }) => {
  const where = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (userId) where.user_id = userId;

  if (search) {
    where[Op.or] = [
      { details: { [Op.iLike]: `%${search}%` } },
      { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
      { '$user.last_name$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  const allowedSortBy = ['createdAt', 'action', 'entity'];
  const column = allowedSortBy.includes(sortBy) ? sortBy : 'createdAt';
  const direction = String(sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const MAX_LIMIT = 200;
  const parsedLimit = limit && parseInt(limit) > 0
    ? Math.min(parseInt(limit), MAX_LIMIT)
    : 100;
  const parsedPage = parseInt(page) || 1;

  const queryOptions = {
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }],
    order: [[column, direction]],
    offset: (parsedPage - 1) * parsedLimit,
    limit: parsedLimit,
  };

  const { count, rows } = await AuditLog.findAndCountAll(queryOptions);

  return {
    logs: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(count / parsedLimit),
    },
  };
};

module.exports = { log, getLogs };
