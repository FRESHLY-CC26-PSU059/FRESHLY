const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Freshly API',
    version: '1.0.0',
    description: `## Freshly REST API

AI-powered fruit & vegetable freshness scanner with nutrition chatbot, article CMS, and admin tooling.

### Authentication
All endpoints require the **\`x-client-key\`** header. Authenticated endpoints additionally require **Bearer token** via \`Authorization: Bearer <token>\`.

### Base URL
\`https://freshly.web.id/api/v1\`
`,
    contact: { name: 'Freshly Dev Team', email: 'muhamadrizkisurya15@gmail.com' },
    license: { name: 'ISC' },
  },
  servers: [
    { url: 'https://freshly.web.id/api/v1', description: 'Production' },
    { url: 'http://localhost:3000/api/v1', description: 'Local Development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      clientKey: { type: 'apiKey', in: 'header', name: 'x-client-key' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Doe' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          role: { type: 'string', enum: ['user', 'admin', 'super_admin'], example: 'user' },
          phone: { type: 'string', example: '+6281234567890' },
          gender: { type: 'string', example: 'male' },
          address: { type: 'string', example: 'Jl. Sudirman No. 1, Jakarta' },
          birthdate: { type: 'string', format: 'date', example: '1995-08-17' },
          avatar_url: { type: 'string', format: 'uri', example: 'https://freshly.web.id/uploads/avatars/1.jpg' },
          createdAt: { type: 'string', format: 'date-time', example: '2025-01-01T00:00:00.000Z' },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          access: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              expires: { type: 'string', format: 'date-time', example: '2025-01-01T12:00:00.000Z' },
            },
          },
          refresh: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              expires: { type: 'string', format: 'date-time', example: '2025-01-30T12:00:00.000Z' },
            },
          },
        },
      },
      Scan: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 42 },
          fruitName: { type: 'string', example: 'Pisang Cavendish' },
          condition: { type: 'string', enum: ['matang', 'belum_matang', 'busuk'], example: 'matang' },
          isEdible: { type: 'boolean', example: true },
          confidence: { type: 'number', format: 'float', minimum: 0, maximum: 1, example: 0.94 },
          predictions: {
            type: 'object',
            properties: {
              matang: { type: 'number', example: 0.82 },
              belum_matang: { type: 'number', example: 0.11 },
              busuk: { type: 'number', example: 0.07 },
            },
          },
          imageUrl: { type: 'string', format: 'uri', example: 'https://freshly.web.id/uploads/scans/scan_42.jpg' },
          userId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time', example: '2025-06-01T08:30:00.000Z' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 10 },
          title: { type: 'string', example: 'Cara Memilih Mangga yang Segar' },
          slug: { type: 'string', example: 'cara-memilih-mangga-yang-segar' },
          excerpt: { type: 'string', example: 'Tips memilih mangga segar berkualitas tinggi di pasar.' },
          imageUrl: { type: 'string', format: 'uri' },
          category: { type: 'string', example: 'tips' },
          status: { type: 'string', enum: ['draft', 'published'], example: 'published' },
          author: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 100 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 10 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 400 },
          errorCode: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Validation failed' },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid Bearer token',
        content: {
          'application/json': {
            example: { code: 401, errorCode: 'TOKEN_INVALID', message: 'Invalid token' },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            example: { code: 403, errorCode: 'FORBIDDEN', message: 'Access denied' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            example: { code: 404, errorCode: 'NOT_FOUND', message: 'Resource not found' },
          },
        },
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            example: { code: 429, errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' },
          },
        },
      },
    },
  },
  security: [{ clientKey: [] }],
};

module.exports = swaggerDef;
