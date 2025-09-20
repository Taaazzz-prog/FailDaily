/**
 * Configuration Webpack personnalisée pour FailDaily
 * Supprime automatiquement tous les console.* en production
 */

module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      (compiler) => {
        const TerserPlugin = require('terser-webpack-plugin');
        new TerserPlugin({
          terserOptions: {
            compress: {
              // ✅ Supprime tous les console.* en production
              drop_console: true,
              drop_debugger: true,
              // Supprime les console.log, console.warn, console.error, etc.
              pure_funcs: [
                'console.log',
                'console.warn', 
                'console.error',
                'console.info',
                'console.debug',
                'console.trace'
              ]
            },
            mangle: true,
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }).apply(compiler);
      },
    ],
  },
};