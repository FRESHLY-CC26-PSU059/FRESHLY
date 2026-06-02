const Joi = require('joi');

// Bound context so a crafted payload can't explode Gemini token usage.
const MAX_CONTEXT_STRING = 500;
const MAX_CONTEXT_KEYS = 20;

const limitedString = Joi.string().max(MAX_CONTEXT_STRING).allow('');

const contextSchema = Joi.object()
  .max(MAX_CONTEXT_KEYS)
  .pattern(/.*/, Joi.alternatives().try(
    limitedString,
    Joi.number(),
    Joi.boolean(),
    Joi.allow(null),
    Joi.object()
      .max(MAX_CONTEXT_KEYS)
      .pattern(/.*/, Joi.alternatives().try(limitedString, Joi.number(), Joi.boolean(), Joi.allow(null))),
  ))
  .optional()
  .allow(null);

const chat = {
  body: Joi.object().keys({
    message: Joi.string().required().min(1).max(1000).trim(),
    context: contextSchema,
    // conversationHistory is rejected server-side; see chatbot.controller.
  }),
};

module.exports = {
  chat,
};
