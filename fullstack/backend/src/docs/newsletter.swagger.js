const newsletterPaths = {
  '/newsletter/subscribe': {
    post: {
      summary: 'Subscribe to newsletter (public)',
      tags: ['Newsletter'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email', example: 'user@example.com' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Subscribed successfully' },
        400: { description: 'Invalid email or already subscribed' },
      },
    },
  },
  '/newsletter/unsubscribe': {
    post: {
      summary: 'Unsubscribe from newsletter (public)',
      tags: ['Newsletter'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Unsubscribed successfully' },
        404: { description: 'Email not found in subscriber list' },
      },
    },
  },
  '/newsletter/status': {
    get: {
      summary: 'Check subscription status for current user',
      tags: ['Newsletter'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: 'Subscription status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: { subscribed: { type: 'boolean' } },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/newsletter': {
    get: {
      summary: 'Get all newsletter subscribers (admin)',
      tags: ['Newsletter'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Paginated subscriber list' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/newsletter/send': {
    post: {
      summary: 'Send newsletter to all subscribers (admin)',
      tags: ['Newsletter'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['subject', 'content'],
              properties: {
                subject: { type: 'string', maxLength: 200 },
                content: { type: 'string', description: 'HTML email content' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Newsletter sent' },
        403: { description: 'Forbidden' },
      },
    },
  },
};

module.exports = newsletterPaths;
