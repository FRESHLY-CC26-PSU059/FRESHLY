const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Role } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const logger = require('../config/logger');

// Role hierarchy for security checks
const ROLE_HIERARCHY = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

const USER_ATTRIBUTES = [
  'id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'gender',
  'address',
  'birthdate',
  'imgUrl',
  'isActive',
  'isEmailVerified',
  'lastLogin',
  'createdAt',
];

const ROLE_INCLUDE = {
  model: Role,
  as: 'role',
  attributes: ['id', 'role_name'],
};

const formatUser = (user) => ({
  id: user.id,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role?.role_name,
  phone: user.phone,
  gender: user.gender,
  address: user.address,
  birthdate: user.birthdate,
  imgUrl: user.imgUrl,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  lastLogin: user.lastLogin,
});

const getUsers = async ({ page, limit, search }) => {
  const where = {};

  if (search) {
    where[Op.or] = [
      { first_name: { [Op.iLike]: `%${search}%` } },
      { last_name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const queryOptions = {
    where,
    attributes: USER_ATTRIBUTES,
    include: [ROLE_INCLUDE],
    order: [['id', 'DESC']],
  };

  // Only apply pagination if limit is provided and greater than 0
  if (limit && parseInt(limit) > 0) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit);
    queryOptions.offset = (p - 1) * l;
    queryOptions.limit = l;
  }

  const { count, rows } = await User.findAndCountAll(queryOptions);

  const currentLimit = (limit && parseInt(limit) > 0) ? parseInt(limit) : count;

  return {
    users: rows.map(formatUser),
    pagination: {
      total: count,
      page: (limit && parseInt(limit) > 0) ? parseInt(page) || 1 : 1,
      limit: currentLimit,
      pages: (limit && parseInt(limit) > 0) ? Math.ceil(count / parseInt(limit)) : 1,
    },
  };
};

const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: USER_ATTRIBUTES,
    include: [ROLE_INCLUDE],
  });
  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }
  return formatUser(user);
};

const createUser = async (body, caller = null) => {
  const existingUser = await User.findOne({ where: { email: body.email } });
  if (existingUser) {
    throw new ApiError(409, 'Email already taken', ERROR_CODES.ALREADY_EXISTS);
  }

  const roleName = body.role_name || 'user';

  // Check role hierarchy - caller must have higher level than role being assigned
  const targetRoleLevel = ROLE_HIERARCHY[roleName] || 0;
  const callerRoleLevel = ROLE_HIERARCHY[caller?.role] || 0;

  if (targetRoleLevel > 1 && callerRoleLevel <= targetRoleLevel) {
    throw new ApiError(
      403,
      `Insufficient privileges to create ${roleName} account`,
      ERROR_CODES.FORBIDDEN,
    );
  }

  const role = await Role.findOne({ where: { role_name: roleName, enabled: true } });
  if (!role) {
    throw new ApiError(400, 'Invalid or disabled role', ERROR_CODES.VALIDATION_ERROR);
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  // Sanitize birthdate - convert to null if empty or invalid
  let birthdateValue = null;
  if (body.birthdate) {
    const bdParsed = new Date(body.birthdate);
    if (!isNaN(bdParsed.getTime())) {
      birthdateValue = bdParsed.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
  }

  const user = await User.create({
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    password: hashedPassword,
    role_id: role.id,
    phone: body.phone,
    gender: body.gender,
    address: body.address,
    birthdate: birthdateValue,
    isEmailVerified: false, // User must verify email
  });

  await user.reload({
    attributes: USER_ATTRIBUTES,
    include: [ROLE_INCLUDE],
  });

  // Generate verification token and send email
  try {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
    await emailService.sendVerificationEmail(user.email, verifyEmailToken, user.first_name);
    logger.info(`Verification email sent to ${user.email}`);
  } catch (error) {
    logger.warn(`Failed to send verification email to ${user.email}`, { error: error.message });
    // Don't throw error - user is created, just notify admin about email issue
  }

  return formatUser(user);
};

const updateUser = async (userId, body, caller = null) => {
  const user = await User.findByPk(userId, {
    include: [ROLE_INCLUDE],
  });
  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // Check role hierarchy - caller must have higher level than user being modified
  // Exception: users can update their own profile (except role changes)
  const callerRoleLevel = ROLE_HIERARCHY[caller?.role] || 0;
  const currentUserRoleLevel = ROLE_HIERARCHY[user.role?.role_name] || 0;
  const isSelfUpdate = caller?.id === user.id;

  if (!isSelfUpdate && callerRoleLevel <= currentUserRoleLevel) {
    throw new ApiError(
      403,
      `Insufficient privileges to modify ${user.role?.role_name} user`,
      ERROR_CODES.FORBIDDEN,
    );
  }

  // Build update object only with provided fields
  const updateData = {};
  if (body.first_name !== undefined) updateData.first_name = body.first_name;
  if (body.last_name !== undefined) updateData.last_name = body.last_name;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.gender !== undefined) updateData.gender = body.gender;
  if (body.address !== undefined) updateData.address = body.address;
  
  // Sanitize birthdate - convert to null if empty or invalid
  if (body.birthdate !== undefined) {
    let birthdateValue = null;
    if (body.birthdate) {
      const bdParsed = new Date(body.birthdate);
      if (!isNaN(bdParsed.getTime())) {
        birthdateValue = bdParsed.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    }
    updateData.birthdate = birthdateValue;
  }
  
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  // Role update logic
  if (body.role_name !== undefined) {
    // Users cannot change their own role
    if (isSelfUpdate) {
      throw new ApiError(
        403,
        'Cannot change your own role',
        ERROR_CODES.FORBIDDEN,
      );
    }

    // Get role hierarchy levels
    const targetRoleLevel = ROLE_HIERARCHY[body.role_name] || 0;
    const callerRoleLevel = ROLE_HIERARCHY[caller?.role] || 0;
    const currentUserRoleLevel = ROLE_HIERARCHY[user.role?.role_name] || 0;

    // Caller must have higher level than both target role AND current user role
    if (callerRoleLevel <= targetRoleLevel) {
      throw new ApiError(
        403,
        `Insufficient privileges to assign ${body.role_name} role`,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (callerRoleLevel <= currentUserRoleLevel) {
      throw new ApiError(
        403,
        `Insufficient privileges to modify ${user.role?.role_name} user`,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const role = await Role.findOne({ where: { role_name: body.role_name, enabled: true } });
    if (!role) {
      throw new ApiError(400, 'Invalid or disabled role', ERROR_CODES.VALIDATION_ERROR);
    }
    updateData.role_id = role.id;
  }

  await user.update(updateData);
  await user.reload({
    attributes: USER_ATTRIBUTES,
    include: [ROLE_INCLUDE],
  });

  return formatUser(user);
};

const deleteUser = async (userId, caller = null) => {
  const user = await User.findByPk(userId, {
    include: [ROLE_INCLUDE],
  });
  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  // Check role hierarchy - caller must have higher level than user being deleted
  const callerRoleLevel = ROLE_HIERARCHY[caller?.role] || 0;
  const targetUserRoleLevel = ROLE_HIERARCHY[user.role?.role_name] || 0;

  if (callerRoleLevel <= targetUserRoleLevel) {
    throw new ApiError(
      403,
      `Insufficient privileges to delete ${user.role?.role_name} user`,
      ERROR_CODES.FORBIDDEN,
    );
  }

  await user.destroy();
};

const updateAvatar = async (userId, imageUrl) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  const oldImageUrl = user.imgUrl;
  await user.update({ imgUrl: imageUrl });

  return { oldImageUrl, user };
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateAvatar,
};
