-- =========================================
-- SCRIPT DE DIAGNOSTIC POUR PROBLÈME D'INSCRIPTION
-- =========================================
-- À exécuter dans Supabase SQL Editor pour identifier la source du problème

-- 1. Vérifier l'existence et la structure de la table profiles
SELECT 
    'TABLE STRUCTURE CHECK' as diagnostic_step,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes sur la table profiles
SELECT 
    'CONSTRAINTS CHECK' as diagnostic_step,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'profiles';

-- 3. Vérifier les triggers existants
SELECT 
    'TRIGGERS CHECK' as diagnostic_step,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' OR event_object_table = 'profiles';

-- 4. Vérifier les politiques RLS
SELECT 
    'RLS POLICIES CHECK' as diagnostic_step,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Vérifier les fonctions RPC disponibles
SELECT 
    'RPC FUNCTIONS CHECK' as diagnostic_step,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'complete_user_registration', 'check_user_registration_status')
ORDER BY routine_name;

-- 6. Tester la création d'un profil manuellement
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test_' || extract(epoch from now()) || '@example.com';
    test_username TEXT := 'test_user_' || extract(epoch from now());
BEGIN
    RAISE NOTICE 'MANUAL PROFILE CREATION TEST';
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE 'Test Email: %', test_email;
    
    -- Essayer d'insérer un profil de test
    BEGIN
        INSERT INTO profiles (
            id, 
            username, 
            email, 
            display_name,
            email_confirmed,
            registration_completed
        ) VALUES (
            test_user_id,
            test_username,
            test_email,
            test_username,
            false,
            false
        );
        
        RAISE NOTICE 'SUCCESS: Profile creation test passed';
        
        -- Nettoyer le test
        DELETE FROM profiles WHERE id = test_user_id;
        RAISE NOTICE 'Test profile cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in profile creation: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- 7. Vérifier les permissions sur la table profiles
SELECT 
    'PERMISSIONS CHECK' as diagnostic_step,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- 8. Vérifier l'état de RLS
SELECT 
    'RLS STATUS CHECK' as diagnostic_step,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 9. Tester les fonctions de validation
DO $$
BEGIN
    RAISE NOTICE 'VALIDATION FUNCTIONS TEST';
    
    -- Tester validate_legal_consent avec NULL
    IF validate_legal_consent(NULL) THEN
        RAISE NOTICE 'validate_legal_consent(NULL): PASS';
    ELSE
        RAISE NOTICE 'validate_legal_consent(NULL): FAIL';
    END IF;
    
    -- Tester validate_age_verification avec NULL
    IF validate_age_verification(NULL) THEN
        RAISE NOTICE 'validate_age_verification(NULL): PASS';
    ELSE
        RAISE NOTICE 'validate_age_verification(NULL): FAIL';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in validation functions: %', SQLERRM;
END $$;

-- 10. Afficher les derniers utilisateurs créés et leurs profils
SELECT 
    'RECENT USERS CHECK' as diagnostic_step,
    u.id,
    u.email,
    u.created_at as user_created,
    u.email_confirmed_at,
    p.username,
    p.created_at as profile_created,
    p.email_confirmed,
    p.registration_completed
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- 11. Résumé du diagnostic
SELECT 
    'DIAGNOSTIC SUMMARY' as diagnostic_step,
    'Check the results above to identify the issue' as message,
    'Common issues: Missing table, RLS blocking, Trigger errors, Constraint violations' as common_causes;