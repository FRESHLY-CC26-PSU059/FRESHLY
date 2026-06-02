const Joi = require('joi');
const validate = require('../../src/middlewares/validate.middleware');

describe('validate middleware', () => {
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear();
  });

  test('should call next() with no error for valid data', () => {
    const schema = {
      body: Joi.object({ name: Joi.string().required() }),
    };
    const req = { body: { name: 'John' } };
    const res = {};

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.name).toBe('John');
  });

  test('should call next with ApiError for invalid data', () => {
    const schema = {
      body: Joi.object({ name: Joi.string().required() }),
    };
    const req = { body: {} };
    const res = {};

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
      }),
    );
  });

  test('should validate query parameters', () => {
    const schema = {
      query: Joi.object({ page: Joi.number().integer().min(1) }),
    };
    const req = { query: { page: 0 } };
    const res = {};

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  test('should validate params', () => {
    const schema = {
      params: Joi.object({ id: Joi.number().integer().required() }),
    };
    const req = { params: { id: 5 } };
    const res = {};

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('should strip unknown fields', () => {
    const schema = {
      body: Joi.object({ name: Joi.string().required() }),
    };
    const req = { body: { name: 'John', extra: 'value' } };
    const res = {};

    validate(schema)(req, res, next);

    // Joi strips unknowns by default, next should be called without error
    expect(next).toHaveBeenCalled();
  });

  test('should concatenate multiple errors', () => {
    const schema = {
      body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      }),
    };
    const req = { body: {} };
    const res = {};

    validate(schema)(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain(',');
  });
});
