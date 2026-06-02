const express = require('express');
const auth = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

router.use(auth());

router.get('/', notificationController.getNotifications);
router.post('/token', notificationController.updateToken);

// Literal paths first so Express does not match `/read-all` as :notificationId.
router.patch('/read-all', notificationController.markAllAsRead);
router.post('/broadcast', auth('admin', 'super_admin'), notificationController.sendBroadcast);
router.post('/send-to-user', auth('admin', 'super_admin'), notificationController.sendToUser);

router.patch('/:notificationId/read', notificationController.markAsRead);

module.exports = router;
