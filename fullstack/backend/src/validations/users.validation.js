const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .max(255)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
  .messages({
    'string.pattern.base':
      'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character (@$!%*?&)',
  });

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(0).default(20),
    search: Joi.string().allow('').max(200),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.number().integer().required(),
  }),
};

const createUser = {
  body: Joi.object().keys({
    first_name: Joi.string().required().max(60),
    last_name: Joi.string().required().max(60),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .max(120),
    password: passwordSchema.required(),
    role_name: Joi.string().valid('user', 'admin', 'super_admin').default('user'),
    phone: Joi.string().max(20).allow(null, ''),
    gender: Joi.string().max(10).allow(null, ''),
    address: Joi.string().max(255).allow(null, ''),
    birthdate: Joi.date().iso().allow(null, ''),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.number().integer().required(),
  }),
  body: Joi.object()
    .keys({
      first_name: Joi.string().max(60),
      last_name: Joi.string().max(60),
      phone: Joi.string().max(20).allow(null, ''),
      gender: Joi.string().max(10).allow(null, ''),
      address: Joi.string().max(255).allow(null, ''),
      birthdate: Joi.date().iso().allow(null, ''),
      isActive: Joi.boolean(),
      role_name: Joi.string().valid('user', 'admin', 'super_admin'),
    })
    .min(1),
};

const updateMe = {
  body: Joi.object()
    .keys({
      first_name: Joi.string().max(60),
      last_name: Joi.string().max(60),
      phone: Joi.string().max(20).allow(null, ''),
      gender: Joi.string().max(10).allow(null, ''),
      address: Joi.string().max(255).allow(null, ''),
      birthdate: Joi.date().iso().allow(null, ''),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.number().integer().required(),
  }),
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, updateMe };
