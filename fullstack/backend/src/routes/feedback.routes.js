const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const feedbackValidation = require('../validations/feedback.validation');
const feedbackController = require('../controllers/feedback.controller');

const router = express.Router();

// Public: anyone can submit feedback
router.post('/', validate(feedbackValidation.createFeedback), feedbackController.createFeedback);

// Admin: manage feedbacks
router.get('/', auth('admin', 'super_admin'), validate(feedbackValidation.getFeedbacks), feedbackController.getFeedbacks);
router.patch('/:id/status', auth('admin', 'super_admin'), validate(feedbackValidation.updateStatus), feedbackController.updateStatus);
router.delete('/:id', auth('admin', 'super_admin'), validate(feedbackValidation.deleteFeedback), feedbackController.deleteFeedback);

module.exports = router;
