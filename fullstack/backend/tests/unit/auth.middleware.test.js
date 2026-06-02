const jwt = require('jsonwebtoken');

jest.mock('../../src/config/env', () => ({
  jwt: { secret: 'test-secret' },
}));

jest.mock('../../src/models', () => ({
  User: {
    findByPk: jest.fn(),
  },
  Role: {},
}));

const auth = require('../../src/middlewares/auth.middleware');
const { User } = require('../../src/models');

describe('auth middleware', () => {
  let next;

  beforeEach(() => {
    next = jest.fn();
    jest.clearAllMocks();
  });

  const createToken = (payload = { sub: 1 }, secret = 'test-secret') => {
    return jwt.sign(payload, secret, { expiresIn: '1h' });
  };

  test('should reject request without authorization header', async () => {
    const req = { headers: {} };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
      }),
    );
  });

  test('should reject request with invalid token', async () => {
    const req = { headers: { authorization: 'Bearer invalid-token' } };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        errorCode: 'TOKEN_INVALID',
      }),
    );
  });

  test('should reject request with expired token', async () => {
    const expiredToken = jwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) - 3600 }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        errorCode: 'TOKEN_EXPIRED',
      }),
    );
  });

  test('should reject when user not found', async () => {
    User.findByPk.mockResolvedValue(null);
    const token = createToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
      }),
    );
  });

  test('should reject when user is deactivated', async () => {
    User.findByPk.mockResolvedValue({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      isActive: false,
      role: { role_name: 'user' },
    });
    const token = createToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        errorCode: 'FORBIDDEN',
      }),
    );
  });

  test('should reject when role is not allowed', async () => {
    User.findByPk.mockResolvedValue({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      isActive: true,
      role: { role_name: 'user' },
    });
    const token = createToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    await auth('admin', 'super_admin')(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        errorCode: 'FORBIDDEN',
      }),
    );
  });

  test('should attach user to req and call next on success', async () => {
    User.findByPk.mockResolvedValue({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      isActive: true,
      role: { role_name: 'admin' },
    });
    const token = createToken();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    await auth('admin')(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@test.com',
      role: 'admin',
      isActive: true,
    });
  });

  test('should allow any authenticated user when no roles specified', async () => {
    User.findByPk.mockResolvedValue({
      id: 2,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@test.com',
      isActive: true,
      role: { role_name: 'user' },
    });
    const token = createToken({ sub: 2 });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user.role).toBe('user');
  });
});
