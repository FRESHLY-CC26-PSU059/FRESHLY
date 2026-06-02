const axios = require('axios');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Detect reCAPTCHA version from site key
 * @param {string} siteKey - reCAPTCHA site key
 * @returns {string} 'v2' or 'v3'
 */
const detectRecaptchaVersion = (siteKey) => {
  // V2 keys typically start with 6Le..., V3 with 6Le...
  // We'll determine from response structure instead
  return 'unknown'; // Will be determined from response
};

/**
 * Unified reCAPTCHA verification for both V2 and V3
 * @param {string} token - reCAPTCHA token
 * @param {string} action - expected action for V3 (optional)
 * @param {string} remoteIp - user IP address (optional)
 * @param {number} scoreThreshold - minimum score for V3, default 0.3
 * @returns {Promise<{success: boolean, version: string, score?: number, action?: string}>}
 */
const verifyRecaptcha = async (token, action = null, remoteIp = null, scoreThreshold = 0.3) => {
  if (!token) {
    logger.warn('reCAPTCHA: No token provided');
    return { success: false, version: 'unknown' };
  }

  try {
    const params = {
      secret: config.recaptchaSecretKey,
      response: token,
    };

    if (remoteIp) {
      params.remoteip = remoteIp;
    }

    logger.debug('reCAPTCHA: Sending verification request to Google', {
      hasSecretKey: !!config.recaptchaSecretKey,
      tokenLength: token.length,
      remoteIp: remoteIp || 'not_provided',
    });

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params }
    );

    const { success, score, 'error-codes': errorCodes, challenge_ts, hostname } = response.data;

    logger.info('reCAPTCHA: Google API response', {
      success,
      score,
      errorCodes,
      hostname,
      challenge_ts,
      tokenLength: token.length
    });

    if (!success) {
      logger.warn('reCAPTCHA: Verification failed', {
        errorCodes,
        challenge_ts,
        hostname,
      });
      return { success: false, version: 'unknown', errorCodes };
    }

    // Determine version and validate accordingly
    if (score !== undefined) {
      // reCAPTCHA V3
      logger.info('reCAPTCHA V3: Verification', {
        action,
        score: score.toFixed(2),
        threshold: scoreThreshold.toFixed(2),
        passed: score >= scoreThreshold,
        hostname,
        challenge_ts,
      });

      if (score < scoreThreshold) {
        logger.warn('reCAPTCHA V3: Score too low', { 
          action, 
          score, 
          threshold: scoreThreshold,
          hostname 
        });
        return { 
          success: false, 
          version: 'v3', 
          score, 
          action,
          reason: 'score_too_low' 
        };
      }

      // Validate action if provided
      if (action && response.data.action !== action) {
        logger.warn('reCAPTCHA V3: Action mismatch', { 
          expected: action, 
          received: response.data.action 
        });
        return { 
          success: false, 
          version: 'v3', 
          score, 
          action,
          reason: 'action_mismatch' 
        };
      }

      return { 
        success: true, 
        version: 'v3', 
        score, 
        action: response.data.action 
      };

    } else {
      // reCAPTCHA V2 (checkbox or invisible)
      logger.info('reCAPTCHA V2: Verification successful', {
        hostname,
        challenge_ts,
      });

      return { 
        success: true, 
        version: 'v2',
        hostname,
        challenge_ts
      };
    }

  } catch (error) {
    logger.error('reCAPTCHA: Error during verification request', {
      error: error.message,
    });
    return {
      success: false,
      version: 'unknown',
      error: error.message,
    };
  }
};

/**
 * Legacy verification function for backward compatibility
 * @deprecated Use verifyRecaptcha instead
 */
const verifyRecaptchaLegacy = async (token, scoreThreshold = 0.3) => {
  const result = await verifyRecaptcha(token, null, null, scoreThreshold);
  return result.success;
};

module.exports = {
  verifyRecaptcha,
  verifyRecaptchaLegacy,
  detectRecaptchaVersion,
};
