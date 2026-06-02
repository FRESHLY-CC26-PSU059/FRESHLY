const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.',
  },
});

// Strict: login, register, google-login (brute-force sensitive).
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later.',
  },
});

// Relaxed: verify-email, resend, logout, refresh (less abuse-prone).
const authSoftRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.',
  },
});

// OTP / password reset (email-sending endpoints).
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many OTP requests, please try again later.',
  },
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many upload attempts, please try again later.',
  },
});

module.exports = { rateLimiter, authRateLimiter, authSoftRateLimiter, otpRateLimiter, uploadRateLimiter };
