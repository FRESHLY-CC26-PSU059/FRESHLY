const catchAsync = require('../utils/catch-async');
const chatbotService = require('../services/chatbot.service');
const auditLog = require('../services/audit-log.service');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

/**
 * Chat with AI assistant
 * POST /api/v1/chatbot/chat
 */
const chat = catchAsync(async (req, res) => {
  const { message, context } = req.body;

  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required', ERROR_CODES.VALIDATION_ERROR);
  }

  // Ignore client-supplied conversation history to prevent prompt injection.
  const result = await chatbotService.chat(message, context, req.user?.id);

  // Audit log
  await auditLog.log({
    userId: req.user?.id || null,
    action: result.blocked ? 'chatbot_blocked' : 'chatbot_query',
    entity: 'chatbot',
    entityId: null,
    details: result.blocked
      ? `Blocked: ${result.reason}`
      : `Query: ${message.substring(0, 50)}...`,
    ipAddress: req.ip,
  });

  res.json({
    status: 'success',
    data: {
      response: result.response,
      blocked: result.blocked,
      reason: result.reason,
      tokensUsed: result.tokensUsed,
      model: result.model,
    },
  });
});

module.exports = {
  chat,
};
