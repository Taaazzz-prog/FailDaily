-- ===================================================================
-- SCRIPT DE DEBUG USERS-PROFILES - FailDaily Database
-- ===================================================================
-- Description: Diagnostic spécifique de la relation users-profiles
-- Usage: Exécuter pour analyser la cohérence users/profiles
-- Dernière mise à jour: 16 août 2025

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. ANALYSE DE LA RELATION USERS-PROFILES
-- ===================================================================

SELECT 
    'ANALYSE RELATION USERS-PROFILES' as SECTION,
    '================================' as SEPARATOR;

-- Statistiques générales de la relation
SELECT 
    'Total utilisateurs' as Métrique,
    COUNT(*) as Valeur
FROM users;

SELECT 
    'Total profils' as Métrique,
    COUNT(*) as Valeur
FROM profiles;

SELECT 
    'Ratio profils/utilisateurs' as Métrique,
    CONCAT(
        ROUND(
            (SELECT COUNT(*) FROM profiles) * 100.0 / (SELECT COUNT(*) FROM users), 
            2
        ), 
        '%'
    ) as Valeur;

-- ===================================================================
-- 2. DÉTECTION DES INCOHÉRENCES
-- ===================================================================

SELECT 
    'DÉTECTION INCOHÉRENCES' as SECTION,
    '=======================' as SEPARATOR;

-- Utilisateurs sans profil
SELECT 
    'Utilisateurs sans profil' as Problème,
    COUNT(*) as Nombre
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- Profils orphelins (sans utilisateur)
SELECT 
    'Profils orphelins' as Problème,
    COUNT(*) as Nombre
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Profils multiples pour un même utilisateur
SELECT 
    'Utilisateurs avec profils multiples' as Problème,
    COUNT(*) as Nombre
FROM (
    SELECT user_id
    FROM profiles
    GROUP BY user_id
    HAVING COUNT(*) > 1
) as multiples;

-- ===================================================================
-- 3. ANALYSE DES DONNÉES DÉSYNCHRONISÉES
-- ===================================================================

SELECT 
    'ANALYSE DÉSYNCHRONISATION' as SECTION,
    '=========================' as SEPARATOR;

-- Emails différents entre users et profiles
SELECT 
    'Emails désynchronisés' as Problème,
    COUNT(*) as Nombre
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email != p.email
   OR (u.email IS NULL AND p.email IS NOT NULL)
   OR (u.email IS NOT NULL AND p.email IS NULL);

-- Timestamps incohérents
SELECT 
    'Profils créés avant users' as Problème,
    COUNT(*) as Nombre
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.created_at < u.created_at;

-- Updated_at désynchronisés
SELECT 
    'Updated_at désynchronisés' as Problème,
    COUNT(*) as Nombre
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE ABS(TIMESTAMPDIFF(SECOND, u.updated_at, p.updated_at)) > 60;

-- ===================================================================
-- 4. LISTE DÉTAILLÉE DES UTILISATEURS SANS PROFIL
-- ===================================================================

SELECT 
    'UTILISATEURS SANS PROFIL' as SECTION,
    '=========================' as SEPARATOR;

-- Lister les utilisateurs sans profil (première partie)
SELECT 
    u.id as 'User ID',
    u.username as 'Username',
    u.email as 'Email',
    u.created_at as 'Créé le'
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC
LIMIT 20;

-- Compter par période de création
SELECT 
    DATE_FORMAT(u.created_at, '%Y-%m') as 'Mois création',
    COUNT(*) as 'Users sans profil'
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
GROUP BY DATE_FORMAT(u.created_at, '%Y-%m')
ORDER BY u.created_at DESC;

-- ===================================================================
-- 5. ANALYSE DES PROFILS ORPHELINS
-- ===================================================================

SELECT 
    'PROFILS ORPHELINS DÉTAILLÉS' as SECTION,
    '============================' as SEPARATOR;

-- Lister les profils orphelins
SELECT 
    p.id as 'Profile ID',
    p.user_id as 'User ID (inexistant)',
    p.display_name as 'Display Name',
    p.email as 'Email',
    p.created_at as 'Créé le'
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL
ORDER BY p.created_at DESC
LIMIT 20;

-- ===================================================================
-- 6. ANALYSE DES UTILISATEURS AVEC PROFILS MULTIPLES
-- ===================================================================

