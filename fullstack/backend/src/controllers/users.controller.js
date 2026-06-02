const catchAsync = require('../utils/catch-async');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');
const usersService = require('../services/users.service');
const auditLog = require('../services/audit-log.service');

const getUsers = catchAsync(async (req, res) => {
  const result = await usersService.getUsers(req.query);
  res.json({ status: 'success', data: { users: result.users, pagination: result.pagination } });
});

const getUser = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.params.userId);
  res.json({ status: 'success', data: { user } });
});

const createUser = catchAsync(async (req, res) => {
  const user = await usersService.createUser(req.body, req.user);

  await auditLog.log({
    userId: req.user.id,
    action: 'create',
    entity: 'user',
    entityId: user.id,
    details: `Created user: ${user.email}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ status: 'success', data: { user } });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await usersService.updateUser(req.params.userId, req.body, req.user);

  await auditLog.log({
    userId: req.user.id,
    action: 'update',
    entity: 'user',
    entityId: parseInt(req.params.userId),
    details: `Updated user: ${user.email}`,
    ipAddress: req.ip,
  });

  res.json({ status: 'success', data: { user } });
});

const deleteUser = catchAsync(async (req, res) => {
  await usersService.deleteUser(req.params.userId, req.user);

  await auditLog.log({
    userId: req.user.id,
    action: 'delete',
    entity: 'user',
    entityId: parseInt(req.params.userId),
    details: `Deleted user #${req.params.userId}`,
    ipAddress: req.ip,
  });

  res.status(204).send();
});

const getCurrentUser = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.user.id);
  res.json({ status: 'success', data: { user } });
});

const updateMe = catchAsync(async (req, res) => {
  const user = await usersService.updateUser(req.user.id, req.body, req.user);

  await auditLog.log({
    userId: req.user.id,
    action: 'update_profile',
    entity: 'user',
    entityId: req.user.id,
    details: 'Updated own profile',
    ipAddress: req.ip,
  });

  res.json({ status: 'success', data: { user } });
});

const updateMyAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image', ERROR_CODES.VALIDATION_ERROR);
  }

  const { saveImage, deleteImage } = require('../utils/image');
  const imageUrl = await saveImage(req.file.buffer, 'avatars');

  const { oldImageUrl, user } = await usersService.updateAvatar(req.user.id, imageUrl);

  // Clean up old avatar if exists
  if (oldImageUrl) {
    await deleteImage(oldImageUrl);
  }

  await auditLog.log({
    userId: req.user.id,
    action: 'update_avatar',
    entity: 'user',
    entityId: req.user.id,
    details: 'Updated own avatar',
    ipAddress: req.ip,
  });

  const updatedUser = await usersService.getUserById(req.user.id);
  res.json({ status: 'success', data: { user: updatedUser } });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateMe,
  updateMyAvatar,
};
