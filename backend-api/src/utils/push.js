const fetch = (require('node-fetch').default || require('node-fetch'));
const { executeQuery } = require('../config/database');

async function getPushConfig() {
  try {
    const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['push']);
    if (rows && rows[0] && rows[0].value) {
      try { return JSON.parse(rows[0].value); } catch { return { enabled: false, provider: 'fcm' }; }
    }
  } catch {}
  return { enabled: false, provider: 'fcm' };
}

async function sendPushToTokens(tokens, notification, cfg) {
  // Currently only FCM supported
  const serverKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || '';
  if (!serverKey) {
    console.warn('🔕 FCM server key missing, skipping push');
    return { sent: false, reason: 'missing_key' };
  }
  // Minimal FCM send (legacy)
  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'key=' + serverKey
    },
    body: JSON.stringify({ registration_ids: tokens, notification })
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('❌ FCM push failed:', res.status, text);
    return { sent: false, status: res.status };
  }
  return { sent: true };
}

async function sendPushToUser(userId, notification) {
  const cfg = await getPushConfig();
  if (!cfg.enabled) {
    return { sent: false, disabled: true };
  }
  const rows = await executeQuery('SELECT token FROM user_push_tokens WHERE user_id = ?', [userId]);
  const tokens = rows.map(r => r.token);
  if (tokens.length === 0) return { sent: false, noTokens: true };
  return await sendPushToTokens(tokens, notification, cfg);
}

module.exports = { getPushConfig, sendPushToUser };
