module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js', '**/__tests__/**/*.js'],
  collectCoverageFrom: [
    'backend/**/*.js',
    '!backend/node_modules/**',
    '!backend/test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/backend/test/setup.js'],
  testTimeout: 10000
};
