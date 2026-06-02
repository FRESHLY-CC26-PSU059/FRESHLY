const articlesPaths = {
  '/articles': {
    get: {
      summary: 'Get all published articles (public)',
      tags: ['Articles'],
      security: [{ clientKey: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'category', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Paginated article list' },
      },
    },
    post: {
      summary: 'Create a new article (admin)',
      tags: ['Articles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', maxLength: 200 },
                content: { type: 'string' },
                excerpt: { type: 'string', maxLength: 500 },
                category: { type: 'string' },
                tags: { type: 'string', description: 'Comma-separated tags' },
                status: { type: 'string', enum: ['draft', 'published'], default: 'draft' },
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Article created' },
        400: { description: 'Validation error' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/articles/id/{id}': {
    get: {
      summary: 'Get article by ID (admin)',
      tags: ['Articles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Article data' },
        404: { description: 'Article not found' },
      },
    },
  },
  '/articles/{slug}': {
    get: {
      summary: 'Get article by slug (public)',
      tags: ['Articles'],
      security: [{ clientKey: [] }],
      parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', example: 'cara-memilih-pisang-segar' } }],
      responses: {
        200: { description: 'Article data' },
        404: { description: 'Article not found' },
      },
    },
  },
  '/articles/{id}': {
    put: {
      summary: 'Update an article (admin)',
      tags: ['Articles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
                excerpt: { type: 'string' },
                category: { type: 'string' },
                tags: { type: 'string' },
                status: { type: 'string', enum: ['draft', 'published'] },
                image: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Article updated' },
        404: { description: 'Article not found' },
      },
    },
    delete: {
      summary: 'Delete an article (admin)',
      tags: ['Articles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Article deleted' },
        404: { description: 'Article not found' },
      },
    },
  },
};

module.exports = articlesPaths;
