const scansPaths = {
  '/scans/analyze': {
    post: {
      summary: 'Analyze a fruit/vegetable image with AI',
      tags: ['Scans'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['image'],
              properties: {
                image: { type: 'string', format: 'binary', description: 'Fruit/vegetable image (jpg, png, webp)' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'AI analysis result',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: { type: 'object', properties: { scan: { $ref: '#/components/schemas/Scan' } } },
                },
              },
              example: {
                status: 'success',
                data: {
                  scan: {
                    id: 42,
                    fruitName: 'Pisang Cavendish',
                    condition: 'matang',
                    isEdible: true,
                    confidence: 0.94,
                    predictions: { matang: 0.82, belum_matang: 0.11, busuk: 0.07 },
                    imageUrl: 'https://freshly.web.id/uploads/scans/scan_42.jpg',
                    userId: 1,
                    createdAt: '2025-06-01T08:30:00.000Z',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid image or missing file',
          content: { 'application/json': { example: { code: 400, errorCode: 'VALIDATION_ERROR', message: 'No image file provided' } } },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        429: { $ref: '#/components/responses/TooManyRequests' },
      },
    },
  },
  '/scans': {
    get: {
      summary: 'Get scan history for current user',
      tags: ['Scans'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'condition', in: 'query', schema: { type: 'string', enum: ['matang', 'belum_matang', 'busuk'] } },
      ],
      responses: {
        200: { description: 'Paginated scan history' },
        401: { description: 'Unauthorized' },
      },
    },
  },
  '/scans/{id}': {
    get: {
      summary: 'Get a specific scan result',
      tags: ['Scans'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Scan detail' },
        401: { description: 'Unauthorized' },
        404: { description: 'Scan not found' },
      },
    },
    delete: {
      summary: 'Delete a scan',
      tags: ['Scans'],
      security: [{ clientKey: [] }, { bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Scan deleted' },
        404: { description: 'Scan not found' },
      },
    },
  },
};

module.exports = scansPaths;
