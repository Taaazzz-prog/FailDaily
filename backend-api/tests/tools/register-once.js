const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const email = `test.${Date.now()}@faildaily.com`;
  const body = {
    email,
    password: 'TestPassword123!',
    displayName: 'Dbg' + Date.now(),
    birthDate: '1990-01-01',
    agreeToTerms: true,
    agreeToNewsletter: false
  };
  const url = `http://localhost:${process.env.PORT || 3001}/api/registration/register`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', text);
  } catch (e) {
    console.error('Request error:', e.message);
  }
}

main();
