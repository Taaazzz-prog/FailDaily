const { executeQuery } = require('../config/database');

function getIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
}

function getCountry(req) {
  // Headers possibles de proxy/CDN
  const cf = req.headers['cf-ipcountry'];
  const xcc = req.headers['x-country-code'] || req.headers['x-app-country'];
  const geo = (cf || xcc || '').toString().trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(geo)) return geo;
  return null;
}

function sanitizeBody(body) {
  try {
    if (!body || typeof body !== 'object') return null;
    const clone = JSON.parse(JSON.stringify(body));
    if (clone.password) clone.password = '***';
    if (clone.password_hash) clone.password_hash = '***';
    if (clone.token) clone.token = '***';
    return clone;
  } catch { return null; }
}

module.exports = function requestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    const ip = getIp(req);
    const country = getCountry(req);
    const ua = req.headers['user-agent'] || '';
    const userId = req.user?.id || null;

    res.on('finish', async () => {
      try {
        const duration = Date.now() - start;
        const id = require('crypto').randomUUID();
        await executeQuery(
          `INSERT INTO request_logs (id, user_id, method, url, status_code, response_ms, ip_address, country_code, user_agent, params, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [id, userId, req.method, req.originalUrl || req.url, res.statusCode,
           duration, ip, country, ua, JSON.stringify(req.params || null), JSON.stringify(sanitizeBody(req.body))]
        );

        if (userId && ip) {
          // Upsert user_ip_history
          const existing = await executeQuery(
            'SELECT id, seen_count FROM user_ip_history WHERE user_id = ? AND ip_address = ? LIMIT 1',
            [userId, ip]
          );
          if (existing.length > 0) {
            await executeQuery(
              'UPDATE user_ip_history SET user_agent = ?, country_code = ?, last_seen = NOW(), seen_count = seen_count + 1 WHERE id = ?',
              [ua, country, existing[0].id]
            );
          } else {
            await executeQuery(
              'INSERT INTO user_ip_history (id, user_id, ip_address, user_agent, country_code, first_seen, last_seen, seen_count) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), 1)',
              [require('crypto').randomUUID(), userId, ip, ua, country]
            );
          }
        }
      } catch (e) {
        // Ne jamais casser la réponse pour le logging
        if (process.env.NODE_ENV !== 'test') console.warn('requestLogger insert failed:', e?.message);
      }
    });

    next();
  };
};

