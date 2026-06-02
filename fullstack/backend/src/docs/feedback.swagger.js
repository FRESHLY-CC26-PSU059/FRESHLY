const feedbackPaths = {
  '/feedbacks': {
    post: {
      summary: 'Submit feedback (public)',
      tags: ['Feedback'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: {
                name: { type: 'string', maxLength: 100 },
                email: { type: 'string', format: 'email' },
                message: { type: 'string', maxLength: 2000 },
                category: { type: 'string', enum: ['bug', 'suggestion', 'general'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Feedback submitted' },
        400: { description: 'Validation error' },
      },
    },
    get: {
      summary: 'Get all feedbacks (admin)',
      tags: ['Feedback'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'reviewed', 'resolved'] } },
      ],
      responses: {
        200: { description: 'Paginated feedback list' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/feedbacks/{id}/status': {
    patch: {
      summary: 'Update feedback status (admin)',
      tags: ['Feedback'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['pending', 'reviewed', 'resolved'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Status updated' },
        404: { description: 'Feedback not found' },
      },
    },
  },
  '/feedbacks/{id}': {
    delete: {
      summary: 'Delete a feedback (admin)',
      tags: ['Feedback'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Feedback deleted' },
        404: { description: 'Feedback not found' },
      },
    },
  },
};

module.exports = feedbackPaths;
