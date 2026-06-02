const catchAsync = require('../utils/catch-async');
const rolesService = require('../services/roles.service');
const auditLog = require('../services/audit-log.service');

const getRoles = catchAsync(async (req, res) => {
  const result = await rolesService.getRoles(req.query);
  res.json({ 
    status: 'success', 
    data: { 
      roles: result.roles, 
      pagination: result.pagination 
    } 
  });
});

const getRole = catchAsync(async (req, res) => {
  const role = await rolesService.getRoleById(req.params.roleId);
  res.json({ status: 'success', data: { role } });
});

const createRole = catchAsync(async (req, res) => {
  const role = await rolesService.createRole(req.body);

  await auditLog.log({
    userId: req.user.id,
    action: 'create',
    entity: 'role',
    entityId: role.id,
    details: `Created role: ${role.role_name}`,
    ipAddress: req.ip,
  });

  res.status(201).json({ status: 'success', data: { role } });
});

const updateRole = catchAsync(async (req, res) => {
  const role = await rolesService.updateRole(req.params.roleId, req.body);

  await auditLog.log({
    userId: req.user.id,
    action: 'update',
    entity: 'role',
    entityId: parseInt(req.params.roleId),
    details: `Updated role: ${role.role_name}`,
    ipAddress: req.ip,
  });

  res.json({ status: 'success', data: { role } });
});

const deleteRole = catchAsync(async (req, res) => {
  await rolesService.deleteRole(req.params.roleId);

  await auditLog.log({
    userId: req.user.id,
    action: 'delete',
    entity: 'role',
    entityId: parseInt(req.params.roleId),
    details: `Deleted role #${req.params.roleId}`,
    ipAddress: req.ip,
  });

  res.status(204).send();
});

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole };
