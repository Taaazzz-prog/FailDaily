const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const which = process.argv[2] || 'registration';
  let mod, fn;
  if (which === 'registration') {
    mod = require('./2_auth/2.1_registration-test-simple');
    fn = mod.testRegistration;
  } else if (which === 'login') {
    fn = require('./2_auth/2.2_login-test');
  } else if (which === 'jwt') {
    fn = require('./2_auth/2.3_jwt-verification-test');
  } else {
    console.error('Unknown test:', which);
    process.exit(2);
  }

  try {
    const res = await fn();
    console.log('\nRAW RESULT:', JSON.stringify(res, null, 2));
    process.exit(res && res.success ? 0 : 1);
  } catch (e) {
    console.error('Test threw:', e);
    process.exit(1);
  }
})();
