const globals = require('globals');

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
      'no-dupe-class-members': 'error',
      'no-prototype-builtins': 'error'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      'tests/**'
    ]
  }
];
