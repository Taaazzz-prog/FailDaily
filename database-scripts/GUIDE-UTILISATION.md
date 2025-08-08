# 📚 Guide d'Utilisation - Scripts FailDaily

## 🎯 Démarrage Rapide

### Pour une nouvelle installation :
1. **`01-production/database-recovery-MINIMAL.sql`** ⭐ OBLIGATOIRE
2. **`01-production/database-complete-data-restore-SIMPLE.sql`** ⭐ RECOMMANDÉ
3. **`01-production/database-badges-complete-90plus.sql`** (optionnel)
4. **`01-production/database-upgrade-profiles-table.sql`** ⭐ RECOMMANDÉ

### Pour une récupération d'urgence :
1. **`02-recovery/diagnostic-table-fails-missing.sql`** (diagnostic)
2. **`02-recovery/database-recovery-COMPLETE-FINAL-FIXED.sql`** (récupération complète)

## 📂 Structure des Dossiers

```
database-scripts/
├── 01-production/     ⭐ SCRIPTS À UTILISER
├── 02-recovery/       🚨 Récupération d'urgence
├── 03-migration/      📈 Migrations progressives
├── 04-debug/          🐛 Débogage et tests
└── 05-archive/        📚 Anciens scripts (référence)
```

## 🚀 Scénarios d'Utilisation

### 🆕 **Nouvelle Installation**
```sql
-- 1. Créer les tables de base
-- Exécuter: 01-production/database-recovery-MINIMAL.sql

-- 2. Ajouter le système de badges
-- Exécuter: 01-production/database-complete-data-restore-SIMPLE.sql

-- 3. (Optionnel) Badges complets
-- Exécuter: 01-production/database-badges-complete-90plus.sql

-- 4. Mise à jour profiles pour conformité légale
-- Exécuter: 01-production/database-upgrade-profiles-table.sql
```

### 🚨 **Récupération d'Urgence**
```sql
-- 1. Diagnostiquer le problème
-- Exécuter: 02-recovery/diagnostic-table-fails-missing.sql

-- 2. Récupération complète
-- Exécuter: 02-recovery/database-recovery-COMPLETE-FINAL-FIXED.sql
```

### 📈 **Migration Progressive**
```sql
-- Pour migrer d'une ancienne version
-- Exécuter dans l'ordre:
-- 03-migration/database-migration-legal.sql
-- 03-migration/database-migration-add-legal-columns.sql
-- 03-migration/database-migration-functions-only.sql
```

### 🐛 **Débogage**
```sql
-- Pour diagnostiquer des problèmes:
-- 04-debug/debug-registration-diagnostic.sql
-- 04-debug/debug-test-tables.sql

-- Pour désactiver temporairement des fonctionnalités:
-- 04-debug/debug-disable-rls.sql
-- 04-debug/dev-disable-email-validation.sql
```

## ✅ Vérifications Après Exécution

### Après database-recovery-MINIMAL.sql :
```sql
-- Vérifier les tables créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Résultat attendu: 6 tables
-- badges, badge_definitions, comments, fails, profiles, reactions
```

### Après database-complete-data-restore-SIMPLE.sql :
```sql
-- Vérifier les badges
SELECT COUNT(*) as total_badges FROM badge_definitions;
-- Résultat attendu: 58 badges

-- Vérifier les triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_schema = 'public';
```

### Après database-badges-complete-90plus.sql :
```sql
-- Vérifier le total des badges
SELECT COUNT(*) as total_badges, 
       COUNT(DISTINCT category) as categories 
FROM badge_definitions;
-- Résultat attendu: 137 badges, 6 catégories
```

### Après database-upgrade-profiles-table.sql :
```sql
-- Vérifier la structure profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
-- Résultat attendu: 14 colonnes
```

## 🔧 Résolution de Problèmes

### Erreur "relation does not exist"
1. Exécuter `02-recovery/diagnostic-table-fails-missing.sql`
2. Si tables manquantes → `01-production/database-recovery-MINIMAL.sql`

### Erreur de contrainte ou validation
1. Vérifier avec `04-debug/debug-test-tables.sql`
2. Si nécessaire → `04-debug/debug-disable-rls.sql` (temporaire)

### Problème d'inscription utilisateur
1. Diagnostiquer avec `04-debug/debug-registration-diagnostic.sql`
2. Si nécessaire → `04-debug/dev-disable-email-validation.sql`

### Badges ne se débloquent pas
1. Vérifier les triggers avec les scripts de debug
2. Re-exécuter `01-production/database-complete-data-restore-SIMPLE.sql`

## 📋 Checklist de Déploiement

### ✅ Installation Complète
- [ ] Tables de base créées (database-recovery-MINIMAL.sql)
- [ ] Système de badges fonctionnel (database-complete-data-restore-SIMPLE.sql)
- [ ] Badges complets ajoutés (database-badges-complete-90plus.sql)
- [ ] Table profiles mise à jour (database-upgrade-profiles-table.sql)
- [ ] Tests de vérification passés
- [ ] Application testée et fonctionnelle

### ✅ Vérifications Finales
- [ ] 6 tables créées
- [ ] 137 badges disponibles
- [ ] Triggers actifs
- [ ] RLS configuré
- [ ] Storage buckets créés
- [ ] Fonctions RPC disponibles

## 🎉 Résultat Final

Après exécution complète, votre base FailDaily aura :
- ✅ **6 tables** principales complètes
- ✅ **137 badges** dans 6 catégories
- ✅ **Système automatique** de déblocage
- ✅ **Conformité RGPD** avec vérification d'âge
- ✅ **Storage** configuré pour images
- ✅ **Fonctions RPC** pour l'application
- ✅ **Sécurité RLS** complète

**Votre application FailDaily sera 100% fonctionnelle !**