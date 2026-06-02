const crypto = require('crypto');
const config = require('../config/env');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

// Constant-time string compare.
const timingSafeEqualString = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyClientKey = (req, _res, next) => {
  // Allow API docs (Scalar + Swagger UI fallback) and their static assets
  if (req.path === '/docs' || req.path.startsWith('/docs/')) {
    return next();
  }

  const clientKey = req.headers['x-client-key'];

  if (!clientKey || !timingSafeEqualString(clientKey, config.clientKey)) {
    return next(
      new ApiError(
        403,
        'Forbidden: Invalid or missing x-client-key',
        ERROR_CODES.INVALID_CLIENT_KEY,
      ),
    );
  }

  next();
};

module.exports = verifyClientKey;
