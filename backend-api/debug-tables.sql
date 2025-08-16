-- ===================================================================
-- SCRIPT DE DEBUG ET ANALYSE DES TABLES - FailDaily Database
-- ===================================================================
-- Description: Diagnostic complet de la structure et des données
-- Usage: Exécuter pour analyser l'état de la base de données
-- Dernière mise à jour: 16 août 2025

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. INFORMATIONS GÉNÉRALES DE LA BASE DE DONNÉES
-- ===================================================================

SELECT 
    'INFORMATIONS GÉNÉRALES' as SECTION,
    '======================' as SEPARATOR;

-- Informations sur la base de données
SELECT 
    SCHEMA_NAME as 'Base de données',
    DEFAULT_CHARACTER_SET_NAME as 'Charset par défaut',
    DEFAULT_COLLATION_NAME as 'Collation par défaut'
FROM INFORMATION_SCHEMA.SCHEMATA 
WHERE SCHEMA_NAME = 'faildaily';

-- Version MySQL
SELECT 
    'Version MySQL' as Information,
    VERSION() as Valeur;

-- Heure du serveur
SELECT 
    'Heure serveur' as Information,
    NOW() as Valeur;

-- ===================================================================
-- 2. ANALYSE DES TABLES
-- ===================================================================

SELECT 
    'ANALYSE DES TABLES' as SECTION,
    '==================' as SEPARATOR;

-- Liste des tables avec leurs statistiques
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Nb lignes estimé',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'Taille (MB)',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) as 'Données (MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) as 'Index (MB)',
    AUTO_INCREMENT as 'Prochain ID',
    TABLE_COLLATION as 'Collation',
    ENGINE as 'Moteur'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'faildaily'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- ===================================================================
-- 3. ANALYSE DÉTAILLÉE DE LA TABLE USERS
-- ===================================================================

SELECT 
    'ANALYSE TABLE USERS' as SECTION,
    '===================' as SEPARATOR;

-- Statistiques générales users
SELECT 
    'Total utilisateurs' as Métrique,
    COUNT(*) as Valeur
FROM users;

SELECT 
    'Utilisateurs actifs (derniers 30 jours)' as Métrique,
    COUNT(*) as Valeur
FROM users 
WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Répartition par date de création
SELECT 
    DATE_FORMAT(created_at, '%Y-%m') as 'Mois',
    COUNT(*) as 'Nouveaux utilisateurs'
FROM users
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY created_at DESC
LIMIT 12;

-- Users avec données manquantes ou suspectes
SELECT 'Users sans email' as Problème, COUNT(*) as Nombre FROM users WHERE email IS NULL OR email = '';
SELECT 'Users sans username' as Problème, COUNT(*) as Nombre FROM users WHERE username IS NULL OR username = '';
SELECT 'Users sans password' as Problème, COUNT(*) as Nombre FROM users WHERE password_hash IS NULL OR password_hash = '';

-- Distribution longueur des passwords
SELECT 
    'Longueur password_hash' as Analyse,
    MIN(CHAR_LENGTH(password_hash)) as 'Min',
    AVG(CHAR_LENGTH(password_hash)) as 'Moyenne',
    MAX(CHAR_LENGTH(password_hash)) as 'Max'
FROM users 
WHERE password_hash IS NOT NULL;

-- ===================================================================
-- 4. ANALYSE DÉTAILLÉE DE LA TABLE PROFILES
-- ===================================================================

SELECT 
    'ANALYSE TABLE PROFILES' as SECTION,
    '=======================' as SEPARATOR;

-- Statistiques profiles
SELECT 
    'Total profils' as Métrique,
    COUNT(*) as Valeur
FROM profiles;

-- Profils avec avatar
SELECT 
    'Profils avec avatar' as Métrique,
    COUNT(*) as Valeur,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as Pourcentage
FROM profiles 
WHERE avatar_url IS NOT NULL AND avatar_url != '';

-- Profils vérifiés
SELECT 
    'Profils email vérifiés' as Métrique,
    COUNT(*) as Valeur,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as Pourcentage
