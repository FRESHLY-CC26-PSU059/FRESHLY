const express = require('express');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const testimonialController = require('../controllers/testimonial.controller');
const testimonialValidation = require('../validations/testimonial.validation');

const router = express.Router();

// Public routes
router.get('/public', validate(testimonialValidation.getPublicTestimonials), testimonialController.getPublicTestimonials);

// Authenticated user routes
router.post(
  '/',
  auth(),
  validate(testimonialValidation.createTestimonial),
  testimonialController.createTestimonial,
);

router.get('/user/me', auth(), testimonialController.getUserTestimonials);

router.patch('/:id', auth(), validate(testimonialValidation.updateTestimonial), testimonialController.updateTestimonial);

router.delete('/:id', auth(), validate(testimonialValidation.deleteTestimonial), testimonialController.deleteTestimonial);

// Admin routes
router.get('/', auth('admin', 'super_admin'), validate(testimonialValidation.getTestimonials), testimonialController.getTestimonials);

router.patch(
  '/:id/display',
  auth('admin', 'super_admin'),
  validate(testimonialValidation.updateDisplay),
  testimonialController.updateDisplay,
);

module.exports = router;
