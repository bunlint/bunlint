module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    '*.js',
    '!jest.config.js',
    '!tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  coverageReporters: ['text', 'lcov'],
  clearMocks: true,
  resetMocks: false,
  testRunner: "jest-circus/runner",
  maxWorkers: 1,
}; 