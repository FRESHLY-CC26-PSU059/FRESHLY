const catchAsync = require('../utils/catch-async');
const chatService = require('../services/chat.service');

const sendMessage = catchAsync(async (req, res) => {
  const result = await chatService.sendMessage(req.user.id, req.body, req.file);

  res.json({
    status: 'success',
    data: result,
  });
});

const getConversations = catchAsync(async (req, res) => {
  const result = await chatService.getConversations(req.user.id, req.query);

  res.json({
    status: 'success',
    data: result.conversations,
    pagination: result.pagination,
  });
});

const getConversation = catchAsync(async (req, res) => {
  const conversation = await chatService.getConversation(req.params.id, req.user.id);

  res.json({
    status: 'success',
    data: { conversation },
  });
});

const deleteConversation = catchAsync(async (req, res) => {
  await chatService.deleteConversation(req.params.id, req.user.id);
  res.status(204).send();
});

const clearAllConversations = catchAsync(async (req, res) => {
  await chatService.clearAllConversations(req.user.id);
  res.status(204).send();
});

const deleteConversationsBulk = catchAsync(async (req, res) => {
  await chatService.deleteConversationsBulk(req.body.ids, req.user.id);
  res.status(204).send();
});

const updateConversation = catchAsync(async (req, res) => {
  const conversation = await chatService.updateConversation(req.params.id, req.user.id, req.body);
  res.json({
    status: 'success',
    data: { conversation },
  });
});

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  clearAllConversations,
  deleteConversationsBulk,
  updateConversation,
};
