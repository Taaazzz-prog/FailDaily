const { defineConfig } = require('cypress');
module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_baseUrl || 'http://localhost:8081',
    env: {
      apiUrl: process.env.CYPRESS_apiUrl || 'http://localhost:3001/api'
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
  }
});
