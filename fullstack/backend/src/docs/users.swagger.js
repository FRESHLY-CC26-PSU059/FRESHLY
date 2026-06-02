const usersPaths = {
  '/users/me': {
    get: {
      summary: 'Get current authenticated user',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current user data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized' },
      },
    },
    patch: {
      summary: 'Update current user profile',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                first_name: { type: 'string', maxLength: 60 },
                last_name: { type: 'string', maxLength: 60 },
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
        200: { description: 'Profile updated' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/users/me/avatar': {
    post: {
      summary: 'Upload / update profile avatar',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['avatar'],
              properties: { avatar: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: {
        200: { description: 'Avatar updated' },
        400: { description: 'Invalid image' },
        401: { description: 'Unauthorized' },
        429: { description: 'Upload rate limit exceeded' },
      },
    },
  },
  '/users': {
    get: {
      summary: 'Get all users (admin)',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'role', in: 'query', schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'Paginated user list' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
      },
    },
    post: {
      summary: 'Create a new user (admin)',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['first_name', 'last_name', 'email', 'password', 'role'],
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'User created' },
        400: { description: 'Validation error' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/users/{userId}': {
    get: {
      summary: 'Get a specific user (admin)',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'User data' },
        404: { description: 'User not found' },
      },
    },
    patch: {
      summary: 'Update a specific user (admin)',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'User updated' },
        404: { description: 'User not found' },
      },
    },
    delete: {
      summary: 'Delete a specific user (admin)',
      tags: ['Users'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'User deleted' },
        404: { description: 'User not found' },
      },
    },
  },
};

module.exports = usersPaths;
