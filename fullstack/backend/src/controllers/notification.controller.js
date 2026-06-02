const catchAsync = require('../utils/catch-async');
const notificationService = require('../services/notification.service');
const logger = require('../config/logger');

const getNotifications = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  
  const notifications = await notificationService.getUserNotifications(req.user.id, { limit, offset });
  
  res.send({
    status: 'success',
    data: notifications,
  });
});

const updateToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).send({ status: 'error', message: 'Token is required' });
  }
  
  await notificationService.updateFcmToken(req.user.id, token);
  
  res.send({
    status: 'success',
    message: 'FCM token updated successfully',
  });
});

const markAsRead = catchAsync(async (req, res) => {
  await notificationService.markAsRead(req.params.notificationId, req.user.id);
  
  res.send({
    status: 'success',
    message: 'Notification marked as read',
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  
  res.send({
    status: 'success',
    message: 'All notifications marked as read',
  });
});

const sendBroadcast = catchAsync(async (req, res) => {
  const { title, body, data, type } = req.body;
  
  if (!title || !body) {
    return res.status(400).send({ 
      status: 'error', 
      message: 'Title and body are required' 
    });
  }
  
  try {
    const result = await notificationService.sendBroadcastNotification({ 
      title, 
      body, 
      data: data || {}, 
      type: type || 'broadcast' 
    });
    
    return res.send({
      status: 'success',
      message: `Broadcast notification sent successfully to ${result.sent} users`,
      data: {
        sent: result.sent || 0,
        failed: result.failed || 0,
        total: result.total || 0,
        message: result.message
      },
    });
  } catch (error) {
    logger.error('Broadcast error: %s', error.message);
    throw error;
  }
});

const sendToUser = catchAsync(async (req, res) => {
  const { userId, title, body, data, type } = req.body;
  
  if (!userId || !title || !body) {
    return res.status(400).send({ status: 'error', message: 'UserId, title, and body are required' });
  }
  
  const notification = await notificationService.sendNotification({ userId, title, body, data, type });
  
  res.send({
    status: 'success',
    message: 'Notification sent to user',
    data: notification,
  });
});

module.exports = {
  getNotifications,
  updateToken,
  markAsRead,
  markAllAsRead,
  sendBroadcast,
  sendToUser,
};
