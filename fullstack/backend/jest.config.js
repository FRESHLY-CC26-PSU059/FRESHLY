module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/docs/**',
    '!src/config/database.js',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
