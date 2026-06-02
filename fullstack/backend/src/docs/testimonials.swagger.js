const testimonialsPaths = {
  '/testimonials/public': {
    get: {
      summary: 'Get approved testimonials (public)',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        200: { description: 'Paginated public testimonials' },
      },
    },
  },
  '/testimonials/user/me': {
    get: {
      summary: 'Get current user\'s testimonials',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      responses: {
        200: { description: 'User testimonials' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/testimonials': {
    post: {
      summary: 'Create a testimonial',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message', 'rating'],
              properties: {
                message: { type: 'string', maxLength: 1000 },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Testimonial created (pending approval)' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
      },
    },
    get: {
      summary: 'Get all testimonials (admin)',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'display', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        200: { description: 'Paginated testimonials list' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/testimonials/{id}': {
    patch: {
      summary: 'Update own testimonial',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                rating: { type: 'integer', minimum: 1, maximum: 5 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Testimonial updated' },
        403: { description: 'Can only edit own testimonial' },
        404: { description: 'Not found' },
      },
    },
    delete: {
      summary: 'Delete a testimonial',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Testimonial deleted' },
        404: { description: 'Not found' },
      },
    },
  },
  '/testimonials/{id}/display': {
    patch: {
      summary: 'Toggle testimonial display on landing page (admin)',
      tags: ['Testimonials'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['display'],
              properties: { display: { type: 'boolean' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Display status updated' },
        403: { description: 'Forbidden' },
      },
    },
  },
};

module.exports = testimonialsPaths;
