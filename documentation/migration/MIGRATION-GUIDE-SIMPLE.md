# Guide Migration - Ajout des données légales

## Étapes à suivre

### 1. Exécuter la migration SQL

1. Connectez-vous à votre projet Supabase
2. Allez dans l'onglet "SQL Editor"
3. Copiez et collez le contenu du fichier `database-migration-add-legal-columns.sql`
4. Cliquez sur "RUN" pour exécuter le script

### 2. Vérifier la migration

Après l'exécution, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('legal_consent', 'age_verification');
```

Vous devriez voir :
- `legal_consent` | `jsonb`
- `age_verification` | `jsonb`

### 3. Tester les fonctions RPC

Testez que les fonctions RPC fonctionnent :

```sql
-- Vérifier qu'un utilisateur existe (remplacez l'UUID par un vrai ID)
SELECT check_user_registration_status('00000000-0000-0000-0000-000000000000');
```

### 4. Pour le développement (optionnel)

Si vous avez des problèmes avec la validation d'email pendant les tests, vous pouvez temporairement désactiver la confirmation d'email :

```sql
-- SEULEMENT POUR LE DÉVELOPPEMENT
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
```

## Ce que fait cette migration

1. **Ajoute 2 nouvelles colonnes à la table `profiles` existante :**
   - `legal_consent` (JSONB) : stocke les données de consentement légal
   - `age_verification` (JSONB) : stocke les données de vérification d'âge

2. **Crée des fonctions RPC :**
   - `complete_user_registration()` : finalise l'inscription avec données légales
   - `check_user_registration_status()` : vérifie le statut d'inscription
   - `validate_legal_consent()` : valide la structure des données légales

3. **Ajoute des contraintes et validations :**
   - Structure obligatoire pour les données légales
   - Validation des dates (pas dans le futur)
   - Validation de la cohérence âge/statut mineur

4. **Configure la sécurité :**
   - Politiques RLS pour protéger les données
   - Permissions appropriées sur les fonctions

## Structure des données attendues

### legal_consent
```json
{
  "documentsAccepted": true,
  "consentDate": "2025-08-08T10:00:00.000Z",
  "consentVersion": "1.0",
  "marketingOptIn": false
}
```

### age_verification
```json
{
  "birthDate": "2000-01-01",
  "isMinor": false,
  "needsParentalConsent": false,
  "parentEmail": null,
  "parentConsentDate": null
}
```

## Après la migration

1. L'application devrait fonctionner normalement
2. Les nouveaux utilisateurs auront leurs données légales stockées automatiquement
3. Les utilisateurs existants peuvent continuer à utiliser l'app (les colonnes peuvent être NULL)
