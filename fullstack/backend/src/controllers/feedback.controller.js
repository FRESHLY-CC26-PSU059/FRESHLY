const catchAsync = require('../utils/catch-async');
const feedbackService = require('../services/feedback.service');

const getFeedbacks = catchAsync(async (req, res) => {
  const result = await feedbackService.getFeedbacks(req.query);
  res.json({ status: 'success', data: result });
});

const createFeedback = catchAsync(async (req, res) => {
  const userId = req.user?.id || null;
  const feedback = await feedbackService.createFeedback(req.body, userId);
  res.status(201).json({ status: 'success', data: { feedback } });
});

const updateStatus = catchAsync(async (req, res) => {
  const feedback = await feedbackService.updateFeedbackStatus(req.params.id, req.body.status);
  res.json({ status: 'success', data: { feedback } });
});

const deleteFeedback = catchAsync(async (req, res) => {
  await feedbackService.deleteFeedback(req.params.id);
  res.status(204).send();
});

module.exports = { getFeedbacks, createFeedback, updateStatus, deleteFeedback };
