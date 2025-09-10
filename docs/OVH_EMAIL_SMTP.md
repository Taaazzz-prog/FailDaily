# Configuration SMTP OVH — FailDaily

Ce guide décrit comment configurer l’envoi d’emails via OVH (hébergement mail) pour les fonctionnalités comme la réinitialisation de mot de passe.

## 1) Pré-requis
- Une boîte mail OVH créée (ex: `contact@faildaily.com`).
- Les identifiants de cette boîte (utilisateur/mot de passe).
- Le domaine correctement configuré (DNS) côté OVH.

## 2) Variables d’environnement backend
Dans `backend-api/.env` (ou variables du conteneur Docker), renseignez:

```
APP_WEB_URL=https://faildaily.com

SMTP_HOST=ssl0.ovh.net
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@faildaily.com
SMTP_PASS=********
SMTP_FROM=FailDaily <contact@faildaily.com>
```

Notes:
- Si vous utilisez le port 587, mettez `SMTP_SECURE=false` (STARTTLS).
- `APP_WEB_URL` est utilisé pour construire les liens (ex: reset mot de passe) dans les emails.

## 3) Installation de la dépendance
Depuis `backend-api/`:

```
npm i nodemailer --save
```

La base de code gère l’absence de nodemailer sans crash, mais pour envoyer réellement des emails la dépendance doit être installée.

## 4) Tests rapides
1. Déclenchez un reset:
   - `POST /api/auth/password-reset` avec `{ email: "<une_adresse_existant_en_base>" }`
2. Vérifiez les logs backend:
   - `📧 Email envoyé: <id>` si SMTP est correctement configuré.
   - Sinon, un avertissement explicite est affiché.
3. L’email contient un lien `https://faildaily.com/reset-password?token=...` (selon `APP_WEB_URL`).
4. La page `reset-password` permet de saisir le nouveau mot de passe et appelle `POST /api/auth/password-reset/confirm`.

## 5) Bonnes pratiques OVH
- Ajoutez un champ SPF (DNS) autorisant `ssl0.ovh.net` à émettre pour votre domaine.
- Activez DKIM si disponible sur votre offre pour une meilleure délivrabilité.
- Utilisez une adresse `From` rattachée à votre domaine (`contact@votre-domaine`).

## 6) Dépannage
- Erreur `ECONNREFUSED` / `ETIMEDOUT`: vérifiez firewall et ports sortants.
- Erreur d’authentification: vérifiez `SMTP_USER`/`SMTP_PASS` et si l’adresse est bien autorisée.
- Pas d’email reçu: vérifiez les dossiers spam, SPF/DKIM, et les enregistrements DNS.

