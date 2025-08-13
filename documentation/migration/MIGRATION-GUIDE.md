# Migration du système d'authentification avec validation légale

## Problèmes identifiés et solutions

### 1. **Problème : Email non confirmé**
- **Cause** : Supabase par défaut requiert une confirmation d'email
- **Erreur** : `AuthApiError: Email not confirmed`

### 2. **Problème : Structure BD insuffisante**
- **Cause** : La table `profiles` ne contient pas les champs pour les données légales
- **Manque** : Consentement CGU, vérification d'âge, email parents, etc.

### 3. **Problème : Processus d'inscription incomplet**
- **Cause** : Pas de validation des CGU intégrée dans le flux d'inscription

## Étapes de migration

### Phase 1: Migration de la base de données
1. **Exécuter le script de migration principal** :
   ```sql
   -- Copier et exécuter le contenu de database-migration-legal.sql
   -- dans Supabase SQL Editor
   ```

2. **Pour les tests en développement seulement** :
   ```sql
   -- Copier et exécuter le contenu de dev-disable-email-validation.sql
   -- ATTENTION: NE PAS UTILISER EN PRODUCTION
   ```

### Phase 2: Structure des données

#### Nouvelle structure User :
```typescript
interface User {
  // ... champs existants
  legalConsent?: {
    documentsAccepted: string[];
    consentDate: Date;
    consentVersion: string;
    marketingOptIn: boolean;
  };
  ageVerification?: {
    birthDate: Date;
    isMinor: boolean;
    needsParentalConsent: boolean;
    parentEmail?: string;
    parentConsentDate?: Date;
  };
}
```

#### Nouvelle structure en BD :
```sql
ALTER TABLE profiles 
ADD COLUMN legal_consent JSONB DEFAULT NULL,
ADD COLUMN age_verification JSONB DEFAULT NULL,
ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN registration_completed BOOLEAN DEFAULT FALSE;
```

### Phase 3: Flux d'inscription mis à jour

1. **Utilisateur remplit le formulaire** → Validation des champs
2. **Clic sur "Créer mon compte"** → Ouverture du modal de consentement légal
3. **Saisie date de naissance** → Vérification automatique de l'âge
4. **Si mineur (13-16 ans)** → Demande email parent obligatoire
5. **Si trop jeune (<13 ans)** → Blocage de l'inscription
6. **Validation des CGU** → Acceptation obligatoire des documents
7. **Création du compte Supabase** → Compte de base créé
8. **Finalisation avec données légales** → Appel à `complete_registration()`

### Phase 4: Gestion des cas particuliers

#### Adulte (18+ ans) :
- Inscription directe après acceptation des CGU
- Redirection vers l'application

#### Mineur avec consentement parental (13-16 ans) :
- Email envoyé au parent avec lien de validation
- Compte créé mais non activé
- Activation après clic du parent (à implémenter)

#### Trop jeune (<13 ans) :
- Inscription bloquée
- Message informatif sur l'âge minimum

### Phase 5: Configuration Supabase

#### Fonctions RPC créées :
- `complete_registration(user_id, legal_consent, age_verification)`
- `check_registration_status(user_id)`

#### Politiques RLS :
- Utilisateurs ne voient que leur propre profil
- Accès sécurisé aux données personnelles

#### Contraintes de validation :
- Validation automatique des données de consentement
- Vérification de la cohérence des données d'âge

## Test du système

### 1. Test utilisateur adulte :
1. Aller sur `/auth/register`
2. Remplir le formulaire
3. Cliquer sur "Créer mon compte"
4. Dans le modal : saisir date de naissance (adulte)
5. Accepter tous les documents requis
6. → Doit créer le compte et rediriger vers `/tabs/home`

### 2. Test utilisateur mineur :
1. Même processus mais date de naissance entre 13-16 ans
2. Saisir email du parent
3. → Doit créer le compte et afficher message de validation parentale
4. → Redirection vers `/auth/login`

### 3. Test utilisateur trop jeune :
1. Date de naissance < 13 ans
2. → Message d'erreur et impossible de continuer

## Configuration de production

### Variables d'environnement :
```typescript
// environment.prod.ts
export const environment = {
  // ... autres configs
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    key: 'YOUR_SUPABASE_ANON_KEY'
  },
  legalVersion: '1.0',
  minAge: 13,
  parentalConsentAge: 16
};
```

### Service d'email pour consentement parental :
```typescript
// À intégrer : SendGrid, Mailgun, ou autre
await this.emailService.sendParentalConsentEmail(parentEmail, {
  childName,
  childAge,
  consentLink,
  documents: ['CGU', 'Politique de confidentialité']
});
```

## Vérifications post-migration

1. **Structure BD** : Vérifier que les colonnes sont créées
2. **Fonctions** : Tester les fonctions RPC
3. **Inscription** : Tester le flux complet
4. **Connexion** : Vérifier que les utilisateurs peuvent se connecter
5. **Données** : Contrôler que les données légales sont bien stockées

## Surveillance et maintenance

### Logs à surveiller :
- Erreurs d'inscription
- Problèmes de validation des CGU
- Échecs de finalisation d'inscription

### Métriques importantes :
- Taux de completion d'inscription
- Nombre d'utilisateurs mineurs
- Demandes de consentement parental

### Maintenance régulière :
- Nettoyage des comptes non finalisés après X jours
- Mise à jour des versions des documents légaux
- Suivi des consentements parentaux en attente
