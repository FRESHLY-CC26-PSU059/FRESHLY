const testimonialService = require('../services/testimonial.service');
const catchAsync = require('../utils/catch-async');

const getTestimonials = catchAsync(async (req, res) => {
  const result = await testimonialService.getTestimonials(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

const getPublicTestimonials = catchAsync(async (req, res) => {
  const result = await testimonialService.getPublicTestimonials(req.query);
  res.status(200).json({
    success: true,
    data: result,
  });
});

const getUserTestimonials = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const testimonials = await testimonialService.getUserTestimonials(userId);
  res.status(200).json({
    success: true,
    data: { testimonials },
  });
});

const createTestimonial = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const testimonial = await testimonialService.createTestimonial(req.body, userId);
  res.status(201).json({
    success: true,
    data: { testimonial },
  });
});

const updateTestimonial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  
  const testimonial = await testimonialService.updateTestimonial(id, req.body, userId, isAdmin);
  res.status(200).json({
    success: true,
    data: { testimonial },
  });
});

const updateDisplay = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { is_displayed } = req.body;
  
  const testimonial = await testimonialService.updateTestimonialDisplay(id, is_displayed);
  res.status(200).json({
    success: true,
    data: { testimonial },
  });
});

const deleteTestimonial = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
  
  await testimonialService.deleteTestimonial(id, userId, isAdmin);
  res.status(200).json({
    success: true,
    message: 'Testimonial deleted successfully',
  });
});

module.exports = {
  getTestimonials,
  getPublicTestimonials,
  getUserTestimonials,
  createTestimonial,
  updateTestimonial,
  updateDisplay,
  deleteTestimonial,
};
