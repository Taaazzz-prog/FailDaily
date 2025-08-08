-- =========================================
-- TEST DIRECT DE L'AUTHENTIFICATION SUPABASE
-- =========================================

-- 1. Vérifier l'état du schéma auth
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- 2. Vérifier si nous pouvons accéder à la table auth.users
SELECT count(*) as total_users FROM auth.users;

-- 3. Vérifier les triggers sur auth.users
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 4. Vérifier les permissions sur notre fonction
SELECT 
  p.proname as function_name,
  p.proacl as permissions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'handle_new_user';

-- 5. Test manuel de création d'utilisateur (simulation)
-- NOTE: Ceci ne créera PAS vraiment un utilisateur dans auth.users
-- C'est juste pour tester notre trigger

-- Créer un UUID de test
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test_' || extract(epoch from now()) || '@example.com';
BEGIN
    RAISE NOTICE 'Testing with user_id: % and email: %', test_user_id, test_email;
    
    -- Essayer d'insérer directement dans profiles (comme le ferait le trigger)
    INSERT INTO public.profiles (id, email)
    VALUES (test_user_id, test_email);
    
    RAISE NOTICE 'SUCCESS: Direct profile insertion works';
    
    -- Nettoyer
    DELETE FROM public.profiles WHERE id = test_user_id;
    RAISE NOTICE 'Test cleanup completed';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in direct profile test: %', SQLERRM;
END $$;

-- 6. Vérifier les logs système récents (si accessible)
-- NOTE: Cette requête peut ne pas fonctionner selon les permissions
DO $$
BEGIN
    -- Essayer d'accéder aux logs récents
    RAISE NOTICE 'Checking for recent database activity...';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot access system logs (normal for hosted Supabase)';
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error checking logs: %', SQLERRM;
END $$;

-- 7. Vérifier la configuration RLS actuelle
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- 8. Solution alternative : Créer un utilisateur de test directement dans auth.users
-- ATTENTION: Ceci ne devrait être fait qu'en dernier recours
-- et seulement si vous avez les permissions nécessaires

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'direct_test_' || extract(epoch from now()) || '@example.com';
BEGIN
    -- TRÈS RISQUÉ : Insertion directe dans auth.users
    -- NE FAITES CECI QUE SI TOUT LE RESTE ÉCHOUE
    
    RAISE NOTICE 'ATTENTION: Tentative d''insertion directe dans auth.users';
    RAISE NOTICE 'User ID: %, Email: %', test_user_id, test_email;
    
    -- Cette insertion devrait déclencher notre trigger
    INSERT INTO auth.users (
        id, 
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        instance_id,
        aud,
        role
    ) VALUES (
        test_user_id,
        test_email,
        now(),
        now(), 
        now(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated'
    );
    
    RAISE NOTICE 'SUCCESS: Direct auth.users insertion completed';
    
    -- Vérifier si le profil a été créé automatiquement
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: Trigger created profile successfully';
    ELSE
        RAISE NOTICE 'WARNING: Trigger did not create profile';
    END IF;
    
    -- Nettoyer (dans l'ordre inverse)
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    RAISE NOTICE 'Test cleanup completed';
    
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'EXPECTED: Cannot insert directly into auth.users (normal for hosted Supabase)';
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR in direct auth.users test: %', SQLERRM;
END $$;

-- 9. Diagnostic final
SELECT 'DIAGNOSTIC COMPLETE - Check NOTICES above for results' as status;
