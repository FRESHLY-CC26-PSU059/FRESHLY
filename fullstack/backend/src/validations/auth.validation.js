const Joi = require('joi');

const passwordSchema = Joi.string()
  .required()
  .min(8)
  .max(128) // Prevent bcrypt DoS
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/])[A-Za-z\\d@$!%*?&#^()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/]+$'))
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
  });

const register = {
  body: Joi.object().keys({
    first_name: Joi.string().required().max(60),
    last_name: Joi.string().required().max(60),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .max(120),
    password: passwordSchema,
    phone: Joi.string().max(20).allow(null, ''),
    gender: Joi.string().max(10).allow(null, ''),
    address: Joi.string().max(255).allow(null, ''),
    birthdate: Joi.date().iso().allow(null, ''),
    recaptchaToken: Joi.string().required().min(20).messages({
      'any.required': 'Security verification (reCAPTCHA) is required',
      'string.empty': 'Security verification (reCAPTCHA) is required',
      'string.min': 'Invalid security verification token',
    }),
  }),
};

const resendVerification = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .max(120),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    password: Joi.string().required(),
    recaptchaToken: Joi.string().required().min(20).messages({
      'any.required': 'Security verification (reCAPTCHA) is required',
      'string.empty': 'Security verification (reCAPTCHA) is required',
      'string.min': 'Invalid security verification token',
    }),
    fcmToken: Joi.string().max(4096).allow('', null).optional(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const changePassword = {
  body: Joi.object().keys({
    oldPassword: Joi.string().required(),
    newPassword: passwordSchema,
  }),
};

const deleteMe = {
  body: Joi.object().keys({
    password: Joi.string().required(),
  }),
};

const googleLogin = {
  body: Joi.object().keys({
    idToken: Joi.string().required().min(100).max(2000),
    recaptchaToken: Joi.string().required().min(20).messages({
      'any.required': 'Security verification (reCAPTCHA) is required',
      'string.empty': 'Security verification (reCAPTCHA) is required',
      'string.min': 'Invalid security verification token',
    }),
    fcmToken: Joi.string().max(4096).allow('', null).optional(),
  }),
};

const microsoftLogin = {
  body: Joi.object().keys({
    idToken: Joi.string().required().min(100).max(2000),
    recaptchaToken: Joi.string().required().min(20).messages({
      'any.required': 'Security verification (reCAPTCHA) is required',
      'string.empty': 'Security verification (reCAPTCHA) is required',
      'string.min': 'Invalid security verification token',
    }),
    fcmToken: Joi.string().max(4096).allow('', null).optional(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    recaptchaToken: Joi.string().required().min(20).messages({
      'any.required': 'Security verification (reCAPTCHA) is required',
      'string.empty': 'Security verification (reCAPTCHA) is required',
      'string.min': 'Invalid security verification token',
    }),
  }),
};

const verifyOTP = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    otp: Joi.string()
      .required()
      .length(6)
      .pattern(/^\d+$/),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } }),
    otp: Joi.string()
      .required()
      .length(6)
      .pattern(/^\d+$/),
    newPassword: passwordSchema,
  }),
};

module.exports = {
  register,
  resendVerification,
  login,
  logout,
  refreshTokens,
  changePassword,
  deleteMe,
  googleLogin,
  microsoftLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
