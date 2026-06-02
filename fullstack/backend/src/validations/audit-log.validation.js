const Joi = require('joi');

const getLogs = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(0).max(200).default(20),
    search: Joi.string().allow('').max(200),
    entity: Joi.string().allow('').max(50),
    action: Joi.string().allow('').max(50),
    userId: Joi.number().integer(),
    sortBy: Joi.string().valid('createdAt', 'action', 'entity').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),
  }),
};

module.exports = { getLogs };
