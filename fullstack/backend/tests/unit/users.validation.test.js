const Joi = require('joi');
const usersValidation = require('../../src/validations/users.validation');

const validateSchema = (schema, data) => {
  const compiled = Joi.object(schema);
  return compiled.validate(data, { abortEarly: false });
};

describe('Users Validations', () => {
  describe('createUser', () => {
    const validData = {
      body: {
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'StrongP@ss1',
      },
    };

    test('should pass with valid data', () => {
      const { error } = validateSchema(usersValidation.createUser, validData);
      expect(error).toBeUndefined();
    });

    test('should fail without first_name', () => {
      const { error } = validateSchema(usersValidation.createUser, {
        body: { ...validData.body, first_name: undefined },
      });
      expect(error).toBeDefined();
    });

    test('should fail without email', () => {
      const { error } = validateSchema(usersValidation.createUser, {
        body: { ...validData.body, email: undefined },
      });
      expect(error).toBeDefined();
    });

    test('should fail with invalid role_name', () => {
      const { error } = validateSchema(usersValidation.createUser, {
        body: { ...validData.body, role_name: 'hacker' },
      });
      expect(error).toBeDefined();
    });

    test('should allow valid role_name', () => {
      const { error } = validateSchema(usersValidation.createUser, {
        body: { ...validData.body, role_name: 'admin' },
      });
      expect(error).toBeUndefined();
    });

    test('should default role_name to user', () => {
      const { value } = validateSchema(usersValidation.createUser, validData);
      expect(value.body.role_name).toBe('user');
    });
  });

  describe('updateUser', () => {
    test('should pass with at least one field', () => {
      const { error } = validateSchema(usersValidation.updateUser, {
        params: { userId: 1 },
        body: { first_name: 'Updated' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with empty body', () => {
      const { error } = validateSchema(usersValidation.updateUser, {
        params: { userId: 1 },
        body: {},
      });
      expect(error).toBeDefined();
    });

    test('should allow isActive toggle', () => {
      const { error } = validateSchema(usersValidation.updateUser, {
        params: { userId: 1 },
        body: { isActive: false },
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateMe', () => {
    test('should pass with valid fields', () => {
      const { error } = validateSchema(usersValidation.updateMe, {
        body: { first_name: 'Jane', phone: '0812345678' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with empty body', () => {
      const { error } = validateSchema(usersValidation.updateMe, {
        body: {},
      });
      expect(error).toBeDefined();
    });

    test('should not allow role_name', () => {
      const { error } = validateSchema(usersValidation.updateMe, {
        body: { role_name: 'admin' },
      });
      // role_name is not in schema so it'll be stripped; but min(1) still requires a valid key
      expect(error).toBeDefined();
    });
  });

  describe('getUsers', () => {
    test('should pass with default params', () => {
      const { error } = validateSchema(usersValidation.getUsers, {
        query: {},
      });
      expect(error).toBeUndefined();
    });

    test('should fail with page < 1', () => {
      const { error } = validateSchema(usersValidation.getUsers, {
        query: { page: 0 },
      });
      expect(error).toBeDefined();
    });

    test('should allow limit 0 (return all)', () => {
      const { error } = validateSchema(usersValidation.getUsers, {
        query: { limit: 0 },
      });
      expect(error).toBeUndefined();
    });
  });

  describe('getUser / deleteUser', () => {
    test('should pass with valid userId', () => {
      const { error } = validateSchema(usersValidation.getUser, {
        params: { userId: 1 },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without userId', () => {
      const { error } = validateSchema(usersValidation.deleteUser, {
        params: {},
      });
      expect(error).toBeDefined();
    });
  });
});