SELECT 
    'PROFILS MULTIPLES DÉTAILLÉS' as SECTION,
    '============================' as SEPARATOR;

-- Utilisateurs avec plusieurs profils
SELECT 
    u.id as 'User ID',
    u.username as 'Username',
    u.email as 'User Email',
    COUNT(p.id) as 'Nombre profils',
    GROUP_CONCAT(p.id ORDER BY p.created_at) as 'Profile IDs',
    GROUP_CONCAT(p.display_name ORDER BY p.created_at SEPARATOR ' | ') as 'Display Names'
FROM users u
JOIN profiles p ON u.id = p.user_id
GROUP BY u.id, u.username, u.email
HAVING COUNT(p.id) > 1
ORDER BY COUNT(p.id) DESC;

-- ===================================================================
-- 7. COMPARAISON DÉTAILLÉE DES DONNÉES
-- ===================================================================

SELECT 
    'COMPARAISON DONNÉES DÉTAILLÉE' as SECTION,
    '==============================' as SEPARATOR;

-- Emails différents avec détails
SELECT 
    u.id as 'User ID',
    u.username as 'Username',
    u.email as 'Email User',
    p.email as 'Email Profile',
    'Email mismatch' as Problème
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email != p.email
   OR (u.email IS NULL AND p.email IS NOT NULL)
   OR (u.email IS NOT NULL AND p.email IS NULL)
LIMIT 20;

-- Display name vs username différents
SELECT 
    u.id as 'User ID',
    u.username as 'Username',
    p.display_name as 'Display Name',
    CASE 
        WHEN p.display_name IS NULL THEN 'Display name manquant'
        WHEN p.display_name = u.username THEN 'Identiques'
        ELSE 'Différents'
    END as 'Comparaison'
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.display_name IS NULL 
   OR p.display_name != u.username
LIMIT 20;

-- ===================================================================
-- 8. ANALYSE TEMPORELLE
-- ===================================================================

SELECT 
    'ANALYSE TEMPORELLE' as SECTION,
    '==================' as SEPARATOR;

-- Délai moyen entre création user et profile
SELECT 
    'Délai moyen création profile après user' as Métrique,
    CONCAT(
        ROUND(AVG(TIMESTAMPDIFF(SECOND, u.created_at, p.created_at)) / 60, 2),
        ' minutes'
    ) as Valeur
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.created_at >= u.created_at;

-- Distribution des délais de création
SELECT 
    CASE 
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 10 THEN 'Immédiat (≤10s)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 60 THEN 'Rapide (≤1min)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 300 THEN 'Normal (≤5min)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 3600 THEN 'Lent (≤1h)'
        ELSE 'Très lent (>1h)'
    END as 'Délai création',
    COUNT(*) as Nombre
FROM users u
JOIN profiles p ON u.id = p.user_id
WHERE p.created_at >= u.created_at
GROUP BY 
    CASE 
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 10 THEN 'Immédiat (≤10s)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 60 THEN 'Rapide (≤1min)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 300 THEN 'Normal (≤5min)'
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 3600 THEN 'Lent (≤1h)'
        ELSE 'Très lent (>1h)'
    END
ORDER BY 
    CASE 
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 10 THEN 1
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 60 THEN 2
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 300 THEN 3
        WHEN TIMESTAMPDIFF(SECOND, u.created_at, p.created_at) <= 3600 THEN 4
        ELSE 5
    END;

-- ===================================================================
-- 9. VÉRIFICATION DE LA COMPLÉTUDE DES DONNÉES
-- ===================================================================

SELECT 
    'COMPLÉTUDE DES DONNÉES' as SECTION,
    '=======================' as SEPARATOR;

-- Pourcentage de données complètes par colonne
SELECT 
    'Username renseigné' as Champ,
    CONCAT(
        ROUND(
            COUNT(CASE WHEN u.username IS NOT NULL AND u.username != '' THEN 1 END) * 100.0 / COUNT(*), 
            2
        ), 
        '%'
    ) as Complétude
FROM users u
JOIN profiles p ON u.id = p.user_id;

SELECT 
    'Display name renseigné' as Champ,
    CONCAT(
        ROUND(
            COUNT(CASE WHEN p.display_name IS NOT NULL AND p.display_name != '' THEN 1 END) * 100.0 / COUNT(*), 
            2
        ), 
        '%'
    ) as Complétude
