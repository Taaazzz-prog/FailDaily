module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  verbose: true,
  testTimeout: 60000,
  testPathIgnorePatterns: [
    '/tests/1_database/',
    '/tests/2_auth/',
    '/tests/3_fails/',
    '/tests/4_integration/',
    '/tests/run-all-tests\\.js$',
    '/tests/run-one\\.js$',
    '/tests/tools/'
  ]
};
