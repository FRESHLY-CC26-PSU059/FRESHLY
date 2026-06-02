const chatbotPaths = {
  '/chatbot/chat': {
    post: {
      summary: 'Chat with AI food assistant (stateless)',
      tags: ['Chatbot'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: {
                message: { type: 'string', example: 'Apa kandungan gizi dalam pisang?' },
                scanId: { type: 'integer', description: 'Optional — link question to a scan result' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'AI assistant reply',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: { reply: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
        429: { description: 'Chatbot rate limit: max 10 req/min' },
      },
    },
  },
};

module.exports = chatbotPaths;
