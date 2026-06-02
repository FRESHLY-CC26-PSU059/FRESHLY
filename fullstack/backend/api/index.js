// Vercel Serverless Entry Point
// Exports the Express app for Vercel's @vercel/node builder
require('pg');
require('pg-hstore');
const app = require('../src/app');

module.exports = app;
