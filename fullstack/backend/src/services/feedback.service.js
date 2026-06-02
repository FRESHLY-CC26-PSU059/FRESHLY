const { Feedback, User } = require('../models');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

const getFeedbacks = async (query) => {
  const { page = 1, limit = 20, status } = query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await Feedback.findAndCountAll({
    where,
    offset,
    limit: parseInt(limit),
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }],
    order: [['createdAt', 'DESC']],
  });

  return {
    feedbacks: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
  };
};

const createFeedback = async (body, userId) => {
  return Feedback.create({
    user_id: userId || null,
    name: body.name,
    email: body.email,
    message: body.message,
    rating: body.rating,
  });
};

const updateFeedbackStatus = async (id, status) => {
  const feedback = await Feedback.findByPk(id);
  if (!feedback) throw new ApiError(404, 'Feedback not found', ERROR_CODES.NOT_FOUND);
  await feedback.update({ status });
  return feedback;
};

const deleteFeedback = async (id) => {
  const feedback = await Feedback.findByPk(id);
  if (!feedback) throw new ApiError(404, 'Feedback not found', ERROR_CODES.NOT_FOUND);
  await feedback.destroy();
};

module.exports = { getFeedbacks, createFeedback, updateFeedbackStatus, deleteFeedback };
