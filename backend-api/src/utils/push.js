// Lazy ESM-compatible fetch loader (node-fetch v3 is ESM-only)
async function doFetch(url, options) {
  const mod = await import('node-fetch');
  const fetch = mod.default || mod;
  return fetch(url, options);
}
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
  const isTest = (process.env.NODE_ENV === 'test');
  const serverKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY || '';
  if (!serverKey) {
    if (!isTest) console.warn('🔕 FCM server key missing, skipping push');
    try {
      // tenter d'auto-désactiver la conf push si présente
      await executeQuery(
        "UPDATE app_config SET value = JSON_SET(value, '$.enabled', false) WHERE `key` = 'push'"
      );
    } catch {}
    return { sent: false, reason: 'missing_key', autoDisabled: true };
  }

  if (!Array.isArray(tokens) || tokens.length === 0) {
    return { sent: false, reason: 'no_tokens' };
  }
  const validTokens = tokens.filter((t) => t && typeof t === 'string' && t.length > 10);
  if (validTokens.length === 0) {
    return { sent: false, reason: 'invalid_tokens' };
  }

  const payload = {
    registration_ids: validTokens,
    notification: {
      title: notification?.title || 'FailDaily',
      body: notification?.body || 'Nouvelle notification',
      icon: notification?.icon || '/assets/icon.png'
    },
    data: notification?.data || {}
  };

  try {
    const res = await doFetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'key=' + serverKey },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      if (!isTest) console.warn('❌ FCM push failed:', res.status, text);
      try {
        await executeQuery(
          'INSERT INTO push_errors (error_type, status_code, message, tokens_count, created_at) VALUES (?, ?, ?, ?, NOW())',
          ['fcm_send_failed', res.status, String(text).slice(0, 500), validTokens.length]
        );
      } catch {}
      return { sent: false, status: res.status, error: 'fcm_failed' };
    }
    const result = await res.json();
    return { sent: true, fcmResult: result, tokensCount: validTokens.length };
  } catch (error) {
    if (!isTest) console.error('❌ Push notification error:', error?.message || error);
    try {
      await executeQuery(
        'INSERT INTO push_errors (error_type, message, tokens_count, created_at) VALUES (?, ?, ?, NOW())',
        ['exception', error?.message || String(error), validTokens.length]
      );
    } catch {}
    return { sent: false, error: error?.message || 'exception' };
  }
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
