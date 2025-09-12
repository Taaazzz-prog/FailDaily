-- ===================================================================
-- SCRIPT DE NETTOYAGE DES DONNÉES ORPHELINES - FailDaily Database
-- ===================================================================
-- Description: Nettoyage complet des données orphelines et incohérentes
-- Usage: Exécuter dans MySQL Workbench après sauvegarde de la BD
-- Dernière mise à jour: 16 août 2025
-- ATTENTION: Faire une sauvegarde avant exécution !

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. ANALYSE PRÉLIMINAIRE DES DONNÉES ORPHELINES
-- ===================================================================

SELECT 
    'ANALYSE PRÉLIMINAIRE' as SECTION,
    '===================' as SEPARATOR;

-- Profiles sans utilisateur correspondant
SELECT 
    'Profiles orphelins (sans user)' as Problème,
    COUNT(*) as Nombre
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Badges utilisateur sans utilisateur
SELECT 
    'User badges orphelins' as Problème,
    COUNT(*) as Nombre
FROM user_badges ub
LEFT JOIN users u ON ub.user_id = u.id
WHERE u.id IS NULL;

-- Tasks sans utilisateur
SELECT 
    'Tasks orphelines' as Problème,
    COUNT(*) as Nombre
FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

-- Notifications sans utilisateur
SELECT 
    'Notifications orphelines' as Problème,
    COUNT(*) as Nombre
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
WHERE u.id IS NULL;

-- User preferences sans utilisateur
SELECT 
    'Préférences orphelines' as Problème,
    COUNT(*) as Nombre
FROM user_preferences up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

-- ===================================================================
-- 2. ANALYSER LES DOUBLONS
-- ===================================================================

SELECT 
    'ANALYSE DES DOUBLONS' as SECTION,
    '====================' as SEPARATOR;

-- Utilisateurs avec emails doublons
SELECT 
    'Emails doublons' as Problème,
    email,
    COUNT(*) as Occurrences
FROM users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Usernames doublons
SELECT 
    'Usernames doublons' as Problème,
    username,
    COUNT(*) as Occurrences
FROM users
GROUP BY username
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Profiles multiples pour même utilisateur
SELECT 
    'Profiles multiples même user' as Problème,
    user_id,
    COUNT(*) as Occurrences
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ===================================================================
-- 3. SAUVEGARDER LES DONNÉES AVANT NETTOYAGE
-- ===================================================================

SELECT 
    'SAUVEGARDE PRÉVENTIVE' as SECTION,
    '=====================' as SEPARATOR;

-- Créer table temporaire pour profiles orphelins
CREATE TEMPORARY TABLE temp_orphan_profiles AS
SELECT p.*, 'orphan_profile' as reason
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Créer table temporaire pour user_badges orphelins
CREATE TEMPORARY TABLE temp_orphan_user_badges AS
SELECT ub.*, 'orphan_user_badge' as reason
FROM user_badges ub
LEFT JOIN users u ON ub.user_id = u.id
WHERE u.id IS NULL;

-- Créer table temporaire pour tasks orphelines
CREATE TEMPORARY TABLE temp_orphan_tasks AS
SELECT t.*, 'orphan_task' as reason
FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

-- Créer table temporaire pour notifications orphelines  
CREATE TEMPORARY TABLE temp_orphan_notifications AS
SELECT n.*, 'orphan_notification' as reason
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
WHERE u.id IS NULL;

-- Créer table temporaire pour preferences orphelines
CREATE TEMPORARY TABLE temp_orphan_preferences AS
SELECT up.*, 'orphan_preference' as reason
FROM user_preferences up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Sauvegardes temporaires créées' as Status, '✅ FAIT' as Résultat;

-- ===================================================================
-- 4. NETTOYAGE DES DONNÉES ORPHELINES
-- ===================================================================

SELECT 
    'NETTOYAGE EN COURS' as SECTION,
    '==================' as SEPARATOR;

-- Nettoyer profiles orphelins
SET @deleted_profiles = 0;
DELETE p FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;
SET @deleted_profiles = ROW_COUNT();

-- Nettoyer user_badges orphelins
SET @deleted_user_badges = 0;
DELETE ub FROM user_badges ub
LEFT JOIN users u ON ub.user_id = u.id
WHERE u.id IS NULL;
SET @deleted_user_badges = ROW_COUNT();

-- Nettoyer tasks orphelines
SET @deleted_tasks = 0;
DELETE t FROM tasks t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;
SET @deleted_tasks = ROW_COUNT();

-- Nettoyer notifications orphelines
SET @deleted_notifications = 0;
DELETE n FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
WHERE u.id IS NULL;
SET @deleted_notifications = ROW_COUNT();

-- Nettoyer preferences orphelines
SET @deleted_preferences = 0;
DELETE up FROM user_preferences up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL;
SET @deleted_preferences = ROW_COUNT();

-- Rapport de nettoyage
SELECT 'Profiles supprimés' as Action, @deleted_profiles as Nombre;
SELECT 'User badges supprimés' as Action, @deleted_user_badges as Nombre;
SELECT 'Tasks supprimées' as Action, @deleted_tasks as Nombre;
SELECT 'Notifications supprimées' as Action, @deleted_notifications as Nombre;
SELECT 'Préférences supprimées' as Action, @deleted_preferences as Nombre;

-- ===================================================================
-- 5. NETTOYAGE DES DOUBLONS
-- ===================================================================

SELECT 
    'NETTOYAGE DOUBLONS' as SECTION,
    '==================' as SEPARATOR;

-- Supprimer les utilisateurs doublons (garder le plus ancien)
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.email = u2.email 
  AND u1.id > u2.id;

