const catchAsync = require('../utils/catch-async');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const auditLog = require('../services/audit-log.service');
const ApiError = require('../utils/api-error');
const logger = require('../config/logger');

const emailService = require('../services/email.service');

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);

  if (user) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken, user.first_name);

    await auditLog.log({
      userId: user.id,
      action: 'register',
      entity: 'user',
      entityId: user.id,
      details: `User registered (pending verification): ${user.email}`,
      ipAddress: req.ip,
    });
  }

  // Always respond with the same generic success message to prevent
  // enumeration of existing verified accounts.
  res.status(201).send({
    status: 'success',
    message: 'Registration successful! Please check your email to verify your account.',
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(200).send({
    status: 'success',
    message: 'Email verified successfully! You can now log in.',
  });
});

const resendVerification = catchAsync(async (req, res) => {
  const user = await authService.resendVerificationEmail(req.body.email);

  if (user) {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken, user.first_name);
  }

  // Generic response regardless of whether the email exists / is verified —
  // prevents enumeration of existing accounts.
  res.status(200).send({
    status: 'success',
    message: 'If the email exists and is not yet verified, a verification message has been sent.',
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, recaptchaToken, fcmToken } = req.body;

  logger.debug('Login attempt', {
    email,
    hasRecaptcha: !!recaptchaToken,
    hasFcmToken: !!fcmToken,
  });

  const user = await authService.loginUserWithEmailAndPassword(email, password);

  // Save FCM token if provided; failure must not block login.
  if (fcmToken) {
    try {
      await user.update({ fcmToken });
    } catch (fcmError) {
      logger.error('Failed to save FCM token:', {
        userId: user.id,
        error: fcmError.message,
      });
    }
  }

  const tokens = await tokenService.generateAuthTokens(user);

  await auditLog.log({
    userId: user.id,
    action: 'login',
    entity: 'user',
    entityId: user.id,
    details: `User logged in: ${user.email}`,
    ipAddress: req.ip,
  });

  res.send({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role?.role_name,
        imgUrl: user.imgUrl,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        birthdate: user.birthdate,
      },
      tokens,
    },
  });
});


const googleLogin = catchAsync(async (req, res) => {
  const { idToken, recaptchaToken, fcmToken } = req.body;

  logger.debug('Google login attempt', {
    hasRecaptcha: !!recaptchaToken,
    hasFcmToken: !!fcmToken,
  });

  const user = await authService.loginWithGoogle(idToken);

  if (fcmToken) {
    try {
      await user.update({ fcmToken });
    } catch (fcmError) {
      logger.error('Failed to save FCM token for Google user:', {
        userId: user.id,
        error: fcmError.message,
      });
    }
  }

  const tokens = await tokenService.generateAuthTokens(user);

  await auditLog.log({
    userId: user.id,
    action: 'login_google',
    entity: 'user',
    entityId: user.id,
    details: `User logged in with Google: ${user.email}`,
    ipAddress: req.ip,
  });

  res.send({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role?.role_name,
        imgUrl: user.imgUrl,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        birthdate: user.birthdate,
      },
      tokens,
    },
  });
});

const microsoftLogin = catchAsync(async (req, res) => {
  const { idToken, recaptchaToken, fcmToken } = req.body;

  logger.debug('Microsoft login attempt', {
    hasRecaptcha: !!recaptchaToken,
    hasFcmToken: !!fcmToken,
  });

  const user = await authService.loginWithMicrosoft(idToken);

  if (fcmToken) {
    try {
      await user.update({ fcmToken });
    } catch (fcmError) {
      logger.error('Failed to save FCM token for Microsoft user:', {
        userId: user.id,
        error: fcmError.message,
      });
    }
  }

  const tokens = await tokenService.generateAuthTokens(user);

  await auditLog.log({
    userId: user.id,
    action: 'login_microsoft',
    entity: 'user',
    entityId: user.id,
    details: `User logged in with Microsoft: ${user.email}`,
    ipAddress: req.ip,
  });

  res.send({
    status: 'success',
    data: {
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role?.role_name,
        imgUrl: user.imgUrl,
        phone: user.phone,
        gender: user.gender,
        address: user.address,
        birthdate: user.birthdate,
      },
      tokens,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logOut(req.body.refreshToken);
  res.status(200).send({ message: 'Logout successful' });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);

  await auditLog.log({
    userId: req.user.id,
    action: 'change_password',
    entity: 'user',
    entityId: req.user.id,
    details: 'User changed password',
    ipAddress: req.ip,
  });

  res.json({ status: 'success', message: 'Password changed successfully' });
});

const deleteMe = catchAsync(async (req, res) => {
  await authService.deleteMe(req.user.id, req.body.password);

  await auditLog.log({
    userId: req.user.id,
    action: 'delete_account',
    entity: 'user',
    entityId: req.user.id,
    details: 'User deleted their own account',
    ipAddress: req.ip,
  });

  res.json({ status: 'success', message: 'Account deleted successfully' });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  await auditLog.log({
    userId: null,
    action: 'forgot_password',
    entity: 'user',
    entityId: null,
    details: `Password reset requested for: ${email}`,
    ipAddress: req.ip,
  });

  res.json({
    status: 'success',
    message: result.message,
    data: { email: result.email },
  });
});

const verifyOTP = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyOTP(email, otp);

  res.json({
    status: 'success',
    message: result.message,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await authService.resetPasswordWithOTP(email, otp, newPassword);

  await auditLog.log({
    userId: null,
    action: 'reset_password',
    entity: 'user',
    entityId: null,
    details: `Password reset via OTP for: ${email}`,
    ipAddress: req.ip,
  });

  res.json({
    status: 'success',
    message: result.message,
  });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  googleLogin,
  microsoftLogin,
  logout,
  refreshTokens,
  changePassword,
  deleteMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
