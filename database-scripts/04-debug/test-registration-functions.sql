-- =========================================
-- TEST DES FONCTIONS D'INSCRIPTION
-- =========================================
-- Ce script teste les fonctions RPC d'inscription

-- =========================================
-- 1. VÉRIFIER QUE LES FONCTIONS EXISTENT
-- =========================================

SELECT 
    'FONCTIONS RPC' as status,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'complete_user_registration',
    'check_user_registration_status', 
    'validate_parental_consent'
)
ORDER BY routine_name;

-- =========================================
-- 2. TEST DE LA FONCTION check_user_registration_status
-- =========================================

-- Test avec un utilisateur inexistant (UUID fictif)
SELECT 
    'TEST_CHECK_STATUS_INEXISTANT' as test_name,
    check_user_registration_status('00000000-0000-0000-0000-000000000000') as result;

-- =========================================
-- 3. SIMULATION D'UN TEST D'INSCRIPTION COMPLÈTE
-- =========================================

-- Données de test pour le consentement légal
SELECT 
    'TEST_LEGAL_CONSENT_FORMAT' as test_name,
    jsonb_build_object(
        'documentsAccepted', ARRAY['terms-of-service', 'privacy-policy', 'moderation-charter', 'age-restrictions'],
        'consentDate', NOW(),
        'consentVersion', '1.0',
        'marketingOptIn', false
    ) as legal_consent_example;

-- Données de test pour la vérification d'âge (adulte)
SELECT 
    'TEST_AGE_VERIFICATION_ADULT' as test_name,
    jsonb_build_object(
        'birthDate', '1990-01-01',
        'isMinor', false,
        'needsParentalConsent', false,
        'parentEmail', null,
        'parentConsentDate', null
    ) as age_verification_adult;

-- Données de test pour la vérification d'âge (mineur)
SELECT 
    'TEST_AGE_VERIFICATION_MINOR' as test_name,
    jsonb_build_object(
        'birthDate', '2010-01-01',
        'isMinor', true,
        'needsParentalConsent', true,
        'parentEmail', 'parent@example.com',
        'parentConsentDate', null
    ) as age_verification_minor;

-- =========================================
-- 4. VÉRIFIER LES PERMISSIONS
-- =========================================

SELECT 
    'PERMISSIONS_RPC' as status,
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'complete_user_registration',
    'check_user_registration_status',
    'validate_parental_consent'
)
ORDER BY routine_name, grantee;

-- =========================================
-- 5. VÉRIFIER LA STRUCTURE DE LA TABLE PROFILES
-- =========================================

SELECT 
    'PROFILES_COLUMNS' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND column_name IN ('legal_consent', 'age_verification', 'registration_completed', 'email_confirmed')
ORDER BY column_name;

-- =========================================
-- 6. COMPTER LES PROFILS EXISTANTS
-- =========================================

SELECT 
    'PROFILES_COUNT' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN registration_completed = true THEN 1 END) as completed_registrations,
    COUNT(CASE WHEN legal_consent IS NOT NULL THEN 1 END) as with_legal_consent,
    COUNT(CASE WHEN age_verification IS NOT NULL THEN 1 END) as with_age_verification
FROM public.profiles;

-- =========================================
-- RÉSUMÉ DU TEST
-- =========================================

SELECT 
    'TEST_SUMMARY' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'complete_user_registration' 
            AND routine_schema = 'public'
        ) THEN '✅ complete_user_registration'
        ELSE '❌ complete_user_registration MANQUANTE'
    END as function_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'check_user_registration_status' 
            AND routine_schema = 'public'
        ) THEN '✅ check_user_registration_status'
        ELSE '❌ check_user_registration_status MANQUANTE'
    END as function_2,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'validate_parental_consent' 
            AND routine_schema = 'public'
        ) THEN '✅ validate_parental_consent'
        ELSE '❌ validate_parental_consent MANQUANTE'
    END as function_3;

-- =========================================
-- INSTRUCTIONS D'UTILISATION
-- =========================================
-- 1. Exécutez d'abord create_registration_functions.sql
-- 2. Puis exécutez ce script de test
-- 3. Vérifiez que toutes les fonctions sont ✅
-- 4. Testez l'inscription depuis l'application