const bcrypt = require('bcrypt');
const { admin, initializeFirebase } = require('../config/firebase');
const config = require('../config/env');
const { User, Token, Role } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const tokenService = require('./token.service');
const logger = require('../config/logger');

// Initialize Firebase Admin
initializeFirebase();

const getGoogleProfileName = (decodedToken) => {
  const displayName = [decodedToken.name, decodedToken.displayName]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim();

  const providerProfile = decodedToken.firebase?.identities?.['google.com']?.[0];
  const fallbackName = decodedToken.email?.split('@')[0] || providerProfile || 'Google User';
  const safeName = displayName || fallbackName;
  const nameParts = safeName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Google';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  return {
    first_name: firstName,
    last_name: lastName,
  };
};

const getGitHubProfileName = (decodedToken) => {
  const displayName = [decodedToken.name, decodedToken.displayName]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim();

  const providerProfile = decodedToken.firebase?.identities?.['github.com']?.[0];
  const fallbackName = decodedToken.email?.split('@')[0] || providerProfile || 'GitHub User';
  const safeName = displayName || fallbackName;
  const nameParts = safeName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'GitHub';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  return {
    first_name: firstName,
    last_name: lastName,
  };
};

const getMicrosoftProfileName = (decodedToken) => {
  const displayName = [decodedToken.name, decodedToken.displayName]
    .find((value) => typeof value === 'string' && value.trim())
    ?.trim();

  const providerProfile = decodedToken.firebase?.identities?.['microsoft.com']?.[0];
  const fallbackName = decodedToken.email?.split('@')[0] || providerProfile || 'Microsoft User';
  const safeName = displayName || fallbackName;
  const nameParts = safeName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || 'Microsoft';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  return {
    first_name: firstName,
    last_name: lastName,
  };
};

const registerUser = async (userBody) => {
  const existingUser = await User.findOne({ where: { email: userBody.email } });
  if (existingUser) {
    if (!existingUser.isEmailVerified) {
      // Refresh the pending registration; generic success either way.
      const hashedPassword = await bcrypt.hash(userBody.password, 10);
      await existingUser.update({
        first_name: userBody.first_name,
        last_name: userBody.last_name,
        password: hashedPassword,
      });
      await Token.destroy({ where: { user_id: existingUser.id, type: 'verifyEmail' } });
      await existingUser.reload({
        include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
      });
      return existingUser;
    }

    // Email verified already — return sentinel so controller sends the
    // same generic success response (no enumeration).
    const logger = require('../config/logger');
    logger.info('[SECURITY] Registration attempt for already-verified email', {
      email: userBody.email,
      timestamp: new Date().toISOString(),
    });
    return null;
  }

  const selectedRole = await Role.findOne({ where: { role_name: 'user', enabled: true } });
  if (!selectedRole) {
    throw new ApiError(500, 'Default role is not configured', ERROR_CODES.INTERNAL_ERROR);
  }

  const hashedPassword = await bcrypt.hash(userBody.password, 10);
  const user = await User.create({
    ...userBody,
    role_id: selectedRole.id,
    password: hashedPassword,
  });

  await user.reload({
    include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
  });

  return user;
};

const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user || user.isEmailVerified) return null;
  await Token.destroy({ where: { user_id: user.id, type: 'verifyEmail' } });
  return user;
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.scope('withPassword').findOne({
    where: { email },
    include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
  });

  // Timing attack prevention - always run bcrypt even if user not found
  if (!user) {
    await bcrypt.compare(password, '$2b$10$YourFakeHashHereToPreventTimingAttack1234567890');
    throw new ApiError(401, 'Incorrect email or password', ERROR_CODES.INVALID_CREDENTIALS);
  }

  if (!user.isEmailVerified) {
    throw new ApiError(401, 'Email not verified. Please check your email.', ERROR_CODES.EMAIL_NOT_VERIFIED);
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new ApiError(
      403,
      `Account temporarily locked. Try again in ${remainingMinutes} minute(s)`,
      ERROR_CODES.ACCOUNT_LOCKED,
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    // Increment failed attempts
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData = { failedLoginAttempts: newFailedAttempts };
    
    // Lock account after 5 failed attempts
    if (newFailedAttempts >= 5) {
      updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      
      // Send email notification about account lockout
      try {
        const emailService = require('./email.service');
        await emailService.sendAccountLockoutEmail(user.email, user.first_name, 15);
      } catch (emailError) {
        const logger = require('../config/logger');
        logger.error('Failed to send lockout email', { 
          userId: user.id, 
          email: user.email, 
          error: emailError.message 
        });
      }
    }
    
    await user.update(updateData);
    
    throw new ApiError(401, 'Incorrect email or password', ERROR_CODES.INVALID_CREDENTIALS);
  }

  // Reset failed attempts on successful login
  await user.update({ 
    failedLoginAttempts: 0, 
    lockedUntil: null,
    lastLogin: new Date(),
  });

  return user;
};

