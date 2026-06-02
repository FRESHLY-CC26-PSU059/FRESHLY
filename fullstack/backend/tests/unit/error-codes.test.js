const ERROR_CODES = require('../../src/utils/errorCodes');

describe('ERROR_CODES', () => {
  test('should export all expected auth error codes', () => {
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    expect(ERROR_CODES.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
    expect(ERROR_CODES.EMAIL_NOT_VERIFIED).toBe('EMAIL_NOT_VERIFIED');
    expect(ERROR_CODES.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
    expect(ERROR_CODES.TOKEN_INVALID).toBe('TOKEN_INVALID');
    expect(ERROR_CODES.ACCOUNT_LOCKED).toBe('ACCOUNT_LOCKED');
  });

  test('should export validation error code', () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
  });

  test('should export resource error codes', () => {
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
    expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
  });

  test('should export rate limiting error code', () => {
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
  });

  test('should export server error codes', () => {
    expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
  });

  test('should export client error codes', () => {
    expect(ERROR_CODES.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ERROR_CODES.INVALID_CLIENT_KEY).toBe('INVALID_CLIENT_KEY');
  });

  test('should have at least 13 error codes', () => {
    expect(Object.keys(ERROR_CODES).length).toBeGreaterThanOrEqual(13);
  });
});
