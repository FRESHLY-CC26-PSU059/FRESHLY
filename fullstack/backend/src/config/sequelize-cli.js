require('dotenv').config();

const buildConfig = (overrides = {}) => ({
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  dialectOptions:
    process.env.PG_SSL === 'true' || process.env.PG_HOST?.includes('supabase')
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  ...overrides,
});

// `test` uses a separate DB so jest/CI can't stomp dev or prod data.
module.exports = {
  development: buildConfig(),
  test: buildConfig({
    database: process.env.PG_DATABASE_TEST || `${process.env.PG_DATABASE || 'freshly'}_test`,
  }),
  production: buildConfig(),
};

