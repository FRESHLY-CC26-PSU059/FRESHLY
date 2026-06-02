const chatPaths = {
  '/chat': {
    post: {
      summary: 'Send a message and get AI response',
      tags: ['Chat'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: {
                message: { type: 'string', example: 'Apakah mangga ini layak dimakan?' },
                conversationId: { type: 'integer', description: 'Optional — continue existing conversation' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'AI response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      reply: { type: 'string' },
                      conversationId: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        429: { description: 'Rate limit exceeded' },
      },
    },
  },
  '/chat/conversations': {
    get: {
      summary: 'Get all conversations for current user',
      tags: ['Chat'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: { description: 'Paginated conversation list' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/chat/conversations/{id}': {
    get: {
      summary: 'Get a specific conversation with messages',
      tags: ['Chat'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Conversation with messages' },
        404: { description: 'Conversation not found' },
      },
    },
    patch: {
      summary: 'Rename a conversation',
      tags: ['Chat'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: { title: { type: 'string', maxLength: 100 } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Conversation renamed' },
        404: { description: 'Conversation not found' },
      },
    },
    delete: {
      summary: 'Delete a conversation',
      tags: ['Chat'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Conversation deleted' },
        404: { description: 'Conversation not found' },
      },
    },
  },
};

module.exports = chatPaths;
