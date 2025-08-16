-- ===================================================================
-- SCRIPT DE VÉRIFICATION DES TRIGGERS - FailDaily Database
-- ===================================================================
-- Description: Vérification complète de tous les triggers MySQL
-- Usage: Source ce script dans MySQL Workbench ou ligne de commande
-- Dernière mise à jour: 16 août 2025

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. LISTER TOUS LES TRIGGERS EXISTANTS
-- ===================================================================

SELECT 
    'TRIGGERS EXISTANTS' as SECTION,
    '==================' as SEPARATOR;

SELECT 
    TRIGGER_SCHEMA as 'Base de données',
    TRIGGER_NAME as 'Nom du Trigger',
    EVENT_MANIPULATION as 'Événement',
    EVENT_OBJECT_TABLE as 'Table',
    ACTION_TIMING as 'Timing',
    ACTION_STATEMENT as 'Action'
FROM 
    INFORMATION_SCHEMA.TRIGGERS 
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
ORDER BY 
    EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;

-- ===================================================================
-- 2. VÉRIFIER LES TRIGGERS POUR LA TABLE USERS
-- ===================================================================

SELECT 
    'TRIGGERS TABLE USERS' as SECTION,
    '=====================' as SEPARATOR;

-- Trigger de mise à jour automatique updated_at
SELECT 
    TRIGGER_NAME,
    ACTION_TIMING,
    EVENT_MANIPULATION,
    ACTION_STATEMENT
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
    AND EVENT_OBJECT_TABLE = 'users';

-- ===================================================================
-- 3. VÉRIFIER LES TRIGGERS POUR LA TABLE PROFILES
-- ===================================================================

SELECT 
    'TRIGGERS TABLE PROFILES' as SECTION,
    '========================' as SEPARATOR;

SELECT 
    TRIGGER_NAME,
    ACTION_TIMING,
    EVENT_MANIPULATION,
    ACTION_STATEMENT
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
    AND EVENT_OBJECT_TABLE = 'profiles';

-- ===================================================================
-- 4. VÉRIFIER LES TRIGGERS POUR LA TABLE BADGES
-- ===================================================================

SELECT 
    'TRIGGERS TABLE BADGES' as SECTION,
    '======================' as SEPARATOR;

SELECT 
    TRIGGER_NAME,
    ACTION_TIMING,
    EVENT_MANIPULATION,
    ACTION_STATEMENT
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
    AND EVENT_OBJECT_TABLE = 'badges';

-- ===================================================================
-- 5. TEST FONCTIONNEL DES TRIGGERS
-- ===================================================================

SELECT 
    'TESTS FONCTIONNELS' as SECTION,
    '==================' as SEPARATOR;

-- Sauvegarder un utilisateur test pour les tests
SET @test_user_id = 999999;
SET @test_email = 'test_trigger@example.com';

-- Test 1: Créer un utilisateur temporaire pour tester les triggers
INSERT IGNORE INTO users (id, email, password_hash, username, created_at, updated_at)
VALUES (@test_user_id, @test_email, 'test_hash', 'test_trigger_user', NOW(), NOW());

-- Vérifier que l'utilisateur a été créé
SELECT 
    'Test 1: Création utilisateur' as Test,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RÉUSSI'
        ELSE '❌ ÉCHEC'
    END as Résultat
FROM users 
WHERE id = @test_user_id;

-- Test 2: Mettre à jour l'utilisateur et vérifier updated_at
UPDATE users 
SET username = 'test_trigger_updated' 
WHERE id = @test_user_id;

-- Vérifier que updated_at a été mis à jour automatiquement
SELECT 
    'Test 2: Mise à jour automatique updated_at' as Test,
    CASE 
        WHEN updated_at > created_at THEN '✅ RÉUSSI'
        ELSE '❌ ÉCHEC'
    END as Résultat,
    created_at,
    updated_at
FROM users 
WHERE id = @test_user_id;

