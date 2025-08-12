# 🔥 Guide de Réinitialisation Complète - Panel Admin

## ⚠️ ATTENTION - FONCTION DESTRUCTRICE

Cette fonctionnalité permet de remettre la base de données dans un état complètement vierge pour recommencer les tests à zéro.

## 🎯 Données Supprimées

La réinitialisation supprimera **TOUTES** les données suivantes :

### 🗑️ Tables Vidées
- `auth.users` - Tous les comptes utilisateurs
- `profiles` - Tous les profils utilisateurs 
- `fails` - Tous les échecs/fails postés
- `reactions` - Toutes les réactions données
- `badges` - Tous les badges attribués
- `user_badges` - Toutes les associations badge-utilisateur

### ✅ Données Préservées
- `badge_definitions` - Les définitions des badges (types, conditions, etc.)

## 🛡️ Processus de Sécurité

Le système utilise un processus de confirmation à 3 étapes :

### Étape 1 : Déclenchement Initial
- Clic sur "Réinitialiser la Base de Données"
- Affichage d'un avertissement avec la liste des données qui seront supprimées

### Étape 2 : Première Confirmation
- Demande de confirmation "Êtes-vous sûr ?"
- Options : Annuler ou Continuer

### Étape 3 : Confirmation Finale
- Saisie obligatoire de "SUPPRIMER TOUT" (sensible à la casse)
- Le bouton n'est activé que si le texte exact est saisi
- Dernière chance d'annuler

## 🔧 Implémentation Technique

### Ordre de Suppression
L'ordre de suppression respecte les contraintes de clés étrangères :

1. `user_badges` (liens badge-utilisateur)
2. `badges` (badges attribués)
3. `reactions` (réactions aux fails)
4. `fails` (échecs/posts)
5. `profiles` (profils utilisateurs)
6. `auth.users` (comptes utilisateurs)

### Gestion des Erreurs
- Chaque étape de suppression est loggée
- Les erreurs sont capturées et affichées
- La suppression continue même si certaines étapes échouent
- Rapport détaillé en fin de processus

### Fonction RPC Supabase
Pour supprimer les utilisateurs de `auth.users`, une fonction RPC est nécessaire :

```sql
-- À exécuter dans Supabase SQL Editor
CREATE OR REPLACE FUNCTION delete_all_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM auth.users LOOP
        DELETE FROM auth.users WHERE id = user_rec.id;
    END LOOP;
END;
$$;
```

## 📊 Retour Utilisateur

Après la réinitialisation, l'interface affiche :
- ✅ Liste des tables successfully supprimées
- ❌ Erreurs éventuelles avec détails
- ⚠️ Avertissements pour les suppressions partielles
- 🎯 Confirmation de préservation des badge_definitions

## 🔄 Après Réinitialisation

Une fois la réinitialisation terminée :

1. **Interface Admin** : La liste des utilisateurs sera vide
2. **Application** : Tous les comptes seront supprimés
3. **Tests** : Vous pouvez recommencer avec des données 100% propres
4. **Badges** : Les définitions restent disponibles pour attribution

## 🚨 Précautions d'Usage

- ⛔ **JAMAIS en production** - Cette fonction est exclusivement pour les environnements de développement/test
- 💾 **Backup recommandé** - Faire une sauvegarde avant utilisation si nécessaire
- 🔍 **Vérification post-réinitialisation** - Contrôler que seuls les `badge_definitions` restent
- 🧪 **Environnement isolé** - S'assurer d'être sur la bonne base de données

## 💡 Cas d'Usage

Cette fonctionnalité est idéale pour :
- 🧪 Tests de régression complets
- 📈 Tests de performance avec données propres
- 🐛 Debugging avec un environnement vierge
- 📋 Démonstrations avec un état initial propre
- 🔄 Reset rapide entre différentes phases de test
