-- =========================================
-- SOLUTION RADICALE : SUPPRIMER LE TRIGGER COMPLÈTEMENT
-- =========================================

-- 1. Supprimer complètement le trigger qui pose problème
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Vérifier qu'il n'y a plus de triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 3. Test : l'inscription devrait maintenant fonctionner 
-- (mais sans création automatique du profil)

SELECT 'TRIGGER REMOVED - Test signup now (profile will need manual creation)' as status;
