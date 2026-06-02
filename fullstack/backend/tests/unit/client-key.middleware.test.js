jest.mock('../../src/config/env', () => ({
  clientKey: 'test-client-key-123',
}));

const verifyClientKey = require('../../src/middlewares/client-key.middleware');

describe('verifyClientKey middleware', () => {
  const res = {};
  let next;

  beforeEach(() => {
    next = jest.fn();
  });

  test('should call next() with valid client key', () => {
    const req = { path: '/api', headers: { 'x-client-key': 'test-client-key-123' } };

    verifyClientKey(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should call next with ApiError for missing client key', () => {
    const req = { path: '/api', headers: {} };

    verifyClientKey(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        errorCode: 'INVALID_CLIENT_KEY',
      }),
    );
  });

  test('should call next with ApiError for invalid client key', () => {
    const req = { path: '/api', headers: { 'x-client-key': 'wrong-key' } };

    verifyClientKey(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        errorCode: 'INVALID_CLIENT_KEY',
      }),
    );
  });
});
