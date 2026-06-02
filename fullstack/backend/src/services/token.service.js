const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/env');
const { Token } = require('../models');

// SHA-256 of the raw JWT; stored instead of the plaintext refresh token.
const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expires.getTime() / 1000),
    type,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const storedValue = type === 'refresh' ? hashRefreshToken(token) : token;
  const tokenDoc = await Token.create({
    token: storedValue,
    user_id: userId,
    expires,
    type,
    blacklisted,
  });
  return tokenDoc;
};

const verifyToken = async (token, type) => {
  const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (err) {
    const logger = require('../config/logger');
    logger.error('Token verification failed', { error: err.message });
    throw new Error('Token verification failed: ' + err.message, { cause: err });
  }

  const lookupValue = type === 'refresh' ? hashRefreshToken(token) : token;
  const tokenDoc = await Token.findOne({
    where: { token: lookupValue, type, user_id: payload.sub, blacklisted: false },
  });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

const generateAuthTokens = async (user) => {
  const parseMs = (str) => {
    const num = parseInt(str);
    if (isNaN(num) || num <= 0) return 24 * 60 * 60 * 1000;
    if (str.endsWith('h')) return num * 60 * 60 * 1000;
    if (str.endsWith('m')) return num * 60 * 1000;
    return num * 24 * 60 * 60 * 1000;
  };

  const accessTokenExpires = new Date(Date.now() + parseMs(config.jwt.expiresIn));
  const accessToken = generateToken(user.id, accessTokenExpires, 'access', config.jwt.secret);

  const refreshTokenExpires = new Date(Date.now() + parseMs(config.jwt.refreshExpiresIn));
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    'refresh',
    config.jwt.refreshSecret,
  );

  await saveToken(refreshToken, user.id, refreshTokenExpires, 'refresh');

  return {
    access: { token: accessToken, expires: accessTokenExpires },
    refresh: { token: refreshToken, expires: refreshTokenExpires },
  };
};

const generateVerifyEmailToken = async (user) => {
  const logger = require('../config/logger');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const verifyEmailToken = generateToken(user.id, expires, 'verifyEmail');
  logger.debug('Generated verify email token for user:', user.id);

  const tokenDoc = await saveToken(verifyEmailToken, user.id, expires, 'verifyEmail');
  logger.debug('Saved verify email token to DB:', { userId: user.id, tokenId: tokenDoc.id, expires });

  return verifyEmailToken;
};

// Bcrypt for OTP so a DB dump never exposes live codes.
const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const compareOtp = async (otp, hash) => {
  if (!hash) return false;
  try {
    return await bcrypt.compare(otp, hash);
  } catch (_) {
    return false;
  }
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateVerifyEmailToken,
  hashRefreshToken,
  hashOtp,
  compareOtp,
};
