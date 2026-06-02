const catchAsync = require('../../src/utils/catch-async');

describe('catchAsync', () => {
  test('should call the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = catchAsync(fn);
    await wrapped(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass errors to next when async fn rejects', async () => {
    const error = new Error('Something failed');
    const fn = jest.fn().mockRejectedValue(error);
    const req = {};
    const res = {};
    const next = jest.fn();

    const wrapped = catchAsync(fn);
    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  test('should return a function', () => {
    const fn = jest.fn();
    const wrapped = catchAsync(fn);
    expect(typeof wrapped).toBe('function');
  });
});
