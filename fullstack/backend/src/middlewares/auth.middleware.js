const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const { User, Role } = require('../models');

const auth =
  (...requiredRoles) =>
  async (req, _res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new ApiError(401, 'Please authenticate', ERROR_CODES.UNAUTHORIZED);
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.sub, {
        attributes: ['id', 'first_name', 'last_name', 'email', 'isActive', 'role_id'],
        include: [{ model: Role, as: 'role', attributes: ['id', 'role_name', 'enabled'] }],
      });

      if (!user) {
        throw new ApiError(401, 'User not found', ERROR_CODES.UNAUTHORIZED);
      }

      if (!user.isActive) {
        throw new ApiError(403, 'Account is deactivated', ERROR_CODES.FORBIDDEN);
      }

      // Revoke access instantly if the role itself was disabled.
      if (user.role && user.role.enabled === false) {
        throw new ApiError(403, 'Role has been disabled', ERROR_CODES.FORBIDDEN);
      }

      const roleName = user.role?.role_name;
      if (requiredRoles.length && (!roleName || !requiredRoles.includes(roleName))) {
        throw new ApiError(403, 'Forbidden', ERROR_CODES.FORBIDDEN);
      }

      // Attach minimal user info to request
      req.user = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: roleName,
        isActive: user.isActive,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token expired', ERROR_CODES.TOKEN_EXPIRED));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token', ERROR_CODES.TOKEN_INVALID));
      }
      next(new ApiError(401, 'Please authenticate', ERROR_CODES.UNAUTHORIZED));
    }
  };

module.exports = auth;
