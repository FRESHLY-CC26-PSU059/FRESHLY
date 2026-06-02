const knowledgePaths = {
  '/knowledges': {
    get: {
      summary: 'Get all knowledge entries (admin)',
      tags: ['Knowledge'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Paginated knowledge list' },
        403: { description: 'Forbidden' },
      },
    },
    post: {
      summary: 'Create a knowledge entry (admin)',
      tags: ['Knowledge'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', maxLength: 200, example: 'Cara Menyimpan Mangga' },
                content: { type: 'string' },
                category: { type: 'string', example: 'penyimpanan' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Knowledge entry created' },
        400: { description: 'Validation error' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/knowledges/{id}': {
    put: {
      summary: 'Update a knowledge entry (admin)',
      tags: ['Knowledge'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Knowledge entry updated' },
        404: { description: 'Knowledge entry not found' },
      },
    },
    delete: {
      summary: 'Delete a knowledge entry (admin)',
      tags: ['Knowledge'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Knowledge entry deleted' },
        404: { description: 'Knowledge entry not found' },
      },
    },
  },
};

module.exports = knowledgePaths;
