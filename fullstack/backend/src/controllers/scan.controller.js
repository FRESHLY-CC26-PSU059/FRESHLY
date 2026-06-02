const catchAsync = require('../utils/catch-async');
const scanService = require('../services/scan.service');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

const analyze = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image file is required', ERROR_CODES.VALIDATION_ERROR);
  }

  const { fruit_type } = req.body;
  const scan = await scanService.analyzeScan(req.user.id, req.file.buffer, fruit_type, req.file.mimetype);

  res.status(201).json({
    status: 'success',
    data: { scan },
  });
});

const getScans = catchAsync(async (req, res) => {
  const result = await scanService.getUserScans(req.user.id, req.query);

  res.json({
    status: 'success',
    data: result.scans,
    pagination: result.pagination,
  });
});

const getScan = catchAsync(async (req, res) => {
  const scan = await scanService.getScanById(req.params.id, req.user.id);

  res.json({
    status: 'success',
    data: { scan },
  });
});

const deleteScan = catchAsync(async (req, res) => {
  await scanService.deleteScan(req.params.id, req.user.id);
  res.status(204).send();
});

const clearAllScans = catchAsync(async (req, res) => {
  await scanService.clearAllUserScans(req.user.id);
  res.status(204).send();
});

module.exports = { analyze, getScans, getScan, deleteScan, clearAllScans };
