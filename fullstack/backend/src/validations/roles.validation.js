const Joi = require('joi');

const getRoles = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(0).default(10),
    search: Joi.string().allow('').max(200),
  }),
};

const getRole = {
  params: Joi.object().keys({
    roleId: Joi.number().integer().required(),
  }),
};

const createRole = {
  body: Joi.object().keys({
    role_name: Joi.string()
      .required()
      .min(2)
      .max(60)
      .pattern(/^[a-z][a-z0-9_]*$/)
      .messages({
        'string.pattern.base': 'Role name must be lowercase, start with a letter, and contain only letters, numbers, and underscores',
      }),
    enabled: Joi.boolean().default(true),
  }),
};

const updateRole = {
  params: Joi.object().keys({
    roleId: Joi.number().integer().required(),
  }),
  body: Joi.object()
    .keys({
      role_name: Joi.string()
        .min(2)
        .max(60)
        .pattern(/^[a-z][a-z0-9_]*$/)
        .messages({
          'string.pattern.base': 'Role name must be lowercase, start with a letter, and contain only letters, numbers, and underscores',
        }),
      enabled: Joi.boolean(),
    })
    .min(1),
};

const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.number().integer().required(),
  }),
};

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole };
