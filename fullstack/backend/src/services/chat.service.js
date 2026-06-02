const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Conversation, Message, Scan } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const knowledgeService = require('./knowledge.service');
const logger = require('../config/logger');
const config = require('../config/env');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { saveImage } = require('../utils/image');

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const SYSTEM_PROMPT = `Kamu adalah Freshly, asisten cerdas seputar buah, sayur, makanan, dan nutrisi.
Jawab semua pertanyaan tentang makanan, buah, sayur, nutrisi, resep, cara penyimpanan, manfaat kesehatan, dan topik gizi lainnya menggunakan pengetahuanmu sendiri.
Jika ada informasi konteks yang diberikan, gunakan sebagai referensi tambahan.
Tolak hanya pertanyaan yang benar-benar tidak berhubungan dengan makanan, buah, sayur, atau nutrisi.
Jawab ringkas, ramah, dan dalam bahasa yang sama dengan pengguna.`;

const buildContext = async (userId, userMessage) => {
  const parts = [];

  // 1. Knowledge base
  try {
    const knowledges = await knowledgeService.searchRelevant(userMessage, 5);
    if (knowledges.length > 0) {
      const kb = knowledges.map((k) => `- ${k.title}: ${k.content}`).join('\n');
      parts.push(`=== KNOWLEDGE BASE ===\n${kb}`);
    }
  } catch (err) {
    logger.warn(`Failed to search knowledge: ${err.message}`);
  }

  // 2. User's recent scans
  try {
    const scans = await Scan.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: [
        'object_name',
        'object_type',
        'ripeness_level',
        'is_consumable',
        'recommendation',
        'createdAt',
      ],
    });
    if (scans.length > 0) {
      const scanSummary = scans
        .map(
          (s) =>
            `- ${s.object_name || 'Unknown'} (${s.object_type || '?'}): ${s.ripeness_level || '?'}, consumable: ${s.is_consumable ? 'yes' : 'no'} [${s.createdAt.toISOString().split('T')[0]}]`,
        )
        .join('\n');
      parts.push(`=== RIWAYAT SCAN PENGGUNA ===\n${scanSummary}`);
    }
  } catch (err) {
    logger.warn(`Failed to load scan history: ${err.message}`);
  }

  return parts.join('\n\n');
};

