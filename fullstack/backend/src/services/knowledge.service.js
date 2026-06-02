const { Op } = require('sequelize');
const { Knowledge } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const { sanitizeRichText, sanitizePlainText } = require('../utils/html-sanitizer');

const getKnowledges = async ({ page, limit, search, category, source, enabled }) => {
  const where = {};

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (category) where.category = category;
  if (source) where.source = source;
  if (typeof enabled === 'boolean') where.enabled = enabled;

  const queryOptions = {
    where,
    order: [['createdAt', 'DESC']],
  };

  if (limit && parseInt(limit) > 0) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit);
    queryOptions.offset = (p - 1) * l;
    queryOptions.limit = l;
  }

  const { count, rows } = await Knowledge.findAndCountAll(queryOptions);

  return {
    knowledges: rows,
    pagination: {
      total: count,
      page: (limit && parseInt(limit) > 0) ? parseInt(page) || 1 : 1,
      limit: (limit && parseInt(limit) > 0) ? parseInt(limit) : count,
      pages: (limit && parseInt(limit) > 0) ? Math.ceil(count / parseInt(limit)) : 1,
    },
  };
};

const createKnowledge = async (body) => {
  const payload = {
    source: 'manual',
    ...body,
    title: body.title ? sanitizePlainText(body.title) : body.title,
    content: body.content ? sanitizeRichText(body.content) : body.content,
    tags: body.tags ? sanitizePlainText(body.tags) : body.tags,
  };
  return Knowledge.create(payload);
};

const createFromScan = async (scan) => {
  return Knowledge.create({
    title: sanitizePlainText(`${scan.object_name || 'Unknown'} - ${scan.ripeness_level || 'Unknown'}`),
    content: sanitizeRichText(
      scan.recommendation ||
      `${scan.object_name} detected as ${scan.ripeness_level}. Consumable: ${scan.is_consumable ? 'Yes' : 'No'}.`
    ),
    category: scan.object_type || 'general',
    tags: [scan.object_name, scan.ripeness_level, scan.object_type].filter(Boolean).join(','),
    source: 'scan',
    source_id: scan.id,
    // Scan-sourced knowledge is enabled by default to feed the chatbot.
    enabled: true,
  });
};

const updateKnowledge = async (id, body) => {
  const knowledge = await Knowledge.findByPk(id);
  if (!knowledge) {
    throw new ApiError(404, 'Knowledge not found', ERROR_CODES.NOT_FOUND);
  }
  const updateData = {};
  if (body.title !== undefined) updateData.title = sanitizePlainText(body.title);
  if (body.content !== undefined) updateData.content = sanitizeRichText(body.content);
  if (body.category !== undefined) updateData.category = body.category;
  if (body.tags !== undefined) {
    updateData.tags = body.tags ? sanitizePlainText(body.tags) : body.tags;
  }
  if (body.enabled !== undefined) updateData.enabled = body.enabled;
  await knowledge.update(updateData);
  return knowledge;
};

const deleteKnowledge = async (id) => {
  const knowledge = await Knowledge.findByPk(id);
  if (!knowledge) {
    throw new ApiError(404, 'Knowledge not found', ERROR_CODES.NOT_FOUND);
  }
  await knowledge.destroy();
};

const searchRelevant = async (query, limit = 5) => {
  const keywords = query.split(/\s+/).filter((w) => w.length > 2);
  if (keywords.length === 0) return [];

  const conditions = keywords.map((kw) => ({
    [Op.or]: [
      { title: { [Op.iLike]: `%${kw}%` } },
      { content: { [Op.iLike]: `%${kw}%` } },
      { tags: { [Op.iLike]: `%${kw}%` } },
    ],
  }));

  return Knowledge.findAll({
    where: { enabled: true, [Op.or]: conditions },
    order: [['createdAt', 'DESC']],
    limit,
    attributes: ['title', 'content', 'category', 'tags'],
  });
};

module.exports = {
  getKnowledges,
  createKnowledge,
  createFromScan,
  updateKnowledge,
  deleteKnowledge,
  searchRelevant,
};
