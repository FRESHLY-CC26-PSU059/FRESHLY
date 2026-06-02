const jwt = require('jsonwebtoken');

jest.mock('../../src/config/env', () => ({
  jwt: {
    secret: 'test-access-secret',
    refreshSecret: 'test-refresh-secret',
    expiresIn: '1d',
    refreshExpiresIn: '30d',
  },
}));

jest.mock('../../src/models', () => ({
  Token: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/config/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

const tokenService = require('../../src/services/token.service');
const { Token } = require('../../src/models');

describe('Token Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    test('should return a valid JWT string', () => {
      const expires = new Date(Date.now() + 3600000);
      const token = tokenService.generateToken(1, expires, 'access');
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, 'test-access-secret');
      expect(decoded.sub).toBe(1);
      expect(decoded.type).toBe('access');
      expect(decoded.jti).toBeDefined();
    });

    test('should use custom secret when provided', () => {
      const expires = new Date(Date.now() + 3600000);
      const token = tokenService.generateToken(1, expires, 'refresh', 'custom-secret');

      const decoded = jwt.verify(token, 'custom-secret');
      expect(decoded.sub).toBe(1);
    });
  });

  describe('saveToken', () => {
    test('should hash refresh tokens before persisting', async () => {
      const expires = new Date(Date.now() + 3600000);
      await tokenService.saveToken('token-string', 1, expires, 'refresh');

      const hashed = tokenService.hashRefreshToken('token-string');
      expect(Token.create).toHaveBeenCalledWith({
        token: hashed,
        user_id: 1,
        expires,
        type: 'refresh',
        blacklisted: false,
      });
    });

    test('should persist non-refresh tokens as-is', async () => {
      const expires = new Date(Date.now() + 3600000);
      await tokenService.saveToken('raw-verify', 2, expires, 'verifyEmail');

      expect(Token.create).toHaveBeenCalledWith({
        token: 'raw-verify',
        user_id: 2,
        expires,
        type: 'verifyEmail',
        blacklisted: false,
      });
    });

    test('should allow blacklisted flag', async () => {
      const expires = new Date();
      await tokenService.saveToken('token', 1, expires, 'refresh', true);

      expect(Token.create).toHaveBeenCalledWith(
        expect.objectContaining({ blacklisted: true }),
      );
    });
  });

  describe('verifyToken', () => {
    test('should look up refresh token by its hash', async () => {
      const expires = new Date(Date.now() + 3600000);
      const token = tokenService.generateToken(1, expires, 'refresh', 'test-refresh-secret');
      Token.findOne.mockResolvedValue({ id: 1, token, type: 'refresh' });

      const result = await tokenService.verifyToken(token, 'refresh');
      expect(result).toBeDefined();
      expect(Token.findOne).toHaveBeenCalledWith({
        where: {
          token: tokenService.hashRefreshToken(token),
          type: 'refresh',
          user_id: 1,
          blacklisted: false,
        },
      });
    });

    test('should throw when token is not found in DB', async () => {
      const expires = new Date(Date.now() + 3600000);
      const token = tokenService.generateToken(1, expires, 'access', 'test-access-secret');
      Token.findOne.mockResolvedValue(null);

      await expect(tokenService.verifyToken(token, 'access')).rejects.toThrow('Token not found');
    });

    test('should throw on invalid token', async () => {
      await expect(tokenService.verifyToken('invalid', 'access')).rejects.toThrow(
        'Token verification failed',
      );
    });
  });

  describe('generateAuthTokens', () => {
    test('should generate access and refresh tokens', async () => {
      Token.create.mockResolvedValue({ id: 1 });
      const user = { id: 42 };

      const tokens = await tokenService.generateAuthTokens(user);

      expect(tokens.access).toBeDefined();
      expect(tokens.access.token).toBeDefined();
      expect(tokens.access.expires).toBeInstanceOf(Date);
      expect(tokens.refresh).toBeDefined();
      expect(tokens.refresh.token).toBeDefined();
      expect(tokens.refresh.expires).toBeInstanceOf(Date);

      // Verify access token
      const decoded = jwt.verify(tokens.access.token, 'test-access-secret');
      expect(decoded.sub).toBe(42);

      // Refresh token saved to DB
      expect(Token.create).toHaveBeenCalled();
    });
  });

  describe('generateVerifyEmailToken', () => {
    test('should generate and save verify email token', async () => {
      Token.create.mockResolvedValue({ id: 5 });
      const user = { id: 10 };

      const token = await tokenService.generateVerifyEmailToken(user);

      expect(typeof token).toBe('string');
      const decoded = jwt.verify(token, 'test-access-secret');
      expect(decoded.sub).toBe(10);
      expect(decoded.type).toBe('verifyEmail');
      expect(Token.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'verifyEmail', user_id: 10 }),
      );
    });
  });
});
