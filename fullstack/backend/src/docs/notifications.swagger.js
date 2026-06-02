const notificationsPaths = {
  '/notifications': {
    get: {
      summary: 'Get notifications for current user',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'unread', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        200: { description: 'Notification list' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/notifications/token': {
    post: {
      summary: 'Register FCM push notification token',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string', description: 'Firebase Cloud Messaging token' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Token registered' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/notifications/read-all': {
    patch: {
      summary: 'Mark all notifications as read',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      responses: {
        200: { description: 'All notifications marked as read' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/notifications/{notificationId}/read': {
    patch: {
      summary: 'Mark a single notification as read',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'notificationId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Notification marked as read' },
        404: { description: 'Notification not found' },
      },
    },
  },
  '/notifications/broadcast': {
    post: {
      summary: 'Broadcast notification to all users (admin)',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'body'],
              properties: {
                title: { type: 'string', maxLength: 100 },
                body: { type: 'string', maxLength: 500 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Broadcast sent' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/notifications/send-to-user': {
    post: {
      summary: 'Send notification to a specific user (admin)',
      tags: ['Notifications'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['userId', 'title', 'body'],
              properties: {
                userId: { type: 'integer' },
                title: { type: 'string' },
                body: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Notification sent' },
        403: { description: 'Forbidden' },
        404: { description: 'User not found' },
      },
    },
  },
};

module.exports = notificationsPaths;