const verifyEmail = async (verifyEmailToken) => {
  try {
    const logger = require('../config/logger');
    logger.debug('Starting email verification...');
    
    const verifyEmailTokenDoc = await tokenService.verifyToken(verifyEmailToken, 'verifyEmail');
    logger.debug('Token found:', verifyEmailTokenDoc);
    
    const user = await User.findByPk(verifyEmailTokenDoc.user_id);
    if (!user) {
      logger.error('User not found for token user_id:', verifyEmailTokenDoc.user_id);
      throw new Error('User not found');
    }
    
    // Check if already verified
    if (user.isEmailVerified) {
      logger.info('Email already verified for user:', user.email);
      return; // Success - no error
    }
    
    await Token.destroy({ where: { user_id: user.id, type: 'verifyEmail' } });
    await user.update({ isEmailVerified: true });
    logger.info('Email verified successfully for user:', user.email);
  } catch (error) {
    const logger = require('../config/logger');
    
    // Check if token not found but user might already be verified
    if (error.message === 'Token not found') {
      logger.info('Token not found (already used or expired) - checking user status...');
      try {
        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(verifyEmailToken, config.jwt.secret, { ignoreExpiration: true });
        if (payload && payload.sub) {
          const user = await User.findByPk(payload.sub);
          if (user && user.isEmailVerified) {
            logger.info('User already verified, allowing success response');
            return; // Success - token already used
          }
        }
      } catch (_) {
        // Ignore verify errors (malformed/invalid signature tokens are correctly rejected)
      }
    }
    
    logger.error('Email verification error:', error.message);
    throw new ApiError(401, 'Email verification failed', ERROR_CODES.UNAUTHORIZED);
  }
};

