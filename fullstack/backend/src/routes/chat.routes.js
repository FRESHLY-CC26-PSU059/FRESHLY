const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const chatValidation = require('../validations/chat.validation');
const chatController = require('../controllers/chat.controller');
const upload = require('../middlewares/upload.middleware');
const { validateImageBuffer } = require('../middlewares/upload.middleware');

const router = express.Router();

router.post(
  '/',
  auth(),
  upload.single('image'),
  validateImageBuffer,
  validate(chatValidation.sendMessage),
  chatController.sendMessage,
);
router.get('/conversations', auth(), validate(chatValidation.getConversations), chatController.getConversations);
router.delete('/conversations/clear-all', auth(), chatController.clearAllConversations);
router.post('/conversations/bulk-delete', auth(), validate(chatValidation.deleteConversationsBulk), chatController.deleteConversationsBulk);
router.get('/conversations/:id', auth(), validate(chatValidation.getConversation), chatController.getConversation);
router.patch('/conversations/:id', auth(), validate(chatValidation.updateConversation), chatController.updateConversation);
router.delete('/conversations/:id', auth(), validate(chatValidation.deleteConversation), chatController.deleteConversation);

module.exports = router;
