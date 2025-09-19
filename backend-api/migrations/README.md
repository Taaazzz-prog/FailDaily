# 🗄️ Migrations Database - FailDaily

## 📄 Structure actuelle (nettoyée)

### ✅ **Fichier principal unique**
- **`faildaily.sql`** - Base de données complète et à jour
  - Contient toute la structure (22 tables)
  - Inclut toutes les données de référence
  - Triggers et procédures stockées
  - Index de performance

## 🚫 **Fichiers supprimés (obsolètes)**
- ~~`2025-09-11_add_rejected_to_fail_moderation.sql`~~ ✅ Inclus dans faildaily.sql
- ~~`2025-09-12_logging_geo.sql`~~ ✅ Inclus dans faildaily.sql  
- ~~`2025-09-12_ops_patch.sql`~~ ✅ Inclus dans faildaily.sql
- ~~`add-fails-count-column.sql`~~ ✅ Inclus dans faildaily.sql
- ~~`add-fails-count.js`~~ ✅ Inclus dans faildaily.sql
- ~~`faildaily_production_ready.sql`~~ ✅ Doublons supprimés

## 🎯 **Avantages du nettoyage**
- ✅ **Source unique de vérité** : `faildaily.sql`
- ✅ **Pas de confusion** entre versions
- ✅ **Déploiement simplifié**
- ✅ **Maintenance facilitée**

## 🚀 **Utilisation**
```bash
# Import complet de la base
mysql -u root -p faildaily < faildaily.sql

# Ou via Docker
docker-compose exec db mysql -u root -p faildaily < faildaily.sql
```

---
*Dernière mise à jour : 19 septembre 2025*