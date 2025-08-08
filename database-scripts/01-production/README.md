# 🚀 Scripts de Production FailDaily

## 📋 Scripts à Exécuter dans l'Ordre

### 1. **database-recovery-MINIMAL.sql** ⭐ PREMIER
- ✅ Crée les 6 tables essentielles (profiles, fails, reactions, comments, badges, badge_definitions)
- ✅ Résout l'erreur "relation 'public.fails' does not exist"
- ✅ Configure RLS et politiques de sécurité
- ✅ Ajoute 3 badges de base
- 🎯 **OBLIGATOIRE - À exécuter en premier**

### 2. **database-complete-data-restore-SIMPLE.sql** ⭐ DEUXIÈME
- ✅ Ajoute 58 badges complets dans 6 catégories
- ✅ Système de badges automatique avec triggers
- ✅ Storage buckets (avatars, fails)
- ✅ Fonctions essentielles
- 🎯 **RECOMMANDÉ - Système de badges fonctionnel**

### 3. **database-badges-complete-90plus.sql** ⭐ TROISIÈME
- ✅ Ajoute 79 badges supplémentaires (total 137)
- ✅ Toutes les catégories complètes
- ✅ Badges avancés et spéciaux
- 🎯 **OPTIONNEL - Pour un système complet**

### 4. **database-upgrade-profiles-table.sql** ⭐ DERNIER
- ✅ Met à jour la table profiles avec toutes les colonnes
- ✅ Conformité légale (âge, consentement RGPD)
- ✅ Fonctions RPC pour l'application
- ✅ Vue complète avec calculs automatiques
- 🎯 **RECOMMANDÉ - Conformité légale**

## ⚡ Exécution Rapide

```bash
# Dans Supabase SQL Editor, exécuter dans l'ordre :

# 1. Tables de base (OBLIGATOIRE)
-- Copier/coller database-recovery-MINIMAL.sql

# 2. Badges de base (RECOMMANDÉ)
-- Copier/coller database-complete-data-restore-SIMPLE.sql

# 3. Badges complets (OPTIONNEL)
-- Copier/coller database-badges-complete-90plus.sql

# 4. Profiles complet (RECOMMANDÉ)
-- Copier/coller database-upgrade-profiles-table.sql
```

## 🎯 Résultat Final

Après exécution de tous les scripts :
- ✅ **6 tables** principales créées
- ✅ **137 badges** disponibles
- ✅ **Système automatique** de déblocage
- ✅ **Conformité légale** RGPD
- ✅ **Storage** configuré
- ✅ **Fonctions RPC** pour l'app

## 🔍 Vérification

Après chaque script, vérifiez avec :
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier les badges
SELECT COUNT(*) as total_badges FROM badge_definitions;

-- Vérifier la structure profiles
\d profiles;
```

## ⚠️ Important

- **Exécuter dans l'ordre** : Chaque script dépend du précédent
- **Vérifier les résultats** : Chaque script affiche des vérifications
- **Sauvegarder** : Faire une sauvegarde avant exécution
- **Tester** : Vérifier que l'application fonctionne après

**Ces scripts sont testés et garantis fonctionnels !**