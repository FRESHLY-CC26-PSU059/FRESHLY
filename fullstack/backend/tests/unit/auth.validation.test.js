const Joi = require('joi');
const authValidation = require('../../src/validations/auth.validation');

const validateSchema = (schema, data) => {
  const compiled = Joi.object(schema);
  return compiled.validate(data, { abortEarly: false });
};

describe('Auth Validations', () => {
  describe('register', () => {
    const validData = {
      body: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'Password1!',
        recaptchaToken: 'a-valid-recaptcha-token-here',
      },
    };

    test('should pass with valid registration data', () => {
      const { error } = validateSchema(authValidation.register, validData);
      expect(error).toBeUndefined();
    });

    test('should fail without first_name', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, first_name: undefined },
      });
      expect(error).toBeDefined();
    });

    test('should fail without email', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, email: undefined },
      });
      expect(error).toBeDefined();
    });

    test('should fail with invalid email', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, email: 'not-an-email' },
      });
      expect(error).toBeDefined();
    });

    test('should fail with weak password (no uppercase)', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, password: 'password1!' },
      });
      expect(error).toBeDefined();
    });

    test('should fail with weak password (no special char)', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, password: 'Password1' },
      });
      expect(error).toBeDefined();
    });

    test('should fail with short password', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, password: 'Pa1!' },
      });
      expect(error).toBeDefined();
    });

    test('should fail without recaptchaToken', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, recaptchaToken: undefined },
      });
      expect(error).toBeDefined();
    });

    test('should fail with short recaptchaToken', () => {
      const { error } = validateSchema(authValidation.register, {
        body: { ...validData.body, recaptchaToken: 'short' },
      });
      expect(error).toBeDefined();
    });

    test('should allow optional fields', () => {
      const { error } = validateSchema(authValidation.register, {
        body: {
          ...validData.body,
          phone: '081234567890',
          gender: 'male',
          address: '123 Street',
          birthdate: '2000-01-01',
        },
      });
      expect(error).toBeUndefined();
    });
  });

  describe('login', () => {
    test('should pass with valid login data', () => {
      const { error } = validateSchema(authValidation.login, {
        body: {
          email: 'john@example.com',
          password: 'Password1!',
          recaptchaToken: 'a-valid-recaptcha-token-here',
        },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without email', () => {
      const { error } = validateSchema(authValidation.login, {
        body: { password: 'pass', recaptchaToken: 'a-valid-recaptcha-token-here' },
      });
      expect(error).toBeDefined();
    });

    test('should fail without password', () => {
      const { error } = validateSchema(authValidation.login, {
        body: { email: 'john@example.com', recaptchaToken: 'a-valid-recaptcha-token-here' },
      });
      expect(error).toBeDefined();
    });

    test('should allow optional fcmToken', () => {
      const { error } = validateSchema(authValidation.login, {
        body: {
          email: 'john@example.com',
          password: 'pass',
          recaptchaToken: 'a-valid-recaptcha-token-here',
          fcmToken: 'some-fcm-token',
        },
      });
      expect(error).toBeUndefined();
    });
  });

  describe('forgotPassword', () => {
    test('should pass with valid email and recaptcha', () => {
      const { error } = validateSchema(authValidation.forgotPassword, {
        body: { email: 'john@example.com', recaptchaToken: 'a-valid-recaptcha-token-here' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without email', () => {
      const { error } = validateSchema(authValidation.forgotPassword, {
        body: { recaptchaToken: 'a-valid-recaptcha-token-here' },
      });
      expect(error).toBeDefined();
    });
  });

  describe('verifyOTP', () => {
    test('should pass with valid email and 6-digit OTP', () => {
      const { error } = validateSchema(authValidation.verifyOTP, {
        body: { email: 'john@example.com', otp: '123456' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with non-numeric OTP', () => {
      const { error } = validateSchema(authValidation.verifyOTP, {
        body: { email: 'john@example.com', otp: 'abcdef' },
      });
      expect(error).toBeDefined();
    });

    test('should fail with wrong length OTP', () => {
      const { error } = validateSchema(authValidation.verifyOTP, {
        body: { email: 'john@example.com', otp: '12345' },
      });
      expect(error).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    test('should pass with valid data', () => {
      const { error } = validateSchema(authValidation.resetPassword, {
        body: {
          email: 'john@example.com',
          otp: '123456',
          newPassword: 'NewPass1!',
        },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with weak newPassword', () => {
      const { error } = validateSchema(authValidation.resetPassword, {
        body: {
          email: 'john@example.com',
          otp: '123456',
          newPassword: 'weak',
        },
      });
      expect(error).toBeDefined();
    });
  });

  describe('logout', () => {
    test('should pass with refreshToken', () => {
      const { error } = validateSchema(authValidation.logout, {
        body: { refreshToken: 'some-refresh-token' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without refreshToken', () => {
      const { error } = validateSchema(authValidation.logout, {
        body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe('changePassword', () => {
    test('should pass with valid old and new passwords', () => {
      const { error } = validateSchema(authValidation.changePassword, {
        body: { oldPassword: 'OldPass1!', newPassword: 'NewPass1!' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without oldPassword', () => {
      const { error } = validateSchema(authValidation.changePassword, {
        body: { newPassword: 'NewPass1!' },
      });
      expect(error).toBeDefined();
    });
  });
});
