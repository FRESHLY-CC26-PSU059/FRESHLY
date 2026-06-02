const auditLogPaths = {
  '/audit-logs': {
    get: {
      summary: 'Get admin audit logs (admin)',
      tags: ['Audit Logs'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'action', in: 'query', schema: { type: 'string', example: 'DELETE_USER' } },
        { name: 'userId', in: 'query', schema: { type: 'integer' } },
        { name: 'from', in: 'query', schema: { type: 'string', format: 'date', example: '2025-01-01' } },
        { name: 'to', in: 'query', schema: { type: 'string', format: 'date', example: '2025-12-31' } },
      ],
      responses: {
        200: {
          description: 'Paginated audit log list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      logs: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            action: { type: 'string' },
                            userId: { type: 'integer' },
                            targetId: { type: 'integer' },
                            meta: { type: 'object' },
                            createdAt: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        403: { description: 'Forbidden' },
      },
    },
  },
};

module.exports = auditLogPaths;
