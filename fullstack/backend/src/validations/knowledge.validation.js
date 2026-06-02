const Joi = require('joi');

const getKnowledges = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(0).default(10),
    search: Joi.string().allow('').max(200),
    category: Joi.string().allow('').max(50),
    source: Joi.string().valid('manual', 'scan', 'chat').allow(''),
    enabled: Joi.boolean(),
  }),
};

const createKnowledge = {
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
    content: Joi.string().required(),
    category: Joi.string().max(50).allow(''),
    tags: Joi.string().max(255).allow(''),
    enabled: Joi.boolean().default(true),
  }),
};

const updateKnowledge = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().max(200),
      content: Joi.string(),
      category: Joi.string().max(50).allow(''),
      tags: Joi.string().max(255).allow(''),
      enabled: Joi.boolean(),
    })
    .min(1),
};

const deleteKnowledge = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

module.exports = { getKnowledges, createKnowledge, updateKnowledge, deleteKnowledge };
