const catchAsync = require('../utils/catch-async');
const articleService = require('../services/article.service');
const auditLog = require('../services/audit-log.service');
const { AVAILABLE_GEMINI_MODELS, DEFAULT_GEMINI_MODEL } = require('../config/ai');

const getArticles = catchAsync(async (req, res) => {
  const result = await articleService.getArticles(req.query);
  res.json({ status: 'success', data: result.articles, pagination: result.pagination });
});

const getArticle = catchAsync(async (req, res) => {
  const article = await articleService.getArticleBySlug(req.params.slug);
  res.json({ status: 'success', data: { article } });
});

const getArticleById = catchAsync(async (req, res) => {
  const article = await articleService.getArticleById(req.params.id);
  res.json({ status: 'success', data: { article } });
});

const createArticle = catchAsync(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const article = await articleService.createArticle(req.user.id, req.body, imageBuffer);

  await auditLog.log({
    userId: req.user.id,
    action: 'create',
    entity: 'article',
    entityId: article.id,
    details: `Published article: ${article.title}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ status: 'success', data: { article } });
});

const updateArticle = catchAsync(async (req, res) => {
  const imageBuffer = req.file ? req.file.buffer : null;
  const article = await articleService.updateArticle(req.params.id, req.body, imageBuffer);

  await auditLog.log({
    userId: req.user.id,
    action: 'update',
    entity: 'article',
    entityId: parseInt(req.params.id),
    details: `Updated article: ${article.title}`,
    ipAddress: req.ip,
  });

  res.json({ status: 'success', data: { article } });
});

const deleteArticle = catchAsync(async (req, res) => {
  await articleService.deleteArticle(req.params.id);

  await auditLog.log({
    userId: req.user.id,
    action: 'delete',
    entity: 'article',
    entityId: parseInt(req.params.id),
    details: `Deleted article #${req.params.id}`,
    ipAddress: req.ip,
  });

  res.status(204).send();
});

const generateArticle = catchAsync(async (req, res) => {
  const result = await articleService.generateArticle(req.body.topic, req.body.category, req.body.model || null);
  res.json({ status: 'success', data: result });
});

const getAvailableModels = catchAsync(async (_req, res) => {
  res.json({
    status: 'success',
    data: {
      models: AVAILABLE_GEMINI_MODELS,
      default: DEFAULT_GEMINI_MODEL,
    },
  });
});

module.exports = { getArticles, getArticle, getArticleById, createArticle, updateArticle, deleteArticle, generateArticle, getAvailableModels };
