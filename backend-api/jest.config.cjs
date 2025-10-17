module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  verbose: true,
  testTimeout: 60000,
  globalTeardown: '<rootDir>/tests/tools/teardown.js',
  forceExit: true,
  detectOpenHandles: false,
  setupFiles: ['<rootDir>/tests/tools/setup-env.js'],
  testPathIgnorePatterns: [
    '/tests/run-all-tests\\.js$',
    '/tests/run-one\\.js$',
    '/tests/run-functional-tests\\.js$',
    '/tests/validate-user-features\\.js$',
    '/tests/diagnostic-simple\\.js$',
    '/tests/tools/'
  ]
};
