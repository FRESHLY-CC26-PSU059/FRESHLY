const { Op } = require('sequelize');
const slugify = require('slugify');
const { Article, User } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const { saveImage, deleteImage } = require('../utils/image');
const { sanitizeRichText, sanitizePlainText } = require('../utils/html-sanitizer');
const logger = require('../config/logger');
const { getModel, getModelByName } = require('../config/ai');
const { AI } = require('../config/constants');

const generateSlug = async (title) => {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let attempt = 0;
  while (await Article.findOne({ where: { slug } })) {
    attempt++;
    slug = `${base}-${Date.now()}-${attempt}`;
  }
  return slug;
};

const getArticles = async ({ page, limit, search, category, tag, published }) => {
  const where = {};

  if (published === 'all') {
    // No filter — return both published and draft
  } else if (published === 'false') {
    where.published = false;
  } else {
    where.published = true;
  }

  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }
  if (category) {
    where.category = category;
  }
  if (tag) {
    where.tags = { [Op.iLike]: `%${tag}%` };
  }

  const queryOptions = {
    where,
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['content'] },
    include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name'] }],
  };

  if (limit && parseInt(limit) > 0) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit);
    queryOptions.offset = (p - 1) * l;
    queryOptions.limit = l;
  }

  const { count, rows } = await Article.findAndCountAll(queryOptions);

  return {
    articles: rows,
    pagination: {
      total: count,
      page: (limit && parseInt(limit) > 0) ? parseInt(page) || 1 : 1,
      limit: (limit && parseInt(limit) > 0) ? parseInt(limit) : count,
      pages: (limit && parseInt(limit) > 0) ? Math.ceil(count / parseInt(limit)) : 1,
    },
  };
};

const getArticleBySlug = async (slug) => {
  const article = await Article.findOne({
    where: { slug, published: true },
    include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name'] }],
  });
  if (!article) {
    throw new ApiError(404, 'Article not found', ERROR_CODES.NOT_FOUND);
  }
  return article;
};

const createArticle = async (authorId, body, imageBuffer) => {
  const slug = await generateSlug(body.title);
  let imageUrl = null;

  if (imageBuffer) {
    imageUrl = await saveImage(imageBuffer, 'articles');
  } else if (body.image_url) {
    imageUrl = body.image_url;
  }

  const payload = {
    title: sanitizePlainText(body.title),
    content: sanitizeRichText(body.content),
    excerpt: body.excerpt ? sanitizePlainText(body.excerpt) : body.excerpt,
    category: body.category,
    tags: body.tags ? sanitizePlainText(body.tags) : body.tags,
    published: body.published,
  };

  const article = await Article.create({
    ...payload,
    slug,
    image_url: imageUrl,
    author_id: authorId,
  });

  return article;
};

const updateArticle = async (articleId, body, imageBuffer) => {
  const article = await Article.findByPk(articleId);
  if (!article) {
    throw new ApiError(404, 'Article not found', ERROR_CODES.NOT_FOUND);
  }

  const updateData = {};
  if (body.title !== undefined) updateData.title = sanitizePlainText(body.title);
  if (body.content !== undefined) updateData.content = sanitizeRichText(body.content);
  if (body.excerpt !== undefined) {
    updateData.excerpt = body.excerpt ? sanitizePlainText(body.excerpt) : body.excerpt;
  }
  if (body.category !== undefined) updateData.category = body.category;
  if (body.tags !== undefined) {
    updateData.tags = body.tags ? sanitizePlainText(body.tags) : body.tags;
  }
  if (body.published !== undefined) updateData.published = body.published;

  if (updateData.title && updateData.title !== article.title) {
    updateData.slug = await generateSlug(updateData.title);
  }

  if (imageBuffer) {
    await deleteImage(article.image_url);
    updateData.image_url = await saveImage(imageBuffer, 'articles');
  } else if (body.image_url !== undefined) {
    if (body.image_url !== article.image_url) {
      await deleteImage(article.image_url);
    }
    updateData.image_url = body.image_url || null;
  }

  await article.update(updateData);
  return article;
};

const deleteArticle = async (articleId) => {
  const article = await Article.findByPk(articleId);
  if (!article) {
    throw new ApiError(404, 'Article not found', ERROR_CODES.NOT_FOUND);
  }
  await deleteImage(article.image_url);
  await article.destroy();
};

const getArticleById = async (articleId) => {
  const article = await Article.findByPk(articleId, {
    include: [{ model: User, as: 'author', attributes: ['id', 'first_name', 'last_name'] }],
  });
  if (!article) {
    throw new ApiError(404, 'Article not found', ERROR_CODES.NOT_FOUND);
  }
  return article;
};

const generateArticle = async (topic, category = '', modelId = null) => {
  const model = modelId ? getModelByName(modelId) : getModel();
  const prompt = AI.ARTICLE_GENERATOR_PROMPT
    .replace('{{topic}}', topic)
    .replace('{{category}}', category || 'Umum');

  logger.info(`[Article Service] Requesting Gemini (model: ${modelId || 'default'}) to generate article on: ${topic}`);
  const aiRes = await model.generateContent(prompt);
  const responseText = aiRes.response.text();
  
  let cleanJson = responseText.trim();
  if (cleanJson.includes('```json')) {
    cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
  } else if (cleanJson.includes('```')) {
    cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
  }

  let articleData;
  try {
    articleData = JSON.parse(cleanJson);
  } catch {
    logger.error(`[Article Service] Failed to parse JSON from Gemini response: ${responseText}`);
    throw new ApiError(500, 'Gagal menguraikan artikel yang di-generate oleh AI. Silakan coba lagi.', ERROR_CODES.INTERNAL_SERVER_ERROR);
  }

  const title = sanitizePlainText(articleData.title || articleData.judul || articleData.name || `Artikel tentang ${topic}`);
  const excerpt = sanitizePlainText(articleData.excerpt || articleData.ringkasan || articleData.summary || `Ringkasan untuk topik ${topic}`);
  const content = sanitizeRichText(articleData.content || articleData.konten || articleData.body || `<p>Artikel tentang ${topic} sedang dalam proses.</p>`);

  return {
    title,
    excerpt,
    content,
    category: category || 'encyclopedia',
    image_url: null,
  };
};

module.exports = { getArticles, getArticleBySlug, getArticleById, createArticle, updateArticle, deleteArticle, generateArticle };
