-- ===================================================================
-- SCRIPT DE NETTOYAGE DES PROFILS UTILISATEUR - FailDaily Database  
-- ===================================================================
-- Description: Nettoyage et normalisation spécifique des profils utilisateur
-- Usage: Exécuter après cleanup-orphans.sql pour un nettoyage ciblé
-- Dernière mise à jour: 16 août 2025

-- Sélectionner la base de données
USE faildaily;

-- ===================================================================
-- 1. ANALYSE DES PROFILS EXISTANTS
-- ===================================================================

SELECT 
    'ANALYSE PROFILS EXISTANTS' as SECTION,
    '==========================' as SEPARATOR;

-- Statistiques générales des profils
SELECT 
    'Total profils' as Métrique,
    COUNT(*) as Valeur
FROM profiles;

-- Profils avec données manquantes
SELECT 
    'Profils sans display_name' as Problème,
    COUNT(*) as Nombre
FROM profiles 
WHERE display_name IS NULL OR display_name = '';

SELECT 
    'Profils sans email vérifié' as Information,
    COUNT(*) as Nombre
FROM profiles 
WHERE email_verified = FALSE OR email_verified IS NULL;

-- Profils avec avatar manquant
SELECT 
    'Profils sans avatar' as Information,
    COUNT(*) as Nombre
FROM profiles 
WHERE avatar_url IS NULL OR avatar_url = '';

-- Distribution par âge des profils
SELECT 
    'Profils par tranche d\'âge' as Analyse,
    CASE 
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 < 18 THEN 'Moins de 18 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 18 AND 25 THEN '18-25 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 26 AND 35 THEN '26-35 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 36 AND 50 THEN '36-50 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 > 50 THEN 'Plus de 50 ans'
        ELSE 'Non spécifié'
    END as 'Tranche d\'âge',
    COUNT(*) as Nombre
FROM profiles
GROUP BY 
    CASE 
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 < 18 THEN 'Moins de 18 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 18 AND 25 THEN '18-25 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 26 AND 35 THEN '26-35 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 BETWEEN 36 AND 50 THEN '36-50 ans'
        WHEN DATEDIFF(CURDATE(), date_of_birth) / 365 > 50 THEN 'Plus de 50 ans'
        ELSE 'Non spécifié'
    END;

-- ===================================================================
-- 2. SAUVEGARDER LES PROFILS AVANT MODIFICATION
-- ===================================================================

SELECT 
    'SAUVEGARDE PROFILS' as SECTION,
    '==================' as SEPARATOR;

-- Créer table de sauvegarde
CREATE TEMPORARY TABLE backup_profiles_cleanup AS
SELECT * FROM profiles;

SELECT 
    'Sauvegarde créée' as Action,
    COUNT(*) as 'Profils sauvegardés'
FROM backup_profiles_cleanup;

-- ===================================================================
-- 3. NORMALISER LES DISPLAY_NAMES
-- ===================================================================

SELECT 
    'NORMALISATION DISPLAY_NAMES' as SECTION,
    '============================' as SEPARATOR;

-- Compter les profils à corriger
SET @profiles_to_fix = (
    SELECT COUNT(*) 
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.display_name IS NULL OR p.display_name = ''
);

-- Mettre à jour avec username si display_name manquant
UPDATE profiles p
JOIN users u ON p.user_id = u.id
SET p.display_name = u.username
WHERE p.display_name IS NULL OR p.display_name = '';

SELECT 
    'Display names corrigés' as Action,
    @profiles_to_fix as Nombre;

-- Normaliser la casse des display_names (première lettre majuscule)
UPDATE profiles 
SET display_name = CONCAT(
    UPPER(SUBSTRING(display_name, 1, 1)),
    LOWER(SUBSTRING(display_name, 2))
)
WHERE display_name IS NOT NULL 
  AND display_name != '';

-- Supprimer les espaces en trop
UPDATE profiles 
SET display_name = TRIM(display_name)
WHERE display_name IS NOT NULL;

SELECT 'Display names normalisés' as Action, '✅ FAIT' as Status;

