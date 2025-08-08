# 📁 Scripts de Base de Données FailDaily

## 🎯 Organisation des Scripts

Cette structure organise tous les scripts SQL de FailDaily de manière logique et facilite leur utilisation.

## 📂 Structure des Dossiers

```
database-scripts/
├── 01-production/          # Scripts de production (à utiliser)
├── 02-recovery/            # Scripts de récupération d'urgence
├── 03-migration/           # Scripts de migration et mise à jour
├── 04-debug/               # Scripts de débogage et diagnostic
├── 05-archive/             # Anciens scripts (historique)
└── README.md               # Ce fichier
```

## 🚀 Scripts de Production (À utiliser en priorité)

### 📋 **Ordre d'exécution recommandé :**

1. **`01-production/database-recovery-MINIMAL.sql`**
   - ✅ Crée les tables essentielles (profiles, fails, reactions, etc.)
   - ✅ Résout l'erreur "relation 'public.fails' does not exist"
   - 🎯 **EXÉCUTER EN PREMIER**

2. **`01-production/database-complete-data-restore-SIMPLE.sql`**
   - ✅ Ajoute 58 badges de base
   - ✅ Système de badges automatique
   - ✅ Storage buckets
   - 🎯 **EXÉCUTER EN DEUXIÈME**

3. **`01-production/database-badges-complete-90plus.sql`**
   - ✅ Ajoute 79 badges supplémentaires (total 137)
   - ✅ Toutes les catégories complètes
   - 🎯 **EXÉCUTER EN TROISIÈME**

4. **`01-production/database-upgrade-profiles-table.sql`**
   - ✅ Met à jour la table profiles avec toutes les colonnes
   - ✅ Conformité légale (âge, consentement)
   - ✅ Fonctions RPC
   - 🎯 **EXÉCUTER EN DERNIER**

## 🔧 Scripts de Récupération

- **`02-recovery/`** : Scripts pour récupérer d'une panne ou corruption
- Utiliser uniquement en cas de problème majeur

## 📈 Scripts de Migration

- **`03-migration/`** : Scripts pour migrer d'anciennes versions
- Historique des migrations

## 🐛 Scripts de Debug

- **`04-debug/`** : Scripts pour diagnostiquer des problèmes
- Outils de débogage et vérification

## 📚 Archive

- **`05-archive/`** : Anciens scripts conservés pour référence
- Ne pas utiliser en production

## ⚡ Démarrage Rapide

```bash
# 1. Créer les tables de base
psql -f 01-production/database-recovery-MINIMAL.sql

# 2. Ajouter les badges de base
psql -f 01-production/database-complete-data-restore-SIMPLE.sql

# 3. Ajouter tous les badges (90+)
psql -f 01-production/database-badges-complete-90plus.sql

# 4. Mettre à jour la table profiles
psql -f 01-production/database-upgrade-profiles-table.sql
```

## 🎉 Résultat Final

Après exécution de tous les scripts de production :
- ✅ 6 tables principales créées
- ✅ 137 badges disponibles
- ✅ Système de badges automatique
- ✅ Table profiles complète avec conformité légale
- ✅ Fonctions RPC pour l'application
- ✅ Storage buckets configurés

**Votre base de données FailDaily sera 100% fonctionnelle !**