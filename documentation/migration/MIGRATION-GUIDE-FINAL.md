# Guide de Migration Final - FailDaily

## Situation actuelle
Votre table `profiles` existe déjà avec les bonnes colonnes :
- ✅ `legal_consent` (JSONB)
- ✅ `age_verification` (JSONB)  
- ✅ `email_confirmed` (boolean)
- ✅ `registration_completed` (boolean)

## Ce qu'il faut faire

### 1. Exécuter seulement le script des fonctions manquantes

Copiez et exécutez dans Supabase SQL Editor le contenu de :
```
database-migration-functions-only.sql
```

Ce script va créer :
- ✅ `validate_legal_consent()` - fonction de validation des CGU
- ✅ `validate_age_verification()` - fonction de validation de l'âge
- ✅ `complete_user_registration()` - fonction RPC pour finaliser l'inscription
- ✅ `check_user_registration_status()` - fonction RPC pour vérifier le statut
- ✅ Triggers et politiques de sécurité mises à jour

### 2. Vérifier que tout fonctionne

Après l'exécution, testez avec cette requête :
```sql
-- Test des fonctions de validation
SELECT 
  validate_legal_consent('{"documentsAccepted": true, "consentDate": "2025-08-08T10:00:00.000Z", "consentVersion": "1.0"}'::jsonb) as legal_valid,
  validate_age_verification('{"birthDate": "2000-01-01", "isMinor": false}'::jsonb) as age_valid;
```

Vous devriez voir :
- `legal_valid`: true
- `age_valid`: true

### 3. Test d'inscription complète

Votre application est maintenant prête ! Le flux d'inscription fonctionne comme ceci :

1. **Inscription basique** → Crée le compte et profil de base
2. **Modal de consentement** → Collecte les données légales
3. **Finalisation** → Appelle `complete_user_registration()` pour sauvegarder

### 4. Pour le développement (optionnel)

Si vous voulez tester sans validation d'email :
```sql
-- Confirmer tous les emails existants (DEV seulement)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
UPDATE profiles SET email_confirmed = true WHERE email_confirmed = false;
```

## Champs dans votre table profiles

```sql
legal_consent: {
  "documentsAccepted": ["terms", "privacy", "cookies"],
  "consentDate": "2025-08-08T10:00:00.000Z",
  "consentVersion": "1.0",
  "marketingOptIn": false
}

age_verification: {
  "birthDate": "2000-01-01",
  "isMinor": false,
  "needsParentalConsent": false,
  "parentEmail": null,
  "parentConsentDate": null
}
```

## Après la migration

- ✅ L'application fonctionne déjà (ionic serve marche)
- ✅ Les nouveaux utilisateurs auront leurs données légales sauvegardées
- ✅ Les utilisateurs existants peuvent continuer sans problème
- ✅ Le système respecte RGPD/COPPA avec validation d'âge

Vous êtes prêts ! 🚀