FROM profiles 
WHERE email_verified = TRUE;

-- Répartition par âge
SELECT 
    CASE 
        WHEN date_of_birth IS NULL THEN 'Non spécifié'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 < 18 THEN 'Moins de 18'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 18 AND 25 THEN '18-25'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 26 AND 35 THEN '26-35'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 36 AND 50 THEN '36-50'
        ELSE 'Plus de 50'
    END as 'Tranche âge',
    COUNT(*) as Nombre
FROM profiles
GROUP BY 
    CASE 
        WHEN date_of_birth IS NULL THEN 'Non spécifié'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 < 18 THEN 'Moins de 18'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 18 AND 25 THEN '18-25'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 26 AND 35 THEN '26-35'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 36 AND 50 THEN '36-50'
        ELSE 'Plus de 50'
    END;

-- ===================================================================
-- 5. ANALYSE DE LA TABLE BADGES
-- ===================================================================

SELECT 
    'ANALYSE TABLE BADGES' as SECTION,
    '====================' as SEPARATOR;

-- Statistiques badges
SELECT 
    'Total badges définis' as Métrique,
    COUNT(*) as Valeur
FROM badges;

-- Badges par catégorie
SELECT 
    category as 'Catégorie',
    COUNT(*) as 'Nombre de badges'
FROM badges
GROUP BY category
ORDER BY COUNT(*) DESC;

-- Badges par difficulté
SELECT 
    difficulty as 'Difficulté',
    COUNT(*) as 'Nombre de badges'
FROM badges
GROUP BY difficulty
ORDER BY 
    CASE difficulty
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        WHEN 'expert' THEN 4
        ELSE 5
    END;

-- ===================================================================
-- 6. ANALYSE DE LA TABLE USER_BADGES
-- ===================================================================

SELECT 
    'ANALYSE TABLE USER_BADGES' as SECTION,
    '==========================' as SEPARATOR;

-- Total badges attribués
SELECT 
    'Total badges attribués' as Métrique,
    COUNT(*) as Valeur
FROM user_badges;

-- Badges les plus obtenus
SELECT 
    b.name as 'Badge',
    b.category as 'Catégorie',
    COUNT(ub.id) as 'Fois obtenu'
FROM badges b
LEFT JOIN user_badges ub ON b.id = ub.badge_id
GROUP BY b.id, b.name, b.category
ORDER BY COUNT(ub.id) DESC
LIMIT 10;

-- Utilisateurs avec le plus de badges
SELECT 
    u.username as 'Utilisateur',
    COUNT(ub.id) as 'Nombre de badges'
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
GROUP BY u.id, u.username
HAVING COUNT(ub.id) > 0
ORDER BY COUNT(ub.id) DESC
LIMIT 10;

-- ===================================================================
-- 7. ANALYSE DE LA TABLE TASKS
-- ===================================================================

SELECT 
    'ANALYSE TABLE TASKS' as SECTION,
    '===================' as SEPARATOR;

-- Statistiques tasks
SELECT 
    'Total tâches' as Métrique,
    COUNT(*) as Valeur
FROM tasks;

-- Tasks par statut
SELECT 
    status as 'Statut',
    COUNT(*) as Nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tasks), 2) as Pourcentage
FROM tasks
GROUP BY status
ORDER BY COUNT(*) DESC;

-- Tasks par priorité
SELECT 
    priority as 'Priorité',
    COUNT(*) as Nombre
FROM tasks
GROUP BY priority
ORDER BY 
    CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
    END;

-- ===================================================================
-- 8. ANALYSE DES INDEX
-- ===================================================================

SELECT 
    'ANALYSE DES INDEX' as SECTION,
    '=================' as SEPARATOR;

-- Index par table
SELECT 
    TABLE_NAME as 'Table',
    INDEX_NAME as 'Index',
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as 'Colonnes',
    NON_UNIQUE as 'Non unique',
    CARDINALITY as 'Cardinalité'
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'faildaily'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- ===================================================================
-- 9. ANALYSE DES CONTRAINTES
-- ===================================================================

