const Joi = require('joi');
const scanValidation = require('../../src/validations/scan.validation');

const validateSchema = (schema, data) => {
  const compiled = Joi.object(schema);
  return compiled.validate(data, { abortEarly: false });
};

describe('Scan Validations', () => {
  describe('analyzeScan', () => {
    test('should pass with valid fruit_type', () => {
      const { error } = validateSchema(scanValidation.analyzeScan, {
        body: { fruit_type: 'banana' },
      });
      expect(error).toBeUndefined();
    });

    test('should pass for all allowed fruit types', () => {
      const types = ['banana', 'mango', 'orange', 'chili', 'paprika', 'tomato'];
      types.forEach((type) => {
        const { error } = validateSchema(scanValidation.analyzeScan, {
          body: { fruit_type: type },
        });
        expect(error).toBeUndefined();
      });
    });

    test('should fail with invalid fruit_type', () => {
      const { error } = validateSchema(scanValidation.analyzeScan, {
        body: { fruit_type: 'apple' },
      });
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('fruit_type must be one of');
    });

    test('should fail without fruit_type', () => {
      const { error } = validateSchema(scanValidation.analyzeScan, {
        body: {},
      });
      expect(error).toBeDefined();
    });
  });

  describe('getScans', () => {
    test('should pass with valid query params', () => {
      const { error } = validateSchema(scanValidation.getScans, {
        query: { page: 1, limit: 10 },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with page < 1', () => {
      const { error } = validateSchema(scanValidation.getScans, {
        query: { page: 0 },
      });
      expect(error).toBeDefined();
    });

    test('should fail with limit > 100', () => {
      const { error } = validateSchema(scanValidation.getScans, {
        query: { limit: 101 },
      });
      expect(error).toBeDefined();
    });

    test('should allow object_type filter', () => {
      const { error } = validateSchema(scanValidation.getScans, {
        query: { object_type: 'fruit' },
      });
      expect(error).toBeUndefined();
    });

    test('should fail with invalid object_type', () => {
      const { error } = validateSchema(scanValidation.getScans, {
        query: { object_type: 'animal' },
      });
      expect(error).toBeDefined();
    });
  });

  describe('getScan / deleteScan', () => {
    test('should pass with valid id', () => {
      const { error } = validateSchema(scanValidation.getScan, {
        params: { id: 1 },
      });
      expect(error).toBeUndefined();
    });

    test('should fail without id', () => {
      const { error } = validateSchema(scanValidation.getScan, {
        params: {},
      });
      expect(error).toBeDefined();
    });

    test('should fail with non-integer id', () => {
      const { error } = validateSchema(scanValidation.deleteScan, {
        params: { id: 'abc' },
      });
      expect(error).toBeDefined();
    });
  });
});
