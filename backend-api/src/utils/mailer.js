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

async function getEmailConfig() {
  try {
    const { executeQuery } = require('../config/database');
    const rows = await executeQuery('SELECT value FROM app_config WHERE `key` = ? LIMIT 1', ['email']);
    if (rows && rows[0] && rows[0].value) {
      try { return JSON.parse(rows[0].value); } catch { return { enabled: false }; }
    }
  } catch (e) {
    // ignore DB errors; default disabled
  }
  return { enabled: false };
}

async function sendMail({ to, subject, text, html }) {
  // Admin toggle: if disabled, skip send
  try {
    const cfgDb = await getEmailConfig();
    if (!cfgDb.enabled) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('✉️  Email désactivé par configuration admin (app_config.email.enabled=false).');
      }
      return false;
    }
  } catch {}
  const cfg = getSmtpConfig();
  if (!isConfigured(cfg)) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ SMTP non configuré: email non envoyé. Renseigner SMTP_HOST/SMTP_USER.');
    }
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
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Erreur envoi email reset:', e?.message);
    }
    return false;
  }
}

module.exports = { sendMail, sendPasswordResetEmail };
/**
 * Envoi email de vérification d'inscription
 */
async function sendVerificationEmail(to, token) {
  const base = process.env.APP_WEB_URL || 'http://localhost:8000';
  const url = new URL('/verify-email', base);
  url.searchParams.set('token', token);
  const link = url.toString();
  const subject = 'Vérification de votre email - FailDaily';
  const text = `Bonjour,\n\nMerci de confirmer votre adresse email.\n\nCliquez sur ce lien pour vérifier votre email (valide 24h):\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Vérification de votre email</h2>
      <p>Merci de confirmer votre adresse email pour activer votre compte.</p>
      <p>
        <a href="${link}" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">
          Vérifier mon email
        </a>
      </p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>
        <a href="${link}">${link}</a>
      </p>
      <p style="font-size:12px;color:#666">Ce lien est valable 24 heures.</p>
    </div>
  `;
  try {
    return await sendMail({ to, subject, text, html });
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Erreur envoi email vérification:', e?.message);
    }
    return false;
  }
}

/**
 * Envoi email de consentement parental
 */
async function sendParentConsentEmail(parentEmail, childEmail, token) {
  const base = process.env.APP_WEB_URL || 'http://localhost:8000';
  const approveUrl = new URL('/parent-consent', base);
  approveUrl.searchParams.set('token', token);
  const link = approveUrl.toString();
  const subject = 'FailDaily - Consentement parental requis';
  const text = `Bonjour,\n\nL'utilisateur mineur ${childEmail} souhaite activer son compte FailDaily.\nVeuillez donner votre consentement en visitant le lien suivant:\n${link}\n\nSi vous refusez, ignorez simplement cet email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
      <h2>Consentement parental requis</h2>
      <p>L'utilisateur mineur <b>${childEmail}</b> souhaite activer son compte FailDaily.</p>
      <p>
        <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">
          Donner mon consentement
        </a>
      </p>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br/>
        <a href="${link}">${link}</a>
      </p>
    </div>
  `;
  try {
    return await sendMail({ to: parentEmail, subject, text, html });
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('❌ Erreur envoi email consentement parental:', e?.message);
    }
    return false;
  }
}

module.exports.sendVerificationEmail = sendVerificationEmail;
module.exports.sendParentConsentEmail = sendParentConsentEmail;