const loginWithGoogle = async (idToken) => {
  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    logger.info('[SECURITY] Google login attempt', {
      email,
      uid,
      timestamp: new Date().toISOString(),
    });

    let user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
    });

    const isNewUser = !user;

    if (!user) {
      // Default to 'user' for Google Login for security
      const selectedRole = await Role.findOne({ where: { role_name: 'user', enabled: true } });
      if (!selectedRole) {
        throw new ApiError(500, 'Default role is not configured', ERROR_CODES.INTERNAL_ERROR);
      }

      // Generate a random password for OAuth users
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const { first_name, last_name } = getGoogleProfileName(decodedToken);

      user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role_id: selectedRole.id,
        imgUrl: picture,
        isEmailVerified: true, // Google email already verified
      });

      await user.reload({
        include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
      });

      logger.info('[SECURITY] New user created via Google login', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    } else {
      const profileUpdates = {};
      const { first_name, last_name } = getGoogleProfileName(decodedToken);

      if (!user.first_name?.trim()) {
        profileUpdates.first_name = first_name;
      }

      if (!user.last_name?.trim()) {
        profileUpdates.last_name = last_name;
      }

      if (picture && !user.imgUrl) {
        profileUpdates.imgUrl = picture;
      }

      // Don't auto-verify an existing manual registration; attacker could
      // hijack by signing in with a matching Google identity.
      if (!user.isEmailVerified) {
        logger.warn('[SECURITY] Google login refused for unverified manual registration', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        });
        throw new ApiError(
          403,
          'Email not verified. Please complete email verification before signing in with Google.',
          ERROR_CODES.EMAIL_NOT_VERIFIED,
        );
      }

      if (Object.keys(profileUpdates).length > 0) {
        await user.update(profileUpdates);
      }
    }

    // Update last login timestamp and reset lockout fields
    await user.update({ 
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    logger.info('[SECURITY] Google login successful', {
      userId: user.id,
      email: user.email,
      isNewUser,
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    logger.error('[SECURITY] Google login failed', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Authentication via Firebase failed', ERROR_CODES.INVALID_CREDENTIALS);
  }
};

const loginWithGitHub = async (idToken) => {
  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, picture, uid } = decodedToken;

    logger.info('[SECURITY] GitHub login attempt', {
      email,
      uid,
      timestamp: new Date().toISOString(),
    });

    let user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
    });

    const isNewUser = !user;

    if (!user) {
      // Default to 'user' for GitHub Login for security
      const selectedRole = await Role.findOne({ where: { role_name: 'user', enabled: true } });
      if (!selectedRole) {
        throw new ApiError(500, 'Default role is not configured', ERROR_CODES.INTERNAL_ERROR);
      }

      // Generate a random password for OAuth users
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const { first_name, last_name } = getGitHubProfileName(decodedToken);

      user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role_id: selectedRole.id,
        imgUrl: picture,
        isEmailVerified: true, // OAuth emails usually verified
      });

      await user.reload({
        include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
      });

      logger.info('[SECURITY] New user created via GitHub login', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    } else {
      const profileUpdates = {};
      const { first_name, last_name } = getGitHubProfileName(decodedToken);

      if (!user.first_name?.trim()) {
        profileUpdates.first_name = first_name;
      }

      if (!user.last_name?.trim()) {
        profileUpdates.last_name = last_name;
      }

      if (picture && !user.imgUrl) {
        profileUpdates.imgUrl = picture;
      }

      // Don't auto-verify an existing manual registration
      if (!user.isEmailVerified) {
        logger.warn('[SECURITY] GitHub login refused for unverified manual registration', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        });
        throw new ApiError(
          403,
          'Email not verified. Please complete email verification before signing in with GitHub.',
          ERROR_CODES.EMAIL_NOT_VERIFIED,
        );
      }

      if (Object.keys(profileUpdates).length > 0) {
        await user.update(profileUpdates);
      }
    }

    // Update last login timestamp and reset lockout fields
    await user.update({ 
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    logger.info('[SECURITY] GitHub login successful', {
      userId: user.id,
      email: user.email,
      isNewUser,
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    logger.error('[SECURITY] GitHub login failed', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Authentication via Firebase failed', ERROR_CODES.INVALID_CREDENTIALS);
  }
};

const loginWithMicrosoft = async (idToken) => {
  try {
    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, picture, uid } = decodedToken;

    logger.info('[SECURITY] Microsoft login attempt', {
      email,
      uid,
      timestamp: new Date().toISOString(),
    });

    let user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
    });

    const isNewUser = !user;

    if (!user) {
      // Default to 'user' for Microsoft Login for security
      const selectedRole = await Role.findOne({ where: { role_name: 'user', enabled: true } });
      if (!selectedRole) {
        throw new ApiError(500, 'Default role is not configured', ERROR_CODES.INTERNAL_ERROR);
      }

      // Generate a random password for OAuth users
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const { first_name, last_name } = getMicrosoftProfileName(decodedToken);

      user = await User.create({
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role_id: selectedRole.id,
        imgUrl: picture,
        isEmailVerified: true, // OAuth emails usually verified
      });

      await user.reload({
        include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
      });

      logger.info('[SECURITY] New user created via Microsoft login', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
    } else {
      const profileUpdates = {};
      const { first_name, last_name } = getMicrosoftProfileName(decodedToken);

      if (!user.first_name?.trim()) {
        profileUpdates.first_name = first_name;
      }

      if (!user.last_name?.trim()) {
        profileUpdates.last_name = last_name;
      }

      if (picture && !user.imgUrl) {
        profileUpdates.imgUrl = picture;
      }

      // Don't auto-verify an existing manual registration
      if (!user.isEmailVerified) {
        logger.warn('[SECURITY] Microsoft login refused for unverified manual registration', {
          userId: user.id,
          email: user.email,
          timestamp: new Date().toISOString(),
        });
        throw new ApiError(
          403,
          'Email not verified. Please complete email verification before signing in with Microsoft.',
          ERROR_CODES.EMAIL_NOT_VERIFIED,
        );
      }

      if (Object.keys(profileUpdates).length > 0) {
        await user.update(profileUpdates);
      }
    }

    // Update last login timestamp and reset lockout fields
    await user.update({ 
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    logger.info('[SECURITY] Microsoft login successful', {
      userId: user.id,
      email: user.email,
      isNewUser,
      timestamp: new Date().toISOString(),
    });

    return user;
  } catch (error) {
    logger.error('[SECURITY] Microsoft login failed', {
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Authentication via Firebase failed', ERROR_CODES.INVALID_CREDENTIALS);
  }
};

const logOut = async (refreshToken) => {
  const hashed = tokenService.hashRefreshToken(refreshToken);
  const refreshTokenDoc = await Token.findOne({
    where: { token: hashed, type: 'refresh', blacklisted: false },
  });
  if (!refreshTokenDoc) {
    throw new ApiError(404, 'Not found', ERROR_CODES.NOT_FOUND);
  }
  // Blacklist instead of destroy — prevents reuse of stolen refresh tokens
  // and preserves audit trail. Cleaned up by token cleanup scheduler.
  await refreshTokenDoc.update({ blacklisted: true });
};

const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
    const user = await User.findByPk(refreshTokenDoc.user_id);
    if (!user) {
      throw new Error('User not found for refresh token');
    }
    await refreshTokenDoc.destroy();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('refreshAuth error', { error: error.message });
    throw new ApiError(401, 'Please authenticate', ERROR_CODES.UNAUTHORIZED);
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
    throw new ApiError(401, 'Incorrect old password', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedPassword });
  
  // SECURITY: Invalidate all existing refresh tokens after password change
  await Token.destroy({ 
    where: { 
      user_id: userId, 
      type: 'refresh' 
    } 
  });
  
  const logger = require('../config/logger');
  logger.info('[SECURITY] All refresh tokens invalidated after password change', {
    userId: user.id,
    timestamp: new Date().toISOString(),
  });
};

const deleteMe = async (userId, password) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Incorrect password', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const { Scan } = require('../models');
  const { deleteImage } = require('../utils/image');

  // Best-effort file cleanup before DB cascade. Failures log but don't block.
  if (user.imgUrl) {
    try {
      await deleteImage(user.imgUrl);
    } catch (err) {
      logger.warn('deleteMe: failed to delete avatar', { userId, error: err.message });
    }
  }

  try {
    const scans = await Scan.findAll({ where: { user_id: userId }, attributes: ['id', 'image_url'] });
    for (const scan of scans) {
      if (scan.image_url) {
        try {
          await deleteImage(scan.image_url);
        } catch (err) {
          logger.warn('deleteMe: failed to delete scan image', {
            userId,
            scanId: scan.id,
            error: err.message,
          });
        }
      }
    }
  } catch (err) {
    logger.warn('deleteMe: failed to enumerate scans', { userId, error: err.message });
  }

  await user.destroy();
};

const generateOTP = () => {
  return require('crypto').randomInt(100000, 1000000).toString();
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });

  // Generic response for missing accounts to prevent enumeration.
  if (!user) {
    const logger = require('../config/logger');
    logger.info('[SECURITY] Password reset requested for non-existent email', {
      email,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'If this email exists, an OTP has been sent',
      email: email,
    };
  }

  // Per-email cooldown (~2 min) to stop email bombing via reloads.
  if (user.resetPasswordOTPExpires) {
    const remaining = new Date(user.resetPasswordOTPExpires).getTime() - Date.now();
    if (remaining > 3 * 60 * 1000) {
      return {
        message: 'If this email exists, an OTP has been sent',
        email,
      };
    }
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
  const hashedOtp = await tokenService.hashOtp(otp);

  await user.update({
    resetPasswordOTP: hashedOtp,
    resetPasswordOTPExpires: otpExpires,
    otpAttempts: 0,
    otpLockedUntil: null,
  });

  const logger = require('../config/logger');
  logger.info('[SECURITY] Password reset OTP generated', {
    email: user.email,
    timestamp: new Date().toISOString(),
  });

  // Send OTP via email
  try {
    const emailService = require('./email.service');
    const subject = 'Kode Reset Password - Freshly';
    const text = `Kode OTP reset password Anda: ${otp}\nKode ini akan kedaluwarsa dalam 5 menit.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Password Reset Request</h2>
        <p>Hi ${user.first_name},</p>
        <p>We received a request to reset your password. Use the OTP below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; letter-spacing: 5px; font-size: 24px; font-weight: bold; color: #4CAF50; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        <p style="color: #d32f2f; font-weight: bold;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 5px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          This OTP will expire in 5 minutes.
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Never share your OTP with anyone.</p>
      </div>
    `;

    await emailService.sendEmail(user.email, subject, text, html);
    logger.info(`Password reset OTP sent to ${user.email}`);
  } catch (error) {
    logger.warn(`Failed to send OTP email to ${user.email}`, { error: error.message });
    throw new ApiError(500, 'Failed to send OTP email', ERROR_CODES.INTERNAL_ERROR);
  }

  return {
    message: 'If this email exists, an OTP has been sent',
    email: email,
  };
};

const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(400, 'No password reset request found for this email', ERROR_CODES.VALIDATION_ERROR);
  }

  // Check if OTP verification is locked
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
    throw new ApiError(
      403,
      `Too many OTP attempts. Try again in ${remainingMinutes} minute(s)`,
      ERROR_CODES.ACCOUNT_LOCKED
    );
  }

  if (!user.resetPasswordOTP) {
    throw new ApiError(400, 'No password reset request found', ERROR_CODES.VALIDATION_ERROR);
  }

  if (new Date() > user.resetPasswordOTPExpires) {
    await user.update({
      resetPasswordOTP: null,
      resetPasswordOTPExpires: null,
      otpAttempts: 0,
    });
    throw new ApiError(400, 'OTP has expired. Please request a new one.', ERROR_CODES.INVALID_CREDENTIALS);
  }

  const isOtpValid = await tokenService.compareOtp(otp, user.resetPasswordOTP);
  if (!isOtpValid) {
    const newAttempts = (user.otpAttempts || 0) + 1;
    const updateData = { otpAttempts: newAttempts };

    if (newAttempts >= 3) {
      updateData.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      updateData.resetPasswordOTP = null;
      updateData.resetPasswordOTPExpires = null;

      await user.update(updateData);

      const logger = require('../config/logger');
      logger.warn('[SECURITY] OTP locked due to too many attempts', {
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      throw new ApiError(
        403,
        'Too many failed attempts. OTP has been invalidated. Please request a new one in 30 minutes.',
        ERROR_CODES.ACCOUNT_LOCKED
      );
    }

    await user.update(updateData);

    const remainingAttempts = 3 - newAttempts;
    throw new ApiError(
      400,
      `Invalid OTP. ${remainingAttempts} attempt(s) remaining`,
      ERROR_CODES.INVALID_CREDENTIALS
    );
  }

  await user.update({
    otpAttempts: 0,
    otpLockedUntil: null,
  });

  const logger = require('../config/logger');
  logger.info('[SECURITY] OTP verified successfully', {
    email: user.email,
    timestamp: new Date().toISOString(),
  });

  return {
    message: 'OTP verified successfully',
    email: user.email,
  };
};

const resetPasswordWithOTP = async (email, otp, newPassword) => {
  const sequelize = require('../config/database');

  return sequelize.transaction(async (t) => {
    // Lock the user row to prevent concurrent OTP reuse.
    const user = await User.findOne({
      where: { email },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!user) {
      throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
    }

    // Verify OTP inline (atomic within the same transaction).
    if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.otpLockedUntil - new Date()) / 60000);
      throw new ApiError(403, `Too many OTP attempts. Try again in ${remainingMinutes} minute(s)`, ERROR_CODES.ACCOUNT_LOCKED);
    }

    if (!user.resetPasswordOTP) {
      throw new ApiError(400, 'No password reset request found', ERROR_CODES.VALIDATION_ERROR);
    }

    if (new Date() > user.resetPasswordOTPExpires) {
      await user.update({ resetPasswordOTP: null, resetPasswordOTPExpires: null, otpAttempts: 0 }, { transaction: t });
      throw new ApiError(400, 'OTP has expired. Please request a new one.', ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isOtpValid = await tokenService.compareOtp(otp, user.resetPasswordOTP);
    if (!isOtpValid) {
      const newAttempts = (user.otpAttempts || 0) + 1;
      const updateData = { otpAttempts: newAttempts };

      if (newAttempts >= 3) {
        updateData.otpLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        updateData.resetPasswordOTP = null;
        updateData.resetPasswordOTPExpires = null;
        await user.update(updateData, { transaction: t });
        throw new ApiError(403, 'Too many failed attempts. OTP invalidated. Request a new one in 30 minutes.', ERROR_CODES.ACCOUNT_LOCKED);
      }

      await user.update(updateData, { transaction: t });
      throw new ApiError(400, `Invalid OTP. ${3 - newAttempts} attempt(s) remaining`, ERROR_CODES.INVALID_CREDENTIALS);
    }

    // OTP valid — reset password and clear OTP atomically.
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      resetPasswordOTP: null,
      resetPasswordOTPExpires: null,
      otpAttempts: 0,
      otpLockedUntil: null,
    }, { transaction: t });

    // Invalidate all refresh tokens so stolen sessions can't persist.
    await Token.destroy({
      where: { user_id: user.id, type: 'refresh' },
      transaction: t,
    });

    logger.info('[SECURITY] Password reset successfully via OTP for user: %s', user.email);

    return { message: 'Password reset successfully' };
  });
};

module.exports = {
  registerUser,
  resendVerificationEmail,
  loginUserWithEmailAndPassword,
  verifyEmail,
  loginWithGoogle,
  loginWithGitHub,
  loginWithMicrosoft,
  logOut,
  refreshAuth,
  changePassword,
  deleteMe,
  forgotPassword,
  verifyOTP,
  resetPasswordWithOTP,
};