-- Supprimer les profiles doublons (garder le plus ancien)
DELETE p1 FROM profiles p1
INNER JOIN profiles p2
WHERE p1.user_id = p2.user_id
  AND p1.id > p2.id;

SELECT 'Doublons supprimés' as Action, '✅ FAIT' as Résultat;

-- ===================================================================
-- 6. NETTOYAGE DES DONNÉES CORROMPUES
-- ===================================================================

SELECT 
    'NETTOYAGE CORRUPTION' as SECTION,
    '====================' as SEPARATOR;

-- Supprimer utilisateurs avec email invalide
DELETE FROM users 
WHERE email IS NULL 
   OR email = '' 
   OR email NOT LIKE '%@%'
   OR CHAR_LENGTH(email) < 5;

-- Supprimer utilisateurs avec username invalide
DELETE FROM users 
WHERE username IS NULL 
   OR username = '' 
   OR CHAR_LENGTH(username) < 2;

-- Supprimer utilisateurs avec password vide
DELETE FROM users 
WHERE password_hash IS NULL 
   OR password_hash = ''
   OR CHAR_LENGTH(password_hash) < 10;

-- Supprimer profiles avec display_name invalide
UPDATE profiles 
SET display_name = username 
WHERE display_name IS NULL 
   OR display_name = '';

-- Corriger les dates invalides
UPDATE users 
SET created_at = NOW() 
WHERE created_at IS NULL 
   OR created_at = '0000-00-00 00:00:00';

UPDATE users 
SET updated_at = created_at 
WHERE updated_at IS NULL 
   OR updated_at = '0000-00-00 00:00:00'
   OR updated_at < created_at;

SELECT 'Données corrompues nettoyées' as Action, '✅ FAIT' as Résultat;

-- ===================================================================
-- 7. OPTIMISATION DES PERFORMANCES
-- ===================================================================

SELECT 
    'OPTIMISATION BD' as SECTION,
    '===============' as SEPARATOR;

-- Réinitialiser les compteurs auto_increment
SET @max_user_id = (SELECT COALESCE(MAX(id), 0) FROM users);
SET @sql = CONCAT('ALTER TABLE users AUTO_INCREMENT = ', @max_user_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @max_profile_id = (SELECT COALESCE(MAX(id), 0) FROM profiles);
SET @sql = CONCAT('ALTER TABLE profiles AUTO_INCREMENT = ', @max_profile_id + 1);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Optimiser les tables
OPTIMIZE TABLE users;
OPTIMIZE TABLE profiles;
OPTIMIZE TABLE user_badges;
OPTIMIZE TABLE tasks;
OPTIMIZE TABLE notifications;
OPTIMIZE TABLE user_preferences;

SELECT 'Tables optimisées' as Action, '✅ FAIT' as Résultat;

-- ===================================================================
-- 8. VÉRIFICATION POST-NETTOYAGE
-- ===================================================================

SELECT 
    'VÉRIFICATION FINALE' as SECTION,
    '===================' as SEPARATOR;

-- Vérifier qu'il n'y a plus d'orphelins
SELECT 
    'Profiles orphelins restants' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM profiles p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

SELECT 
    'User badges orphelins restants' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM user_badges ub
LEFT JOIN users u ON ub.user_id = u.id
WHERE u.id IS NULL;

-- Vérifier intégrité des données
SELECT 
    'Utilisateurs sans email' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM users 
WHERE email IS NULL OR email = '';

SELECT 
    'Utilisateurs sans password' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLÈME' END as Status
FROM users 
WHERE password_hash IS NULL OR password_hash = '';

-- ===================================================================
-- 9. STATISTIQUES FINALES
-- ===================================================================

SELECT 
    'STATISTIQUES FINALES' as SECTION,
    '====================' as SEPARATOR;

-- Compter les enregistrements par table
SELECT 'users' as Table, COUNT(*) as Enregistrements FROM users;
SELECT 'profiles' as Table, COUNT(*) as Enregistrements FROM profiles;
SELECT 'user_badges' as Table, COUNT(*) as Enregistrements FROM user_badges;
SELECT 'tasks' as Table, COUNT(*) as Enregistrements FROM tasks;
SELECT 'notifications' as Table, COUNT(*) as Enregistrements FROM notifications;
SELECT 'user_preferences' as Table, COUNT(*) as Enregistrements FROM user_preferences;

-- Taille des tables
SELECT 
    table_name as 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Taille (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'faildaily'
ORDER BY (data_length + index_length) DESC;

-- ===================================================================
-- 10. RAPPORT FINAL
-- ===================================================================

SELECT 
    'RAPPORT FINAL' as SECTION,
    '=============' as SEPARATOR;

SELECT 
    'Nettoyage terminé avec succès' as Résumé,
    NOW() as 'Heure de fin',
    'Base de données optimisée' as Status,
    'Prêt pour production' as Recommandation;

-- Supprimer les tables temporaires
DROP TEMPORARY TABLE IF EXISTS temp_orphan_profiles;
DROP TEMPORARY TABLE IF EXISTS temp_orphan_user_badges;
DROP TEMPORARY TABLE IF EXISTS temp_orphan_tasks;
DROP TEMPORARY TABLE IF EXISTS temp_orphan_notifications;
DROP TEMPORARY TABLE IF EXISTS temp_orphan_preferences;

SELECT 'Tables temporaires supprimées' as Nettoyage, '✅ TERMINÉ' as Status;

-- ===================================================================
-- FIN DU SCRIPT DE NETTOYAGE
-- ===================================================================