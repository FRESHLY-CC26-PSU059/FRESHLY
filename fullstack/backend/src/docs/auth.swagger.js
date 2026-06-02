const authPaths = {
  '/auth/register': {
    post: {
      summary: 'Register a new user',
      tags: ['Auth'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['first_name', 'last_name', 'email', 'password'],
              properties: {
                first_name: { type: 'string', maxLength: 60, example: 'John' },
                last_name: { type: 'string', maxLength: 60, example: 'Doe' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: {
                  type: 'string',
                  minLength: 8,
                  example: 'Password1!',
                  description:
                    'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character',
                },
                phone: { type: 'string', maxLength: 20 },
                gender: { type: 'string', maxLength: 10 },
                address: { type: 'string', maxLength: 255 },
                birthdate: { type: 'string', format: 'date' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      tokens: { $ref: '#/components/schemas/Tokens' },
                    },
                  },
                },
              },
              example: {
                status: 'success',
                data: {
                  user: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
                  tokens: {
                    access: { token: 'eyJhbGciOiJIUzI1NiJ9...', expires: '2025-01-01T12:00:00.000Z' },
                    refresh: { token: 'eyJhbGciOiJIUzI1NiJ9...', expires: '2025-01-30T12:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or email already taken',
          content: {
            'application/json': {
              example: { code: 400, errorCode: 'VALIDATION_ERROR', message: 'Email already taken' },
            },
          },
        },
        429: {
          description: 'Too many requests',
          content: {
            'application/json': {
              example: { code: 429, errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
            },
          },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      summary: 'Login with email and password',
      tags: ['Auth'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                password: { type: 'string', example: 'Password1!' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      tokens: { $ref: '#/components/schemas/Tokens' },
                    },
                  },
                },
              },
              example: {
                status: 'success',
                data: {
                  user: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
                  tokens: {
                    access: { token: 'eyJhbGciOiJIUzI1NiJ9...', expires: '2025-01-01T12:00:00.000Z' },
                    refresh: { token: 'eyJhbGciOiJIUzI1NiJ9...', expires: '2025-01-30T12:00:00.000Z' },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Incorrect email or password',
          content: {
            'application/json': {
              example: { code: 401, errorCode: 'INVALID_CREDENTIALS', message: 'Incorrect email or password' },
            },
          },
        },
        429: {
          description: 'Too many authentication attempts',
          content: {
            'application/json': {
              example: { code: 429, errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts. Please try again in 15 minutes.' },
            },
          },
        },
      },
    },
  },
  '/auth/logout': {
    post: {
      summary: 'Logout (invalidate refresh token)',
      tags: ['Auth'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Logout successful' },
        404: { description: 'Refresh token not found' },
      },
    },
  },
  '/auth/refresh-tokens': {
    post: {
      summary: 'Refresh authentication tokens',
      tags: ['Auth'],
      security: [{ clientKey: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: { refreshToken: { type: 'string' } },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Tokens refreshed successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Tokens' },
            },
          },
        },
        401: { description: 'Invalid refresh token' },
      },
    },
  },
};

module.exports = authPaths;
