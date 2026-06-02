const Joi = require('joi');
const { SCAN } = require('../config/constants');

const analyzeScan = {
  body: Joi.object().keys({
    fruit_type: Joi.string()
      .valid(...SCAN.FRUIT_TYPES)
      .required()
      .messages({
        'any.only': `fruit_type must be one of: ${SCAN.FRUIT_TYPES.join(', ')}`,
        'any.required': 'fruit_type is required',
      }),
  }),
};

const getScans = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').max(100),
    object_type: Joi.string().valid('fruit', 'vegetable').allow(''),
  }),
};

const getScan = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

const deleteScan = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

module.exports = { analyzeScan, getScans, getScan, deleteScan };