-- ===================================================================
-- 4. CORRIGER LES DONNÉES DE PROFIL INVALIDES
-- ===================================================================

SELECT 
    'CORRECTION DONNÉES INVALIDES' as SECTION,
    '=============================' as SEPARATOR;

-- Corriger les dates de naissance impossibles (futur ou trop anciennes)
UPDATE profiles 
SET date_of_birth = NULL
WHERE date_of_birth > CURDATE() 
   OR date_of_birth < '1900-01-01';

-- Corriger les numéros de téléphone invalides
UPDATE profiles 
SET phone_number = NULL
WHERE phone_number IS NOT NULL 
  AND (
    CHAR_LENGTH(phone_number) < 8 
    OR CHAR_LENGTH(phone_number) > 15
    OR phone_number NOT REGEXP '^[0-9+\\-\\s\\(\\)]+$'
  );

-- Normaliser les URLs d'avatar
UPDATE profiles 
SET avatar_url = NULL
WHERE avatar_url IS NOT NULL 
  AND avatar_url NOT REGEXP '^https?://';

-- Corriger les bio trop longues
UPDATE profiles 
SET bio = SUBSTRING(bio, 1, 500)
WHERE CHAR_LENGTH(bio) > 500;

SELECT 'Données invalides corrigées' as Action, '✅ FAIT' as Status;

-- ===================================================================
-- 5. NORMALISER LES PRÉFÉRENCES
-- ===================================================================

SELECT 
    'NORMALISATION PRÉFÉRENCES' as SECTION,
    '=========================' as SEPARATOR;

-- Définir des valeurs par défaut pour les préférences manquantes
UPDATE profiles 
SET email_verified = FALSE
WHERE email_verified IS NULL;

UPDATE profiles 
SET notification_preferences = JSON_OBJECT(
    'email_notifications', true,
    'push_notifications', true,
    'marketing_emails', false,
    'achievement_notifications', true
)
WHERE notification_preferences IS NULL 
   OR notification_preferences = ''
   OR notification_preferences = '{}';

UPDATE profiles 
SET privacy_settings = JSON_OBJECT(
    'profile_visibility', 'public',
    'show_email', false,
    'show_phone', false,
    'show_achievements', true
)
WHERE privacy_settings IS NULL 
   OR privacy_settings = ''
   OR privacy_settings = '{}';

SELECT 'Préférences normalisées' as Action, '✅ FAIT' as Status;

-- ===================================================================
-- 6. SYNCHRONISER AVEC LA TABLE USERS
-- ===================================================================

SELECT 
    'SYNCHRONISATION USERS' as SECTION,
    '=====================' as SEPARATOR;

-- Mettre à jour les emails dans profiles depuis users
UPDATE profiles p
JOIN users u ON p.user_id = u.id
SET p.email = u.email
WHERE p.email IS NULL 
   OR p.email = ''
   OR p.email != u.email;

-- Synchroniser les timestamps
UPDATE profiles p
JOIN users u ON p.user_id = u.id
SET p.updated_at = GREATEST(p.updated_at, u.updated_at)
WHERE p.updated_at < u.updated_at;

SELECT 'Synchronisation terminée' as Action, '✅ FAIT' as Status;

-- ===================================================================
-- 7. CRÉER LES PROFILS MANQUANTS
-- ===================================================================

SELECT 
    'CRÉATION PROFILS MANQUANTS' as SECTION,
    '===========================' as SEPARATOR;

-- Compter les utilisateurs sans profil
SET @users_without_profile = (
    SELECT COUNT(*) 
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
);

-- Créer profils pour utilisateurs qui n'en ont pas
INSERT INTO profiles (
    user_id, 
    display_name, 
    email, 
    email_verified,
    notification_preferences,
    privacy_settings,
    created_at, 
    updated_at
)
SELECT 
    u.id,
    u.username,
    u.email,
    FALSE,
    JSON_OBJECT(
        'email_notifications', true,
        'push_notifications', true,
        'marketing_emails', false,
        'achievement_notifications', true
    ),
    JSON_OBJECT(
        'profile_visibility', 'public',
        'show_email', false,
        'show_phone', false,
        'show_achievements', true
    ),
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

