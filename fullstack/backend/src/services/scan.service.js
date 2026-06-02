const { Op } = require('sequelize');
const { Scan } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const { saveImage, deleteImage } = require('../utils/image');
const knowledgeService = require('./knowledge.service');
const mlClient = require('../config/ml');
const config = require('../config/env');
const FormData = require('form-data');
const logger = require('../config/logger');
const { getModel } = require('../config/ai');
const { SCAN, AI } = require('../config/constants');

const MOCK_RESPONSE = {
  fruit_type: SCAN.FRUIT_TYPES[0],
  predicted_class: `${SCAN.FRUIT_TYPES[0]}_${SCAN.RIPENESS_LEVELS.RIPE}`,
  confidence: 95.5,
  all_probabilities: {
    [`${SCAN.FRUIT_TYPES[0]}_${SCAN.RIPENESS_LEVELS.RIPE}`]: 95.5,
    [`${SCAN.FRUIT_TYPES[0]}_${SCAN.RIPENESS_LEVELS.ROTTEN}`]: 2.5,
    [`${SCAN.FRUIT_TYPES[0]}_${SCAN.RIPENESS_LEVELS.UNRIPE}`]: 2.0
  }
};

const analyzeScan = async (userId, imageBuffer, fruitType, mimetype = 'image/jpeg') => {
  // Call ML API FIRST, save image only on success (prevents orphan files)
  let mlResult;
  if (config.ml.mock) {
    mlResult = { ...MOCK_RESPONSE };
  } else {
    try {
      const form = new FormData();
      const extension = mimetype.split('/')[1] || 'jpg';
      form.append('file', imageBuffer, { filename: `scan.${extension}`, contentType: mimetype });
      if (fruitType) {
        form.append('fruit_type', fruitType);
      }

      const response = await mlClient.post('/predict', form, {
        headers: form.getHeaders(),
      });
      mlResult = response.data;
    } catch (error) {
      const mlStatus = error.response?.status;
      const mlData = error.response?.data;
      logger.error('ML API call failed', {
        code: error.code,
        status: mlStatus,
        message: error.message,
        mlResponse: mlData ? JSON.stringify(mlData).slice(0, 500) : undefined,
        url: config.ml.apiUrl,
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new ApiError(503, 'Analysis service unavailable. Please try again later.', ERROR_CODES.SERVICE_UNAVAILABLE);
      }
      if (error.code === 'ECONNABORTED') {
        throw new ApiError(504, 'Analysis service timeout. Please try again.', ERROR_CODES.SERVICE_UNAVAILABLE);
      }
      const detail = mlData?.detail || mlData?.message || error.message || 'Unknown ML error';
      throw new ApiError(502, `Analysis service error: ${detail}`, ERROR_CODES.INTERNAL_ERROR);
    }
  }

  // ML succeeded — now safe to save image
  const imageUrl = await saveImage(imageBuffer, 'scans');

  // Limit raw_response size to prevent storage bloat (max 10KB)
  let rawResponse = mlResult;
  const rawStr = JSON.stringify(mlResult);
  if (rawStr.length > 10240) {
    rawResponse = {
      _truncated: true,
      predicted_class: mlResult.predicted_class,
      fruit_type: mlResult.fruit_type,
    };
  }

  // Map ML API response to Database model
  const predictedClass = mlResult.predicted_class || '';
  const allRipenessValues = Object.values(SCAN.RIPENESS_LEVELS);
  let ripenessLevel = SCAN.DEFAULT_RIPENESS;
  if (predictedClass.includes('_')) {
    const extracted = predictedClass.split('_').pop();
    ripenessLevel = allRipenessValues.includes(extracted) ? extracted : SCAN.DEFAULT_RIPENESS;
  }

  const isConsumable = !SCAN.UNCONSUMABLE_LEVELS.includes(ripenessLevel);

  // Call Gemini AI for rich summary/recommendation
  let aiRecommendation = `Ini adalah ${mlResult.fruit_type || fruitType} dengan tingkat kematangan ${ripenessLevel}.`;
  try {
    const model = getModel();
    const safeFruitType = String(mlResult.fruit_type || fruitType || '').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50);
    const prompt = AI.AGRONOMIST_PROMPT
      .replace('{{fruitType}}', safeFruitType)
      .replace('{{ripenessLevel}}', ripenessLevel)
      .replace('{{isConsumable}}', isConsumable ? 'Layak' : 'Tidak Layak/Perlu Perhatian')
      .replace('{{confidence}}', (mlResult.confidence || 0).toFixed(1));

    const aiRes = await model.generateContent(prompt);
    const text = aiRes.response.text();
    if (text) {
      aiRecommendation = text.trim();
    }
  } catch (err) {
    logger.warn(`Gemini AI failed to generate summary: ${err.message}`);
  }

  const scan = await Scan.create({
    user_id: userId,
    image_url: imageUrl,
    object_type: 'fruit',
    object_name: mlResult.fruit_type || fruitType || null,
    ripeness_level: ripenessLevel,
    is_consumable: isConsumable,
    recommendation: aiRecommendation,
    confidence: mlResult.confidence ? mlResult.confidence / 100 : null, // ML API returns 0-100, we store 0-1
    raw_response: rawResponse,
  });

  // Auto-collect knowledge from scan result
  try {
    await knowledgeService.createFromScan(scan);
  } catch (err) {
    logger.warn(`Failed to auto-collect knowledge from scan ${scan.id}: ${err.message}`);
  }

  return scan;
};

const getUserScans = async (userId, { page = 1, limit = 10, search, object_type }) => {
  const where = { user_id: userId };

  if (search) {
    where.object_name = { [Op.iLike]: `%${search}%` };
  }
  if (object_type) {
    where.object_type = object_type;
  }

  const offset = (page - 1) * limit;
  const { count, rows } = await Scan.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['raw_response'] },
  });

  return {
    scans: rows,
    pagination: {
      page,
      limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const getScanById = async (scanId, userId) => {
  const scan = await Scan.findOne({ where: { id: scanId, user_id: userId } });
  if (!scan) {
    throw new ApiError(404, 'Scan not found', ERROR_CODES.NOT_FOUND);
  }
  return scan;
};

const deleteScan = async (scanId, userId) => {
  const scan = await getScanById(scanId, userId);
  await deleteImage(scan.image_url);
  await scan.destroy();
};

const clearAllUserScans = async (userId) => {
  const scans = await Scan.findAll({ where: { user_id: userId } });
  // Delete all images first
  for (const scan of scans) {
    if (scan.image_url) {
      await deleteImage(scan.image_url);
    }
  }
  await Scan.destroy({ where: { user_id: userId } });
};

module.exports = { analyzeScan, getUserScans, getScanById, deleteScan, clearAllUserScans };
