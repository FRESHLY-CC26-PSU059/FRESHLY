const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const authValidation = require('../validations/auth.validation');
const auth = require('../middlewares/auth.middleware');
const { verifyRecaptchaRegister, verifyRecaptchaLogin, verifyRecaptchaForgotPassword } = require('../middlewares/recaptcha.middleware');
const config = require('../config/env');

const router = express.Router();

// E2E bypass: inject a dummy recaptchaToken that passes Joi validation,
// then the recaptcha middleware will skip Google verification via the bypass header
const e2eBypassPreValidation = (req, res, next) => {
  if (config.e2eBypassToken && req.headers['x-e2e-bypass'] === config.e2eBypassToken) {
    req.body.recaptchaToken = 'e2e-bypass-dummy-token-placeholder';
  }
  next();
};

// Rate limiters removed ('loss aja')
router.post('/register', e2eBypassPreValidation, validate(authValidation.register), verifyRecaptchaRegister, authController.register);
router.post('/login', e2eBypassPreValidation, validate(authValidation.login), verifyRecaptchaLogin, authController.login);
router.post('/google-login', e2eBypassPreValidation, validate(authValidation.googleLogin), verifyRecaptchaLogin, authController.googleLogin);
router.post('/microsoft-login', e2eBypassPreValidation, validate(authValidation.microsoftLogin), verifyRecaptchaLogin, authController.microsoftLogin);

// Soft limiter removed
router.post('/resend-verification', validate(authValidation.resendVerification), authController.resendVerification);
router.get('/verify-email', authController.verifyEmail);
router.post('/logout', validate(authValidation.logout), authController.logout);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

// OTP limiter removed
router.post('/forgot-password', validate(authValidation.forgotPassword), verifyRecaptchaForgotPassword, authController.forgotPassword);
router.post('/verify-otp', validate(authValidation.verifyOTP), authController.verifyOTP);
router.post('/reset-password', validate(authValidation.resetPassword), authController.resetPassword);

// Authenticated routes
router.post('/change-password', auth(), validate(authValidation.changePassword), authController.changePassword);
router.delete('/delete-me', auth(), validate(authValidation.deleteMe), authController.deleteMe);

module.exports = router;