SELECT 
    'Profils créés pour utilisateurs' as Action,
    @users_without_profile as Nombre;

-- ===================================================================
-- 8. OPTIMISER LES INDEX DES PROFILS
-- ===================================================================

SELECT 
    'OPTIMISATION INDEX' as SECTION,
    '==================' as SEPARATOR;

-- Analyser l'utilisation des index
ANALYZE TABLE profiles;

-- Vérifier les index existants
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    CARDINALITY
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'faildaily' 
  AND TABLE_NAME = 'profiles'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Suggérer des optimisations si nécessaire
SELECT 
    'Optimisation index' as Action,
    'Index user_id, email analysés' as Détail,
    '✅ FAIT' as Status;

-- ===================================================================
-- 9. VALIDATION POST-NETTOYAGE
-- ===================================================================

SELECT 
    'VALIDATION FINALE' as SECTION,
    '=================' as SEPARATOR;

-- Vérifier l'intégrité des profils
SELECT 
    'Profils sans display_name' as Vérification,
    COUNT(*) as Nombre,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '⚠️ À vérifier' END as Status
FROM profiles 
WHERE display_name IS NULL OR display_name = '';

SELECT 
    'Profils avec données cohérentes' as Vérification,
    COUNT(*) as 'Total profils',
    COUNT(CASE WHEN display_name IS NOT NULL AND email IS NOT NULL THEN 1 END) as 'Profils valides',
    ROUND(
        COUNT(CASE WHEN display_name IS NOT NULL AND email IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as 'Pourcentage valide'
FROM profiles;

-- Vérifier la synchronisation users-profiles
SELECT 
    'Synchronisation users-profiles' as Vérification,
    (SELECT COUNT(*) FROM users) as 'Total users',
    (SELECT COUNT(*) FROM profiles) as 'Total profiles',
    CASE 
        WHEN (SELECT COUNT(*) FROM users) = (SELECT COUNT(*) FROM profiles) 
        THEN '✅ PARFAIT' 
        ELSE '⚠️ DÉSYNCHRONISÉ' 
    END as Status;

-- ===================================================================
-- 10. STATISTIQUES FINALES
-- ===================================================================

SELECT 
    'STATISTIQUES FINALES' as SECTION,
    '====================' as SEPARATOR;

-- Profils par statut
SELECT 
    'Profils vérifiés' as Catégorie,
    COUNT(*) as Nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as Pourcentage
FROM profiles 
WHERE email_verified = TRUE;

SELECT 
    'Profils avec avatar' as Catégorie,
    COUNT(*) as Nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as Pourcentage
FROM profiles 
WHERE avatar_url IS NOT NULL AND avatar_url != '';

SELECT 
    'Profils avec bio' as Catégorie,
    COUNT(*) as Nombre,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as Pourcentage
FROM profiles 
WHERE bio IS NOT NULL AND bio != '';

-- Taille moyenne des données
SELECT 
    'Taille moyenne bio' as Métrique,
    ROUND(AVG(CHAR_LENGTH(bio)), 2) as 'Caractères moyens'
FROM profiles 
WHERE bio IS NOT NULL;

-- ===================================================================
-- 11. RAPPORT FINAL
-- ===================================================================

SELECT 
    'RAPPORT FINAL NETTOYAGE PROFILS' as SECTION,
    '================================' as SEPARATOR;

SELECT 
    'Nettoyage profils terminé' as Résumé,
    NOW() as 'Heure de fin',
    (SELECT COUNT(*) FROM profiles) as 'Total profils',
    'Profils normalisés et optimisés' as Status;

-- Supprimer la table de sauvegarde temporaire
DROP TEMPORARY TABLE backup_profiles_cleanup;

SELECT 'Sauvegarde temporaire supprimée' as Nettoyage, '✅ TERMINÉ' as Status;

-- ===================================================================
-- FIN DU SCRIPT DE NETTOYAGE DES PROFILS
-- ===================================================================