FROM users u
JOIN profiles p ON u.id = p.user_id;

SELECT 
    'Date de naissance renseignée' as Champ,
    CONCAT(
        ROUND(
            COUNT(CASE WHEN p.date_of_birth IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
            2
        ), 
        '%'
    ) as Complétude
FROM users u
JOIN profiles p ON u.id = p.user_id;

SELECT 
    'Bio renseignée' as Champ,
    CONCAT(
        ROUND(
            COUNT(CASE WHEN p.bio IS NOT NULL AND p.bio != '' THEN 1 END) * 100.0 / COUNT(*), 
            2
        ), 
        '%'
    ) as Complétude
FROM users u
JOIN profiles p ON u.id = p.user_id;

-- ===================================================================
-- 10. SUGGESTIONS DE CORRECTION
-- ===================================================================

SELECT 
    'SUGGESTIONS DE CORRECTION' as SECTION,
    '==========================' as SEPARATOR;

-- Script pour créer les profils manquants
SELECT 
    'Profils à créer' as Action,
    CONCAT('INSERT INTO profiles (user_id, display_name, email, created_at, updated_at) SELECT id, username, email, created_at, updated_at FROM users WHERE id IN (', 
           GROUP_CONCAT(u.id), ')') as 'Script SQL'
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
LIMIT 1;

-- Script pour supprimer les profils orphelins
SELECT 
    'Profils orphelins à supprimer' as Action,
    CASE 
        WHEN COUNT(*) > 0 
        THEN CONCAT('DELETE FROM profiles WHERE id IN (', GROUP_CONCAT(p.id), ')')
        ELSE 'Aucun profil orphelin'
    END as 'Script SQL'
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- ===================================================================
-- 11. SCORE DE SANTÉ USERS-PROFILES
-- ===================================================================

SELECT 
    'SCORE DE SANTÉ' as SECTION,
    '===============' as SEPARATOR;

-- Calcul du score global
SELECT 
    'Score intégrité' as Critère,
    CASE 
        WHEN (SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.user_id IS NULL) = 0
         AND (SELECT COUNT(*) FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL) = 0
        THEN '✅ PARFAIT (100%)'
        WHEN (SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.user_id IS NULL) <= 5
         AND (SELECT COUNT(*) FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL) <= 5
        THEN '🟡 BON (90%+)'
        ELSE '🔴 À AMÉLIORER'
    END as Score;

SELECT 
    'Score synchronisation' as Critère,
    CASE 
        WHEN (SELECT COUNT(*) FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.email != p.email) = 0
        THEN '✅ PARFAIT (100%)'
        WHEN (SELECT COUNT(*) FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.email != p.email) <= 10
        THEN '🟡 BON (90%+)'
        ELSE '🔴 À AMÉLIORER'
    END as Score;

-- ===================================================================
-- 12. RÉSUMÉ EXÉCUTIF
-- ===================================================================

SELECT 
    'RÉSUMÉ EXÉCUTIF' as SECTION,
    '===============' as SEPARATOR;

-- Résumé final avec recommandations
SELECT 
    'Utilisateurs sans profil' as Statistique,
    (SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.user_id IS NULL) as Valeur,
    CASE 
        WHEN (SELECT COUNT(*) FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE p.user_id IS NULL) = 0
        THEN '✅ Aucun problème'
        ELSE '⚠️ Créer les profils manquants'
    END as Recommandation;

SELECT 
    'Profils orphelins' as Statistique,
    (SELECT COUNT(*) FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL) as Valeur,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles p LEFT JOIN users u ON p.user_id = u.id WHERE u.id IS NULL) = 0
        THEN '✅ Aucun problème'
        ELSE '⚠️ Supprimer les profils orphelins'
    END as Recommandation;

-- ===================================================================
-- 13. RAPPORT FINAL
-- ===================================================================

SELECT 
    'RAPPORT FINAL DEBUG USERS-PROFILES' as SECTION,
    '===================================' as SEPARATOR;

SELECT 
    'Analyse users-profiles terminée' as Status,
    NOW() as 'Heure d\'analyse',
    (SELECT COUNT(*) FROM users) as 'Total users',
    (SELECT COUNT(*) FROM profiles) as 'Total profiles',
    'Relation analysée en détail' as Contexte;

-- ===================================================================
-- FIN DU SCRIPT DE DEBUG USERS-PROFILES
-- ===================================================================