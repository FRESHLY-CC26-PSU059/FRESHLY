const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const usersValidation = require('../validations/users.validation');
const usersController = require('../controllers/users.controller');
const { uploadRateLimiter } = require('../middlewares/rateLimiter.middleware');

const upload = require('../middlewares/upload.middleware');
const { validateImageBuffer } = require('../middlewares/upload.middleware');

const router = express.Router();

// Get current user (me)
router.get('/me', auth(), usersController.getCurrentUser);

// Update current user
router.patch('/me', auth(), validate(usersValidation.updateMe), usersController.updateMe);

// Update avatar
router.post(
  '/me/avatar',
  auth(),
  uploadRateLimiter,
  upload.single('avatar'),
  validateImageBuffer,
  usersController.updateMyAvatar,
);

// Get all users (paginated)
router.get('/', auth('admin', 'super_admin'), validate(usersValidation.getUsers), usersController.getUsers);

// Get specific user
router.get('/:userId', auth('admin', 'super_admin'), validate(usersValidation.getUser), usersController.getUser);

// Create new user (admin only)
router.post('/', auth('admin', 'super_admin'), validate(usersValidation.createUser), usersController.createUser);

// Update user (admin only)
router.patch('/:userId', auth('admin', 'super_admin'), validate(usersValidation.updateUser), usersController.updateUser);

// Delete user (admin only)
router.delete('/:userId', auth('admin', 'super_admin'), validate(usersValidation.deleteUser), usersController.deleteUser);

module.exports = router;
