const express = require('express');
const validate = require('../middlewares/validate.middleware');
const chatbotValidation = require('../validations/chatbot.validation');
const chatbotController = require('../controllers/chatbot.controller');
const auth = require('../middlewares/auth.middleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for chatbot (prevent abuse)
const chatbotRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many chatbot requests. Please slow down.',
  },
});

// All routes require authentication
router.use(auth());

// Chat with AI assistant about food analysis
router.post(
  '/chat',
  chatbotRateLimiter,
  validate(chatbotValidation.chat),
  chatbotController.chat,
);

module.exports = router;
