const { verifyRecaptcha: verifyRecaptchaUtil } = require('../utils/recaptcha');
const config = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error');

/**
 * Factory to create reCAPTCHA middleware with custom settings
 * @param {string} expectedAction - Action name for V3 (optional)
 * @param {number} scoreThreshold - Score threshold for V3 (default 0.3)
 * @param {boolean} required - Whether verification is strictly required (default false for now)
 */
const createRecaptchaMiddleware = (expectedAction = null, scoreThreshold = 0.3, required = false) => {
  return async (req, res, next) => {
    try {
      // E2E test bypass — only active when E2E_BYPASS_TOKEN is configured
      const bypassHeader = req.headers['x-e2e-bypass'];
      if (config.e2eBypassToken && bypassHeader === config.e2eBypassToken) {
        logger.warn('reCAPTCHA: E2E bypass used', { ip: req.ip, endpoint: req.originalUrl });
        delete req.body.recaptchaToken;
        return next();
      }

      const { recaptchaToken } = req.body;

      if (!config.recaptchaSecretKey) {
        // In production, reCAPTCHA secret key MUST be configured
        if (config.env === 'production' && required) {
          logger.error('reCAPTCHA: Secret key not configured in production!');
          throw new ApiError(500, 'Security service misconfigured. Please contact support.', 'RECAPTCHA_CONFIG_ERROR');
        }
        // Skip verification only in development/test if not required
        logger.warn('reCAPTCHA: Secret key not configured — skipping verification (non-production)');
        delete req.body.recaptchaToken;
        return next();
      }

      // In development/test, skip Google API verification but still require the token field
      if (config.env !== 'production') {
        logger.info('reCAPTCHA: Non-production environment — skipping Google verification');
        delete req.body.recaptchaToken;
        return next();
      }

      // If reCAPTCHA is optional and no token provided, continue
      if (!required && !recaptchaToken) {
        logger.info('reCAPTCHA: Optional token not provided - continuing');
        delete req.body.recaptchaToken;
        return next();
      }

      // If reCAPTCHA is required and no token provided, block request
      if (required && !recaptchaToken) {
        logger.warn('reCAPTCHA: Required token not provided', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        });
        throw new ApiError(400, 'Security verification required. Please enable JavaScript and try again.');
      }

      logger.info('reCAPTCHA: Verifying token', {
        ip: req.ip,
        hasExpectedAction: !!expectedAction,
        scoreThreshold,
        endpoint: req.originalUrl
      });

      const result = await verifyRecaptchaUtil(
        recaptchaToken, 
        expectedAction, 
        req.ip, 
        scoreThreshold
      );

      if (!result.success) {
        // If optional, we log but don't block
        if (!required) {
          logger.warn('reCAPTCHA: Optional verification failed - continuing anyway', {
            reason: result.reason,
            errorCodes: result.errorCodes,
            score: result.score
          });
          delete req.body.recaptchaToken;
          return next();
        }

        logger.warn('reCAPTCHA: Verification failed', {
          version: result.version,
          reason: result.reason,
          score: result.score,
          errorCodes: result.errorCodes,
          ip: req.ip,
          endpoint: req.originalUrl,
          tokenLength: recaptchaToken ? recaptchaToken.length : 0
        });

        // Provide specific error messages based on failure reason
        let errorMessage = 'reCAPTCHA verification failed. Please try again.';
        if (result.reason === 'score_too_low') {
          errorMessage = 'Security check failed. Please refresh the page and try again.';
        } else if (result.reason === 'action_mismatch') {
          errorMessage = 'Invalid request. Please refresh the page and try again.';
        } else if (result.errorCodes && result.errorCodes.includes('timeout-or-duplicate')) {
          errorMessage = 'Security verification expired. Please refresh the page and try again.';
        } else if (result.errorCodes && result.errorCodes.includes('invalid-input-secret')) {
          errorMessage = 'Server configuration error. Please contact support.';
          logger.error('reCAPTCHA: Invalid secret key configuration');
        } else if (result.errorCodes && result.errorCodes.includes('invalid-input-response')) {
          errorMessage = 'Invalid security token. Please refresh the page and try again.';
        }

        throw new ApiError(400, errorMessage, 'RECAPTCHA_FAILED');
      }

      logger.info('reCAPTCHA: Verification successful', {
        version: result.version,
        score: result.score,
        action: result.action,
        hostname: result.hostname,
        ip: req.ip,
        endpoint: req.originalUrl
      });

      // Attach verification result to request for potential use downstream
      req.recaptchaResult = result;

      // Remove recaptchaToken from body so it doesn't interfere with downstream validation
      delete req.body.recaptchaToken;
      next();

    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      
      logger.error('reCAPTCHA: Verification error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        endpoint: req.originalUrl
      });
      
      // If optional, don't block on service errors
      if (!required) {
        return next();
      }
      
      next(new ApiError(500, 'Security verification service unavailable. Please try again later.', 'RECAPTCHA_SERVICE_ERROR'));
    }
  };
};

// Preconfigured middleware instances
// Note: expectedAction set to null because frontend uses react-google-recaptcha (v2 library)
// which doesn't support passing action parameters for v3. Score threshold is the primary security check.
const verifyRecaptchaDefault = createRecaptchaMiddleware(); // Default: optional
const verifyRecaptchaOptional = createRecaptchaMiddleware(null, 0.3, false); // Explicitly optional
const verifyRecaptchaLogin = createRecaptchaMiddleware(null, 0.3, true); // Login - REQUIRED
const verifyRecaptchaRegister = createRecaptchaMiddleware(null, 0.3, true); // Register - REQUIRED
const verifyRecaptchaForgotPassword = createRecaptchaMiddleware(null, 0.3, true); // Forgot password - REQUIRED

module.exports = { 
  verifyRecaptchaDefault,
  verifyRecaptchaOptional,
  verifyRecaptchaLogin,
  verifyRecaptchaRegister,
  verifyRecaptchaForgotPassword,
  createRecaptchaMiddleware
};
