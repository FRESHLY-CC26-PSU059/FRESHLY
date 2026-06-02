const Joi = require('joi');

const getFeedbacks = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
  }),
};

const createFeedback = {
  body: Joi.object().keys({
    name: Joi.string().required().max(120),
    email: Joi.string().email({ tlds: { allow: false } }).max(120).allow('', null),
    message: Joi.string().required().max(2000),
    rating: Joi.number().integer().min(1).max(5),
  }),
};

const updateStatus = {
  params: Joi.object().keys({ id: Joi.number().integer().required() }),
  body: Joi.object().keys({
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
  }),
};

const deleteFeedback = {
  params: Joi.object().keys({ id: Joi.number().integer().required() }),
};

module.exports = { getFeedbacks, createFeedback, updateStatus, deleteFeedback };
