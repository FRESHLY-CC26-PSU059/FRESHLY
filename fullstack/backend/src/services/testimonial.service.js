const { Feedback, User } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

/**
 * Get testimonials (admin - all testimonials)
 */
const getTestimonials = async (query) => {
  const { page = 1, limit = 20, is_displayed } = query;
  const offset = (page - 1) * limit;
  const where = {};
  
  if (is_displayed !== undefined) {
    where.is_displayed = is_displayed === 'true';
  }

  const { count, rows } = await Feedback.findAndCountAll({
    where,
    offset,
    limit: parseInt(limit),
    include: ['user'],
    order: [['createdAt', 'DESC']],
  });

  return {
    testimonials: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
  };
};

/**
 * Get public testimonials (landing page - only displayed ones)
 */
const getPublicTestimonials = async (query) => {
  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const { count, rows } = await Feedback.findAndCountAll({
    where: { is_displayed: true },
    offset,
    limit: parseInt(limit),
    include: ['user'],
    order: [['createdAt', 'DESC']],
  });

  return {
    testimonials: rows,
    pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
  };
};

/**
 * Get user's testimonials
 */
const getUserTestimonials = async (userId) => {
  const testimonials = await Feedback.findAll({
    where: { user_id: userId },
    include: ['user'],
    order: [['createdAt', 'DESC']],
  });

  return testimonials;
};

/**
 * Create testimonial (authenticated users)
 */
const createTestimonial = async (body, userId) => {
  if (!userId) {
    throw new ApiError(401, 'User must be authenticated', ERROR_CODES.UNAUTHORIZED);
  }

  const user = await User.findByPk(userId, { attributes: ['first_name', 'last_name', 'email'] });
  if (!user) {
    throw new ApiError(404, 'User not found', ERROR_CODES.NOT_FOUND);
  }

  return Feedback.create({
    user_id: userId,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    message: body.message,
    rating: body.rating,
    is_displayed: false, // Default to false, admin approves
  });
};

/**
 * Update testimonial (user updates own, admin updates any)
 */
const updateTestimonial = async (id, body, userId, isAdmin = false) => {
  const testimonial = await Feedback.findByPk(id, {
    include: ['user'],
  });

  if (!testimonial) {
    throw new ApiError(404, 'Testimonial not found', ERROR_CODES.NOT_FOUND);
  }

  // Authorization check
  if (!isAdmin && testimonial.user_id !== userId) {
    throw new ApiError(403, 'Not authorized to update this testimonial', ERROR_CODES.FORBIDDEN);
  }

  const updateData = {};
  if (body.message) updateData.message = body.message;
  if (body.rating) updateData.rating = body.rating;
  if (isAdmin && body.is_displayed !== undefined) {
    updateData.is_displayed = body.is_displayed;
  }

  await testimonial.update(updateData);
  return testimonial;
};

/**
 * Update testimonial display status (admin only)
 */
const updateTestimonialDisplay = async (id, is_displayed) => {
  const testimonial = await Feedback.findByPk(id);
  if (!testimonial) {
    throw new ApiError(404, 'Testimonial not found', ERROR_CODES.NOT_FOUND);
  }

  await testimonial.update({ is_displayed });
  return testimonial;
};

/**
 * Delete testimonial (user deletes own, admin deletes any)
 */
const deleteTestimonial = async (id, userId, isAdmin = false) => {
  const testimonial = await Feedback.findByPk(id);
  if (!testimonial) {
    throw new ApiError(404, 'Testimonial not found', ERROR_CODES.NOT_FOUND);
  }

  // Authorization check
  if (!isAdmin && testimonial.user_id !== userId) {
    throw new ApiError(403, 'Not authorized to delete this testimonial', ERROR_CODES.FORBIDDEN);
  }

  await testimonial.destroy();
};

module.exports = {
  getTestimonials,
  getPublicTestimonials,
  getUserTestimonials,
  createTestimonial,
  updateTestimonial,
  updateTestimonialDisplay,
  deleteTestimonial,
};
