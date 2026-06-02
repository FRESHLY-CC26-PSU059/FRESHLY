const morgan = require('morgan');
const logger = require('./logger');

const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const skip = (req) => {
  return req.originalUrl === '/health';
};

// Redact sensitive query params before the access log transport sees them.
const SENSITIVE_PARAMS = ['token', 'otp', 'password', 'refreshToken', 'recaptchaToken'];
morgan.token('safeUrl', (req) => {
  try {
    const url = new URL(req.originalUrl, 'http://localhost');
    for (const key of SENSITIVE_PARAMS) {
      if (url.searchParams.has(key)) {
        url.searchParams.set(key, '[REDACTED]');
      }
    }
    return `${url.pathname}${url.search}`;
  } catch (_) {
    return req.originalUrl;
  }
});

const format = ':remote-addr :method :safeUrl :status :res[content-length] - :response-time ms :req[x-request-id]';

const morganMiddleware = morgan(format, { stream, skip });

module.exports = morganMiddleware;