const sendMessage = async (userId, { conversationId, message, imageUrl }, file = null) => {
  let conversation;

  if (conversationId) {
    conversation = await Conversation.findOne({ where: { id: conversationId, user_id: userId } });
    if (!conversation) {
      throw new ApiError(404, 'Conversation not found', ERROR_CODES.NOT_FOUND);
    }
  } else {
    const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
    conversation = await Conversation.create({ user_id: userId, title });
  }

  // Process image if any (uploaded file or preloaded imageUrl)
  let savedImageUrl = null;
  let imageBuffer = null;
  let imageMimeType = 'image/webp';

  if (file) {
    savedImageUrl = await saveImage(file.buffer, 'chat');
    imageBuffer = file.buffer;
    imageMimeType = file.mimetype;
  } else if (imageUrl) {
    savedImageUrl = imageUrl;
    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const response = await axios.get(imageUrl, { 
          responseType: 'arraybuffer',
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024 // 10MB limit
        });
        imageBuffer = Buffer.from(response.data);
        const contentType = response.headers['content-type'];
        if (contentType) imageMimeType = contentType;
      } else {
        const sanitizedUrl = imageUrl.replace(/\.\./g, '').replace(/\/\//g, '/');
        const localPath = path.resolve(process.cwd(), sanitizedUrl.startsWith('/') ? sanitizedUrl.substring(1) : sanitizedUrl);
        const uploadPath = path.resolve(process.cwd(), 'uploads');
        const relative = path.relative(uploadPath, localPath);
        const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
        if (isSafe && fs.existsSync(localPath)) {
          imageBuffer = fs.readFileSync(localPath);
          const ext = path.extname(localPath).toLowerCase();
          if (ext === '.jpg' || ext === '.jpeg') imageMimeType = 'image/jpeg';
          else if (ext === '.png') imageMimeType = 'image/png';
          else if (ext === '.webp') imageMimeType = 'image/webp';
        } else {
          logger.warn(`LFI Attempt Blocked - localPath: ${localPath}`);
        }
      }
    } catch (err) {
      logger.warn(`Failed to preload image buffer from url ${imageUrl}: ${err.message}`);
    }
  }

  // Save user message
  await Message.create({
    conversation_id: conversation.id,
    role: 'user',
    content: message,
    image_url: savedImageUrl,
  });

  // Build context
  const context = await buildContext(userId, message);

  // 20 most recent messages, ordered oldest-first for the prompt.
  const recent = await Message.findAll({
    where: { conversation_id: conversation.id },
    order: [['createdAt', 'DESC']],
    limit: 20,
    attributes: ['role', 'content'],
  });
  const history = recent.reverse();

  // Strip fake role markers to defuse multi-turn prompt injection.
  const stripRoleMarkers = (text) =>
    (text || '').replace(/^\s*(assistant|user|system)\s*:\s*/gim, '');
  const safeUserMessage = stripRoleMarkers(message);

  // Call Gemini with retry
  let assistantResponse;
  try {
    const models = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ];

    let lastError = null;

    for (const modelName of models) {
      try {
        logger.info(`[CHAT] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const historyString = history.length > 1
          ? history.slice(0, -1)
              .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${stripRoleMarkers(m.content)}`)
              .join('\n') + '\n'
          : '';

        const fullPrompt = `${SYSTEM_PROMPT}

${context}

${historyString}User: ${safeUserMessage}
Assistant:`;

        const parts = [fullPrompt];
        if (imageBuffer) {
          parts.push({
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: imageMimeType,
            },
          });
        }

        const result = await model.generateContent(parts);
        assistantResponse = result.response.text();
        logger.info(`[CHAT] Success with model: ${modelName}`);
        break;
      } catch (err) {
        logger.warn(`[CHAT] Model ${modelName} failed: ${err.message}`);
        lastError = err;
        continue;
      }
    }

    if (!assistantResponse) {
      throw lastError || new Error('All models failed');
    }
  } catch (err) {
    logger.error(`Gemini API error: ${err.message}`, err.stack);
    assistantResponse = 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti.';
  }

  // Save assistant message
  await Message.create({
    conversation_id: conversation.id,
    role: 'assistant',
    content: assistantResponse,
  });

  // Auto-save substantial answers as disabled knowledge drafts for admin review.
  const isSubstantial = assistantResponse.length > 120;
  const isApology = /maaf|tidak (bisa|dapat|memiliki)|gangguan|coba lagi/i.test(assistantResponse);
  if (isSubstantial && !isApology) {
    try {
      const title = message.length > 80 ? message.substring(0, 80) + '...' : message;
      await knowledgeService.createKnowledge({
        title,
        content: assistantResponse,
        category: 'chat',
        tags: 'chat,auto',
        source: 'chat',
        enabled: false,
      });
    } catch (err) {
      logger.warn(`Failed to auto-save knowledge: ${err.message}`);
    }
  }

  // Touch updatedAt so the sidebar sorts by most recent activity.
  conversation.changed('updatedAt', true);
  await conversation.update({ updatedAt: new Date() }, { silent: false });

  return {
    conversationId: conversation.id,
    message: assistantResponse,
  };
};

const getConversations = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Conversation.findAndCountAll({
    where: { user_id: userId },
    order: [['updatedAt', 'DESC']],
    limit,
    offset,
    include: [
      {
        model: Message,
        as: 'messages',
        limit: 1,
        order: [['createdAt', 'DESC']],
        attributes: ['content', 'role', 'createdAt'],
      },
    ],
  });

  return {
    conversations: rows,
    pagination: { page, limit, totalItems: count, totalPages: Math.ceil(count / limit) },
  };
};

const getConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, user_id: userId },
    include: [
      {
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']],
        attributes: ['id', 'role', 'content', 'image_url', 'createdAt'],
      },
    ],
  });
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found', ERROR_CODES.NOT_FOUND);
  }
  return conversation;
};

const deleteConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, user_id: userId },
  });
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found', ERROR_CODES.NOT_FOUND);
  }
  await Message.destroy({ where: { conversation_id: conversationId } });
  await conversation.destroy();
};

const clearAllConversations = async (userId) => {
  const conversations = await Conversation.findAll({
    where: { user_id: userId },
    attributes: ['id'],
  });
  const conversationIds = conversations.map((c) => c.id);
  if (conversationIds.length > 0) {
    await Message.destroy({ where: { conversation_id: conversationIds } });
    await Conversation.destroy({ where: { id: conversationIds } });
  }
};

const deleteConversationsBulk = async (conversationIds, userId) => {
  const conversations = await Conversation.findAll({
    where: { id: conversationIds, user_id: userId },
    attributes: ['id'],
  });
  const validIds = conversations.map((c) => c.id);
  if (validIds.length > 0) {
    await Message.destroy({ where: { conversation_id: validIds } });
    await Conversation.destroy({ where: { id: validIds } });
  }
};

const updateConversation = async (conversationId, userId, { title }) => {
  const conversation = await Conversation.findOne({
    where: { id: conversationId, user_id: userId },
  });
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found', ERROR_CODES.NOT_FOUND);
  }
  await conversation.update({ title });
  return conversation;
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  clearAllConversations,
  deleteConversationsBulk,
  updateConversation,
};
