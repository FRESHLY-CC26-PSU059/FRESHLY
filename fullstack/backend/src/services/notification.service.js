const { admin } = require('../config/firebase');
const { Notification, User } = require('../models');
const logger = require('../config/logger');

/**
 * Send push notification and save to database
 * @param {Object} options
 * @param {number} options.userId
 * @param {string} options.title
 * @param {string} options.body
 * @param {Object} [options.data]
 * @param {string} [options.type]
 * @returns {Promise<void>}
 */
const sendNotification = async ({ userId, title, body, data = {}, type = 'info' }) => {
  try {
    // 1. Save to database
    const notification = await Notification.create({
      user_id: userId,
      title,
      message: body,
      type,
      data,
    });

    // 2. Get user's FCM token
    const user = await User.findByPk(userId, { attributes: ['fcmToken'] });
    
    if (user && user.fcmToken) {
      const message = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          notificationId: notification.id.toString(),
          type,
        },
        token: user.fcmToken,
      };

      // 3. Send via Firebase
      const response = await admin.messaging().send(message);
      logger.info('Push notification sent successfully:', response);
    } else {
      logger.info(`User ${userId} has no FCM token. Notification saved to DB only.`);
    }
    
    return notification;
  } catch (error) {
    logger.error('Error sending notification:', error);
    // We don't throw here to prevent breaking the main flow if push fails
  }
};

/**
 * Get user notifications
 * @param {number} userId
 * @param {Object} options
 * @returns {Promise<Notification[]>}
 */
const getUserNotifications = async (userId, { limit = 20, offset = 0 } = {}) => {
  return Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
};

/**
 * Mark notification as read
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<void>}
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (notification) {
    await notification.update({ is_read: true });
  }
};

/**
 * Mark all notifications as read
 * @param {number} userId
 * @returns {Promise<void>}
 */
const markAllAsRead = async (userId) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
};

/**
 * Update user's FCM token
 * @param {number} userId
 * @param {string} token
 * @returns {Promise<void>}
 */
const updateFcmToken = async (userId, token) => {
  await User.update({ fcmToken: token }, { where: { id: userId } });
};

/**
 * Send notification to all users (Broadcast)
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.body
 * @param {Object} [options.data]
 * @param {string} [options.type]
 * @returns {Promise<Object>}
 */
const sendBroadcastNotification = async ({ title, body, data = {}, type = 'broadcast' }) => {
  try {
    // 1. Get all users
    const users = await User.findAll({ attributes: ['id', 'fcmToken'] });
    
    logger.info(`🔔 Broadcasting to ${users.length} users`);
    
    if (users.length === 0) {
      logger.warn('No users found for broadcast');
      return { sent: 0, failed: 0, total: 0, message: 'No users found' };
    }

    // 2. Save to database for everyone
    const notificationRecords = users.map(user => ({
      user_id: user.id,
      title,
      message: body,
      type,
      data,
    }));
    
    await Notification.bulkCreate(notificationRecords);

    // 3. Collect valid FCM tokens
    const tokens = users
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken);

    if (tokens.length > 0) {
      // Firebase allows up to 500 tokens per multicast message
      const CHUNK_SIZE = 500;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunk = tokens.slice(i, i + CHUNK_SIZE);
        const message = {
          notification: { title, body },
          data: { ...data, type },
          tokens: chunk,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        successCount += response.successCount;
        failureCount += response.failureCount;
      }

      logger.info(`Broadcast sent: ${successCount} success, ${failureCount} failure`);
      return { sent: successCount, failed: failureCount, total: users.length };
    }

    logger.warn(`No valid FCM tokens found. Total users: ${users.length}`);
    return { sent: 0, failed: 0, total: users.length, message: 'No valid FCM tokens found' };
  } catch (error) {
    logger.error('Error in sendBroadcastNotification:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  updateFcmToken,
  sendBroadcastNotification,
};
