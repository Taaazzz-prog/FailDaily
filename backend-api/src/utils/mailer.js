// Chargement paresseux de nodemailer (évite crash si dépendance non installée)
function loadNodemailer() {
  try {
    return require('nodemailer');
  } catch (e) {
    console.warn("⚠️ Nodemailer non installé. Exécutez 'npm i nodemailer' dans backend-api/ pour activer l'envoi d'emails.", e?.message);
    return null;
  }
}

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    from: process.env.SMTP_FROM || 'FailDaily <no-reply@faildaily.com>'
  };
}

function isConfigured(cfg) {
  return !!(cfg.host && cfg.auth && cfg.auth.user);
}

function createTransporter(cfg) {
  const nodemailer = loadNodemailer();
  if (!nodemailer) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.auth
  });
}

async function sendMail({ to, subject, text, html }) {
  const cfg = getSmtpConfig();
  if (!isConfigured(cfg)) {
    console.warn('⚠️ SMTP non configuré: email non envoyé. Renseigner SMTP_HOST/SMTP_USER.');
    return false;
  }
  const transporter = createTransporter(cfg);
  if (!transporter) return false;
  const info = await transporter.sendMail({ from: cfg.from, to, subject, text, html });
  console.log('📧 Email envoyé:', info.messageId);
  return true;
}

function buildResetLink(token) {
  const base = process.env.APP_WEB_URL || 'http://localhost:8080';
  const url = new URL('/reset-password', base);
  url.searchParams.set('token', token);
  return url.toString();
}

async function sendPasswordResetEmail(to, token) {
  const link = buildResetLink(token);
  const subject = 'Réinitialisation de votre mot de passe - FailDaily';
  const text = `Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe.\n\nCliquez sur ce lien pour définir un nouveau mot de passe (valide 1h):\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>
        <a href="${link}" style="background:#4f46e5;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">
          Définir un nouveau mot de passe
        </a>
      </p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>
        <a href="${link}">${link}</a>
      </p>
      <p style="font-size:12px;color:#666">Ce lien est valable 1 heure.</p>
    </div>
  `;
  try {
    return await sendMail({ to, subject, text, html });
  } catch (e) {
    console.error('❌ Erreur envoi email reset:', e?.message);
    return false;
  }
}

module.exports = { sendMail, sendPasswordResetEmail };
