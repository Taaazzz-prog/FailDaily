// backend-api/eslint.config.js  (ESM flat config)
import globals from 'globals';

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.jest, // pour que Jest soit reconnu
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-undef': 'error',
      'no-dupe-class-members': 'error',
      'no-prototype-builtins': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      'coverage/**', // utile aussi
      'tests/**',    // si tu veux VRAIMENT ignorer les tests
      'eslint.config.mjs',
    ],
  },
];