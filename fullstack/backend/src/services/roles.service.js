const { Op } = require('sequelize');
const { Role, User } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

/**
 * Reserved system roles that cannot be deleted or renamed.
 */
const SYSTEM_ROLES = ['super_admin', 'admin', 'user'];

const getRoles = async ({ page, limit, search = '' }) => {
  const where = {};

  if (search) {
    where.role_name = { [Op.iLike]: `%${search}%` };
  }

  const queryOptions = {
    where,
    attributes: ['id', 'role_name', 'enabled', 'createdAt', 'updatedAt'],
    order: [['id', 'ASC']],
  };

  // Only apply pagination if limit is provided and greater than 0
  if (limit && parseInt(limit) > 0) {
    const p = parseInt(page) || 1;
    const l = parseInt(limit);
    queryOptions.offset = (p - 1) * l;
    queryOptions.limit = l;
  }

  const { count, rows } = await Role.findAndCountAll(queryOptions);

  const currentLimit = (limit && parseInt(limit) > 0) ? parseInt(limit) : count;

  return {
    roles: rows,
    pagination: {
      total: count,
      page: (limit && parseInt(limit) > 0) ? parseInt(page) || 1 : 1,
      limit: currentLimit,
      pages: (limit && parseInt(limit) > 0) ? Math.ceil(count / parseInt(limit)) : 1,
    },
  };
};

const getRoleById = async (roleId) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found', ERROR_CODES.NOT_FOUND);
  }
  return role;
};

const createRole = async (body) => {
  const existing = await Role.findOne({ where: { role_name: body.role_name } });
  if (existing) {
    throw new ApiError(409, 'Role name already exists', ERROR_CODES.ALREADY_EXISTS);
  }

  return Role.create({
    role_name: body.role_name,
    enabled: body.enabled ?? true,
  });
};

const updateRole = async (roleId, body) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found', ERROR_CODES.NOT_FOUND);
  }

  // Prevent renaming system roles
  if (body.role_name && body.role_name !== role.role_name && SYSTEM_ROLES.includes(role.role_name)) {
    throw new ApiError(403, `Cannot rename system role "${role.role_name}"`, ERROR_CODES.FORBIDDEN);
  }

  // Check uniqueness if name is changing
  if (body.role_name && body.role_name !== role.role_name) {
    const existing = await Role.findOne({ where: { role_name: body.role_name } });
    if (existing) {
      throw new ApiError(409, 'Role name already exists', ERROR_CODES.ALREADY_EXISTS);
    }
  }

  const updateData = {};
  if (body.role_name !== undefined) updateData.role_name = body.role_name;
  if (body.enabled !== undefined) updateData.enabled = body.enabled;

  await role.update(updateData);
  return role;
};

const deleteRole = async (roleId) => {
  const role = await Role.findByPk(roleId);
  if (!role) {
    throw new ApiError(404, 'Role not found', ERROR_CODES.NOT_FOUND);
  }

  // Prevent deleting system roles
  if (SYSTEM_ROLES.includes(role.role_name)) {
    throw new ApiError(403, `Cannot delete system role "${role.role_name}"`, ERROR_CODES.FORBIDDEN);
  }

  // Prevent deleting roles that are assigned to users
  const userCount = await User.count({ where: { role_id: roleId } });
  if (userCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete role "${role.role_name}" — it is assigned to ${userCount} user(s)`,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  await role.destroy();
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
