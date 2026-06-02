const axios = require('axios');
const config = require('./env');

const mlClient = axios.create({
  baseURL: config.ml.apiUrl,
  timeout: config.ml.timeout,
  headers: { Accept: 'application/json' },
});

module.exports = mlClient;
