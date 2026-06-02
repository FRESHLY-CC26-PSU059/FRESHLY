const catchAsync = require('../utils/catch-async');
const auditLogService = require('../services/audit-log.service');

const getLogs = catchAsync(async (req, res) => {
  const result = await auditLogService.getLogs(req.query);
  res.json({ status: 'success', data: result });
});

module.exports = { getLogs };
