const ApiError = require('../../src/utils/api-error');

describe('ApiError', () => {
  test('should create an error with statusCode, message, and errorCode', () => {
    const error = new ApiError(400, 'Bad Request', 'BAD_REQUEST');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.errorCode).toBe('BAD_REQUEST');
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });

  test('should default errorCode to UNKNOWN_ERROR', () => {
    const error = new ApiError(500, 'Internal');
    expect(error.errorCode).toBe('UNKNOWN_ERROR');
  });

  test('should default isOperational to true', () => {
    const error = new ApiError(404, 'Not found', 'NOT_FOUND');
    expect(error.isOperational).toBe(true);
  });

  test('should allow non-operational errors', () => {
    const error = new ApiError(500, 'Fatal', 'INTERNAL_ERROR', false);
    expect(error.isOperational).toBe(false);
  });

  test('should use provided stack', () => {
    const customStack = 'Custom stack trace';
    const error = new ApiError(500, 'Error', 'INTERNAL_ERROR', true, customStack);
    expect(error.stack).toBe(customStack);
  });

  test('should inherit from Error prototype', () => {
    const error = new ApiError(401, 'Unauthorized');
    expect(error.name).toBe('Error');
    expect(typeof error.stack).toBe('string');
  });
});
