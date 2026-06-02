const Joi = require('joi');

const getTestimonials = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    is_displayed: Joi.string().valid('true', 'false'),
  }),
};

const getPublicTestimonials = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

const createTestimonial = {
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    message: Joi.string().required().min(10).max(1000),
  }),
};

const updateTestimonial = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5),
    message: Joi.string().min(10).max(1000),
    is_displayed: Joi.boolean(),
  }),
};

const updateDisplay = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  body: Joi.object().keys({
    is_displayed: Joi.boolean().required(),
  }),
};

const deleteTestimonial = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

module.exports = {
  getTestimonials,
  getPublicTestimonials,
  createTestimonial,
  updateTestimonial,
  updateDisplay,
  deleteTestimonial,
};
