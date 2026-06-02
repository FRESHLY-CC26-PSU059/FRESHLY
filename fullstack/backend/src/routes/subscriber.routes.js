const express = require('express');
const Joi = require('joi');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const subscriberController = require('../controllers/subscriber.controller');

const router = express.Router();

const emailSchema = {
  body: Joi.object().keys({
    email: Joi.string().email({ tlds: { allow: false } }).required().max(120),
  }),
};

// Public
router.post('/subscribe', validate(emailSchema), subscriberController.subscribe);
router.post('/unsubscribe', validate(emailSchema), subscriberController.unsubscribe);

// Authenticated user — check own subscription status
router.get('/status', auth(), subscriberController.checkStatus);

// Admin
router.get('/', auth('admin', 'super_admin'), subscriberController.getSubscribers);
router.post('/send', auth('admin', 'super_admin'), subscriberController.sendNewsletter);

module.exports = router;