SELECT 
    'ANALYSE DES CONTRAINTES' as SECTION,
    '=======================' as SEPARATOR;

-- Contraintes de clés étrangères
SELECT 
    TABLE_NAME as 'Table',
    COLUMN_NAME as 'Colonne',
    REFERENCED_TABLE_NAME as 'Table référencée',
    REFERENCED_COLUMN_NAME as 'Colonne référencée',
    UPDATE_RULE as 'Règle UPDATE',
    DELETE_RULE as 'Règle DELETE'
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'faildaily' 
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- ===================================================================
-- 10. VÉRIFICATION DE L'INTÉGRITÉ RÉFÉRENTIELLE
-- ===================================================================

SELECT 
    'INTÉGRITÉ RÉFÉRENTIELLE' as SECTION,
    '=======================' as SEPARATOR;

-- Profils orphelins
SELECT 
    'Profils orphelins (sans user)' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- User badges orphelins
SELECT 
    'User badges orphelins' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM user_badges ub
LEFT JOIN users u ON ub.user_id = u.id
WHERE u.id IS NULL;

-- Tasks orphelines
SELECT 
    'Tasks orphelines' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

-- ===================================================================
-- 11. PERFORMANCE ET OPTIMISATION
-- ===================================================================

SELECT 
    'PERFORMANCE ET OPTIMISATION' as SECTION,
    '============================' as SEPARATOR;

-- Tables qui pourraient bénéficier d'un OPTIMIZE
SELECT 
    TABLE_NAME as 'Table',
    ROUND(DATA_FREE / 1024 / 1024, 2) as 'Espace libre (MB)',
    CASE 
        WHEN DATA_FREE > 10 * 1024 * 1024 THEN '⚠️ À optimiser'
        ELSE '✅ OK'
    END as Recommandation
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'faildaily'
  AND DATA_FREE > 0
ORDER BY DATA_FREE DESC;

-- ===================================================================
-- 12. SUGGESTIONS D'AMÉLIORATION
-- ===================================================================

SELECT 
    'SUGGESTIONS D\'AMÉLIORATION' as SECTION,
    '===========================' as SEPARATOR;

-- Tables sans index sur les colonnes de date
SELECT 
    'Ajouter index sur created_at/updated_at' as Suggestion,
    'Tables: users, profiles, tasks' as Détail,
    'Impact: Amélioration requêtes temporelles' as Bénéfice;

-- Suggestions basées sur la taille des données
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM users) > 1000 THEN 'Considérer partitioning pour users'
        WHEN (SELECT COUNT(*) FROM tasks) > 10000 THEN 'Archive des anciennes tasks'
        ELSE 'Pas d\'optimisation majeure nécessaire'
    END as 'Suggestion performance';

-- ===================================================================
-- 13. RAPPORT DE SANTÉ GLOBAL
-- ===================================================================

SELECT 
    'RAPPORT DE SANTÉ GLOBAL' as SECTION,
    '=======================' as SEPARATOR;

-- Score de santé basé sur différents critères
SELECT 
    'Score intégrité référentielle' as Critère,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL) = 0
        THEN '100%' 
        ELSE 'À améliorer' 
    END as Score;

SELECT 
    'Score complétude données' as Critère,
    CONCAT(
        ROUND(
            (SELECT COUNT(*) FROM users WHERE email IS NOT NULL AND username IS NOT NULL AND password_hash IS NOT NULL) * 100.0 / 
            (SELECT COUNT(*) FROM users), 
            1
        ), 
        '%'
    ) as Score;

-- ===================================================================
-- 14. RÉSUMÉ FINAL
-- ===================================================================

SELECT 
    'RÉSUMÉ DEBUG TABLES' as SECTION,
    '===================' as SEPARATOR;

SELECT 
    'Analyse terminée' as Status,
    NOW() as 'Heure d\'analyse',
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'faildaily') as 'Tables analysées',
    'Base de données FailDaily' as Contexte;

-- ===================================================================
-- FIN DU SCRIPT DE DEBUG
-- ===================================================================