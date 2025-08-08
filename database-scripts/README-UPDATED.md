# 📁 DATABASE SCRIPTS - FAILDAILY

## 🎯 **Organisation Professionnelle**

Cette structure organise tous vos scripts SQL de manière logique et professionnelle.

**🔄 FUSION COMPLÈTE** : Tous les scripts des dossiers `sql/` et `database-scripts/` ont été consolidés.

## 📂 **Structure des Dossiers**

### 🏭 **01-production/** - Scripts de Production
**À utiliser en PREMIER** - Scripts stables et testés pour la mise en production.

- `database-recovery-MINIMAL.sql` - **PRIORITÉ 1** : Résout "relation 'public.fails' does not exist"
- `database-complete-data-restore-SIMPLE.sql` - **PRIORITÉ 2** : Restaure 58 badges + triggers
- `database-badges-complete-90plus.sql` - **PRIORITÉ 3** : Ajoute 79 badges supplémentaires (137 total)
- `database-upgrade-profiles-table.sql` - **PRIORITÉ 4** : Upgrade légal + 14 colonnes profiles
- `MEGA_badges_definitions.sql` - **NOUVEAU** : Système complet 137+ badges (alternative)

### 🔄 **02-recovery/** - Scripts de Récupération
Scripts pour récupérer d'une situation critique.

- `database-recovery-COMPLETE-FINAL-FIXED.sql` - Récupération complète
- `database-recovery-SAFE-FIXED.sql` - Récupération sécurisée
- `diagnostic-table-fails-missing.sql` - Diagnostic table fails manquante

### 🔧 **03-migration/** - Scripts de Migration
Scripts pour faire évoluer votre base de données.

- `database-migration-add-legal-columns.sql` - Ajout colonnes légales
- `database-migration-functions-only.sql` - Migration fonctions uniquement
- `database-migration-legal.sql` - Migration complète légale
- `create_user_badges_table.sql` - **NOUVEAU** : Table user_badges avec RLS

### 🐛 **04-debug/** - Scripts de Debug
Scripts pour diagnostiquer et résoudre les problèmes.

- `debug-disable-rls.sql` - Désactiver RLS temporairement
- `debug-registration-complete.sql` - Debug inscription complète
- `debug-registration-diagnostic.sql` - Diagnostic inscription
- `debug-test-tables.sql` - Test des tables
- `dev-disable-email-validation.sql` - Désactiver validation email (dev)
- `basic-supabase-check.sql` - **NOUVEAU** : Vérifications de base Supabase
- `check-supabase-config.sql` - **NOUVEAU** : Configuration Supabase
- `debug-complete.sql` - **NOUVEAU** : Debug complet avec triggers
- `diagnostic_badges.sql` - **NOUVEAU** : Diagnostic système badges
- `disable-trigger.sql` - **NOUVEAU** : Désactivation triggers
- `test_additional_badges.sql` - **NOUVEAU** : Tests badges additionnels
- `test-direct-user.sql` - **NOUVEAU** : Tests utilisateurs directs

### 📦 **05-archive/** - Scripts Archivés
Anciens scripts conservés pour référence historique.

## 📋 **Fichiers de Référence**

- `structure en json.json` - **RÉFÉRENCE** : Structure exacte attendue (7 tables)
- `verification-structure.sql` - Script de vérification de conformité
- `FUSION-COMPLETE.md` - Documentation de la fusion des scripts

## 🚀 **Guide d'Utilisation Rapide**

### ⚡ **Résolution Rapide "relation 'public.fails' does not exist"**
```sql
-- 1. Exécuter dans Supabase SQL Editor
-- Copier/coller : 01-production/database-recovery-MINIMAL.sql
```

### 🎖️ **Restauration Complète du Système de Badges**
```sql
-- 2. Après le script minimal, exécuter :
-- Copier/coller : 01-production/database-complete-data-restore-SIMPLE.sql
-- Puis : 01-production/database-badges-complete-90plus.sql
```

### 🆔 **Table user_badges (Si Manquante)**
```sql
-- 3. Si votre structure JSON montre user_badges manquante :
-- Copier/coller : 03-migration/create_user_badges_table.sql
```

### ⚖️ **Mise à Niveau Légale (RGPD)**
```sql
-- 4. Pour la conformité légale :
-- Copier/coller : 01-production/database-upgrade-profiles-table.sql
```

### 🔍 **Vérification de Structure**
```sql
-- 5. Vérifier que tout correspond à votre JSON :
-- Copier/coller : verification-structure.sql
```

## 📋 **Ordre d'Exécution Recommandé**

1. **VÉRIFICATION** → `verification-structure.sql`
2. **MINIMAL** → Résout l'erreur critique (si nécessaire)
3. **USER_BADGES** → Ajoute table manquante (si nécessaire)
4. **SIMPLE** → Restaure le système de base (58 badges)
5. **90PLUS** → Système complet (137 badges)
6. **UPGRADE** → Conformité légale
7. **RE-VÉRIFICATION** → `verification-structure.sql`

## ⚠️ **Important**

- **Toujours tester** sur un environnement de développement d'abord
- **Sauvegarder** votre base avant exécution
- **Exécuter les scripts** dans l'ordre recommandé
- **Vérifier** après chaque script que tout fonctionne

## 📊 **Statistiques**

- **5 scripts de production** prêts à l'emploi
- **137+ badges** dans le système complet
- **6 catégories** de badges (COURAGE, PERSEVERANCE, HUMOUR, ENTRAIDE, RESILIENCE, SPECIAL)
- **14 colonnes** dans la table profiles mise à niveau
- **7 tables** dans la structure complète (avec user_badges)
- **RLS activé** sur toutes les tables sensibles
- **14 fichiers** supplémentaires intégrés depuis le dossier sql/

---

**🎯 Objectif : Résoudre rapidement vos problèmes de base de données avec des scripts organisés et documentés.**