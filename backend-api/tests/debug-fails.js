// Test simple pour voir l'erreur exacte
const FailsController = require('../src/controllers/failsController');

// Mock request/response pour debug
const req = {
  query: {},
  user: null
};

const res = {
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log('Status:', code);
    return res;
  }
};

console.log('🧪 Test getFails...');
FailsController.getFails(req, res);
