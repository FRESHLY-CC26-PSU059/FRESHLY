const Joi = require('joi');

const getArticles = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(0).default(10),
    search: Joi.string().allow('').max(200),
    category: Joi.string().valid('fruit', 'vegetable', 'tips', 'storage', 'nutrition', 'encyclopedia').allow(''),
    tag: Joi.string().allow('').max(50),
    published: Joi.string().valid('true', 'false', 'all').default('true'),
  }),
};

const getArticle = {
  params: Joi.object().keys({
    slug: Joi.string().required(),
  }),
};

const getArticleById = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

const createArticle = {
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
    content: Joi.string().required().max(500000), // Tiptap HTML content
    excerpt: Joi.string().max(500).allow(''),
    category: Joi.string().valid('fruit', 'vegetable', 'tips', 'storage', 'nutrition', 'encyclopedia').allow(''),
    tags: Joi.string().max(255).allow(''),
    published: Joi.boolean().default(false),
    image_url: Joi.string().max(255).allow(null, ''),
  }),
};

const updateArticle = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().max(200),
      content: Joi.string().max(500000), // Tiptap HTML content
      excerpt: Joi.string().max(500).allow(''),
      category: Joi.string().valid('fruit', 'vegetable', 'tips', 'storage', 'nutrition', 'encyclopedia').allow(''),
      tags: Joi.string().max(255).allow(''),
      published: Joi.boolean(),
      image_url: Joi.string().max(255).allow(null, ''),
    })
    .min(1),
};

const deleteArticle = {
  params: Joi.object().keys({
    id: Joi.number().integer().required(),
  }),
};

const generateArticle = {
  body: Joi.object().keys({
    topic: Joi.string().required().max(200),
    category: Joi.string().valid('fruit', 'vegetable', 'tips', 'storage', 'nutrition', 'encyclopedia').allow('').default(''),
  }),
};

module.exports = { getArticles, getArticle, getArticleById, createArticle, updateArticle, deleteArticle, generateArticle };