-- Test 3: Créer un profil et vérifier les triggers associés
INSERT IGNORE INTO profiles (user_id, display_name, created_at, updated_at)
VALUES (@test_user_id, 'Test Profile', NOW(), NOW());

SELECT 
    'Test 3: Création profil' as Test,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ RÉUSSI'
        ELSE '❌ ÉCHEC'
    END as Résultat
FROM profiles 
WHERE user_id = @test_user_id;

-- ===================================================================
-- 6. VÉRIFIER L'INTÉGRITÉ DES TRIGGERS
-- ===================================================================

SELECT 
    'INTÉGRITÉ DES TRIGGERS' as SECTION,
    '======================' as SEPARATOR;

-- Vérifier si tous les triggers attendus sont présents
SELECT 
    'Triggers attendus vs présents' as Vérification,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS 
     WHERE TRIGGER_SCHEMA = 'faildaily') as 'Triggers présents',
    '5' as 'Triggers attendus minimum';

-- Vérifier les tables avec triggers
SELECT 
    EVENT_OBJECT_TABLE as 'Table',
    COUNT(*) as 'Nombre de triggers'
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
GROUP BY 
    EVENT_OBJECT_TABLE
ORDER BY 
    EVENT_OBJECT_TABLE;

-- ===================================================================
-- 7. ANALYSER LES PERFORMANCES DES TRIGGERS
-- ===================================================================

SELECT 
    'ANALYSE PERFORMANCE' as SECTION,
    '===================' as SEPARATOR;

-- Vérifier la taille des actions de triggers
SELECT 
    TRIGGER_NAME,
    EVENT_OBJECT_TABLE,
    CHAR_LENGTH(ACTION_STATEMENT) as 'Taille Action (caractères)',
    CASE 
        WHEN CHAR_LENGTH(ACTION_STATEMENT) > 1000 THEN '⚠️ COMPLEXE'
        WHEN CHAR_LENGTH(ACTION_STATEMENT) > 500 THEN '🔶 MOYEN'
        ELSE '✅ SIMPLE'
    END as 'Complexité'
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
ORDER BY 
    CHAR_LENGTH(ACTION_STATEMENT) DESC;

-- ===================================================================
-- 8. RECOMMANDATIONS ET WARNINGS
-- ===================================================================

SELECT 
    'RECOMMANDATIONS' as SECTION,
    '===============' as SEPARATOR;

-- Vérifier les triggers sans gestion d'erreur
SELECT 
    'Warning: Triggers sans gestion d\'erreur' as Avertissement,
    TRIGGER_NAME,
    EVENT_OBJECT_TABLE
FROM 
    INFORMATION_SCHEMA.TRIGGERS
WHERE 
    TRIGGER_SCHEMA = 'faildaily'
    AND ACTION_STATEMENT NOT LIKE '%DECLARE%HANDLER%'
    AND CHAR_LENGTH(ACTION_STATEMENT) > 100;

-- ===================================================================
-- 9. NETTOYAGE DES DONNÉES DE TEST
-- ===================================================================

SELECT 
    'NETTOYAGE' as SECTION,
    '=========' as SEPARATOR;

-- Supprimer les données de test
DELETE FROM profiles WHERE user_id = @test_user_id;
DELETE FROM users WHERE id = @test_user_id;

SELECT 'Données de test supprimées' as Nettoyage, '✅ TERMINÉ' as Status;

-- ===================================================================
-- 10. RÉSUMÉ FINAL
-- ===================================================================

SELECT 
    'RÉSUMÉ FINAL' as SECTION,
    '============' as SEPARATOR;

SELECT 
    'Vérification des triggers terminée' as Résumé,
    NOW() as 'Heure de vérification',
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TRIGGERS 
     WHERE TRIGGER_SCHEMA = 'faildaily') as 'Total triggers actifs';

-- ===================================================================
-- FIN DU SCRIPT DE VÉRIFICATION
-- ===================================================================