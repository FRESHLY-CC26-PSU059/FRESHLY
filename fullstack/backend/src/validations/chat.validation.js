const Joi = require('joi');

const sendMessage = {
  body: Joi.object().keys({
    conversationId: Joi.string().uuid().allow(null),
    message: Joi.string().required().max(2000),
    imageUrl: Joi.string().allow('', null).optional(),
  }),
};

const getConversations = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),
};

const getConversation = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

const deleteConversation = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
};

const deleteConversationsBulk = {
  body: Joi.object().keys({
    ids: Joi.array().items(Joi.string().uuid().required()).min(1).required(),
  }),
};

const updateConversation = {
  params: Joi.object().keys({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    title: Joi.string().required().max(200),
  }),
};

module.exports = {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  deleteConversationsBulk,
  updateConversation,
};
