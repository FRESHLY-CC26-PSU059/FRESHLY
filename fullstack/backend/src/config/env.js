const Joi = require('joi');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(5000),
    PG_HOST: Joi.string().required().description('PostgreSQL host'),
    PG_PORT: Joi.number().default(5432).description('PostgreSQL port'),
    PG_USER: Joi.string().required().description('PostgreSQL user'),
    PG_PASSWORD: Joi.string().required().allow('').description('PostgreSQL password'),
    PG_DATABASE: Joi.string().required().description('PostgreSQL database name'),
    JWT_SECRET: Joi.string().required().min(32).description('JWT access token secret (min 32 chars)'),
    JWT_EXPIRES_IN: Joi.string().default('1d'),
    JWT_REFRESH_SECRET: Joi.string().required().min(32).description('JWT refresh token secret (min 32 chars)'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
    CLIENT_KEY: Joi.string().required().description('API client key'),
    CORS_ORIGIN: Joi.string().default('*').description('Comma-separated CORS origins'),
    GEMINI_API_KEY: Joi.when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required().description('Gemini API key (required in production)'),
      otherwise: Joi.string().allow('').default(''),
    }),
    ML_API_URL: Joi.string().default('http://localhost:8000').description('Python ML API URL'),
    ML_API_TIMEOUT: Joi.number().default(30000).description('ML API timeout in ms'),
    ML_API_MOCK: Joi.when('NODE_ENV', {
      is: 'production',
      then: Joi.boolean()
        .valid(false)
        .default(false)
        .description('Mock must be false in production'),
      otherwise: Joi.boolean().default(false),
    }),
    UPLOAD_DIR: Joi.string().default('uploads'),
    MAX_FILE_SIZE: Joi.number().default(5242880),
    SMTP_HOST: Joi.string().allow('').default(''),
    SMTP_PORT: Joi.number().default(587),
    SMTP_USER: Joi.string().allow('').default(''),
    SMTP_PASS: Joi.string().allow('').default(''),
    SMTP_FROM: Joi.string().default('noreply@freshly.id'),
    GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
    RECAPTCHA_SECRET_KEY: Joi.when('NODE_ENV', {
      is: 'production',
      then: Joi.string().required().description('Google reCAPTCHA secret key (required in production)'),
      otherwise: Joi.string().allow('').default(''),
    }),
    E2E_BYPASS_TOKEN: Joi.string().allow('').default('').description('Secret token to bypass reCAPTCHA in E2E tests'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  clientKey: envVars.CLIENT_KEY,
  corsOrigin: envVars.CORS_ORIGIN,
  db: {
    host: envVars.PG_HOST,
    port: envVars.PG_PORT,
    user: envVars.PG_USER,
    password: envVars.PG_PASSWORD,
    name: envVars.PG_DATABASE,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  geminiApiKey: envVars.GEMINI_API_KEY,
  ml: {
    apiUrl: envVars.ML_API_URL,
    timeout: envVars.ML_API_TIMEOUT,
    mock: envVars.ML_API_MOCK,
  },
  upload: {
    dir: envVars.UPLOAD_DIR,
    maxFileSize: envVars.MAX_FILE_SIZE,
  },
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
    from: envVars.SMTP_FROM,
  },
  googleClientId: envVars.GOOGLE_CLIENT_ID,
  recaptchaSecretKey: envVars.RECAPTCHA_SECRET_KEY,
  e2eBypassToken: envVars.E2E_BYPASS_TOKEN,
};
