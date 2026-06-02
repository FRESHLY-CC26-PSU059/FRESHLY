const rolesPaths = {
  '/roles': {
    get: {
      summary: 'Get all roles (admin)',
      tags: ['Roles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      responses: {
        200: { description: 'List of roles' },
        403: { description: 'Forbidden' },
      },
    },
    post: {
      summary: 'Create a new role (super_admin)',
      tags: ['Roles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', example: 'moderator' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        201: { description: 'Role created' },
        400: { description: 'Validation error' },
        403: { description: 'Forbidden' },
      },
    },
  },
  '/roles/{roleId}': {
    get: {
      summary: 'Get a specific role (admin)',
      tags: ['Roles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Role data' },
        404: { description: 'Role not found' },
      },
    },
    patch: {
      summary: 'Update a role (super_admin)',
      tags: ['Roles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: { description: 'Role updated' },
        404: { description: 'Role not found' },
      },
    },
    delete: {
      summary: 'Delete a role (super_admin)',
      tags: ['Roles'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Role deleted' },
        404: { description: 'Role not found' },
      },
    },
  },
};

module.exports = rolesPaths;
