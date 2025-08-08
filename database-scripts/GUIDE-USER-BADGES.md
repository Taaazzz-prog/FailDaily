# 🆔 GUIDE MIGRATION TABLE USER_BADGES

## 🎯 **Contexte**

Votre fichier JSON de référence [`structure en json.json`](structure%20en%20json.json:27) montre une table `user_badges` qui n'était pas présente dans vos scripts de production originaux.

Cette table est **ESSENTIELLE** pour le bon fonctionnement du système de badges.

## 📊 **Structure Attendue vs Actuelle**

### 🔍 **Selon votre JSON :**
```json
{
  "table_name": "user_badges",
  "columns": "id (uuid), user_id (uuid), badge_id (character varying), unlocked_at (timestamp with time zone), created_at (timestamp with time zone)"
}
```

### ✅ **Script Disponible :**
[`03-migration/create_user_badges_table.sql`](03-migration/create_user_badges_table.sql:1)

## 🚨 **Problème Identifié**

### ❌ **Sans table user_badges :**
- Les badges débloqués ne peuvent pas être stockés
- L'application ne peut pas suivre les progrès des utilisateurs
- Le système de badges ne fonctionne pas correctement

### ✅ **Avec table user_badges :**
- Stockage des badges débloqués par utilisateur
- Suivi des dates de débloquage
- Système de badges pleinement fonctionnel

## 🔧 **Solution : Migration**

### 📋 **Étape 1 : Vérification**
```sql
-- Vérifier si la table existe déjà
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_badges'
);
```

### 📋 **Étape 2 : Migration (Si nécessaire)**
```sql
-- Exécuter le script de migration
-- Copier/coller : 03-migration/create_user_badges_table.sql
```

### 📋 **Étape 3 : Vérification Post-Migration**
```sql
-- Vérifier la structure créée
\d public.user_badges;

-- Vérifier les politiques RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_badges';
```

## 🎖️ **Relation avec le Système de Badges**

### 🔗 **Tables Liées :**
1. **`badge_definitions`** - Définit tous les badges disponibles
2. **`user_badges`** - **NOUVELLE** - Stocke les badges débloqués
3. **`badges`** - Table existante (peut-être redondante ?)

### ⚠️ **Attention : Possible Redondance**

Votre structure actuelle a peut-être **2 tables similaires** :
- `badges` (existante)
- `user_badges` (nouvelle, selon JSON)

**Recommandation :** Vérifiez si ces tables ont des rôles différents ou si l'une remplace l'autre.

## 🚀 **Script de Migration Complet**

Le script [`create_user_badges_table.sql`](03-migration/create_user_badges_table.sql:1) inclut :

### ✅ **Fonctionnalités :**
- ✅ Création de la table avec UUID
- ✅ Contrainte unique (user_id, badge_id)
- ✅ Références vers auth.users
- ✅ Index pour optimisation
- ✅ RLS (Row Level Security)
- ✅ Politiques de sécurité
- ✅ Documentation complète

### 🔒 **Sécurité RLS :**
```sql
-- Les utilisateurs ne voient que leurs badges
"Users can only see their own badges"

-- Insertion autorisée pour l'utilisateur connecté
"Allow badge insertion"
```

## 📋 **Ordre d'Exécution Recommandé**

1. **Vérification structure** → [`verification-structure.sql`](verification-structure.sql:1)
2. **Si user_badges manquante** → [`03-migration/create_user_badges_table.sql`](03-migration/create_user_badges_table.sql:1)
3. **Badges complets** → [`01-production/MEGA_badges_definitions.sql`](01-production/MEGA_badges_definitions.sql:1)
4. **Re-vérification** → [`verification-structure.sql`](verification-structure.sql:1)

## 🎯 **Résultat Attendu**

Après migration, votre base aura :
- ✅ 7 tables conformes au JSON
- ✅ Système de badges fonctionnel
- ✅ Stockage des badges utilisateurs
- ✅ Sécurité RLS activée

## 🔍 **Test de Fonctionnement**

```sql
-- Test d'insertion d'un badge utilisateur
INSERT INTO public.user_badges (user_id, badge_id) 
VALUES (auth.uid(), 'first-fail');

-- Vérifier l'insertion
SELECT * FROM public.user_badges WHERE user_id = auth.uid();
```

---

**🎖️ Cette migration est CRITIQUE pour le bon fonctionnement de votre système de badges !**