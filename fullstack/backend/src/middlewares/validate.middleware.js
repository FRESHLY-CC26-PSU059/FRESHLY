const Joi = require('joi');
const ApiError = require('../utils/api-error');
const ERROR_CODES = require('../utils/errorCodes');

const validate = (schema) => (req, _res, next) => {
  const validSchema = Joi.object(schema);
  const object = Object.keys(schema).reduce((obj, key) => {
    if (Object.prototype.hasOwnProperty.call(req, key)) {
      obj[key] = req[key];
    }
    return obj;
  }, {});

  // Strip unknown keys so crafted payloads can't smuggle fields into services.
  const { value, error } = validSchema.validate(object, {
    abortEarly: false,
    stripUnknown: { objects: true, arrays: false },
    convert: true,
  });

  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return next(new ApiError(400, errorMessage, ERROR_CODES.VALIDATION_ERROR));
  }

  // Express 5 makes req.query read-only; copy instead of reassign.
  for (const key of Object.keys(value)) {
    if (key === 'query' && req.query && typeof req.query === 'object') {
      // Remove keys that were stripped by Joi so controllers can't see them.
      for (const qk of Object.keys(req.query)) {
        if (!(qk in value.query)) {
          delete req.query[qk];
        }
      }
      Object.assign(req.query, value.query);
    } else {
      req[key] = value[key];
    }
  }

  return next();
};

module.exports = validate;
