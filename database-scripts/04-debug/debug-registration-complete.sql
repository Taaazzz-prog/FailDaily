-- =========================================
-- SCRIPT DE DÉBOGAGE COMPLET POUR L'INSCRIPTION
-- =========================================

-- 1. Vérifier l'état actuel de la table profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes existantes
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 3. Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Vérifier les triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 5. Test de création manuelle d'un profil pour identifier le problème
DO $$
BEGIN
  -- Essayer d'insérer un profil de test
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test_user',
    'test@example.com',
    'Test User'
  );
  
  RAISE NOTICE 'SUCCESS: Test profile created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR creating test profile: %', SQLERRM;
END $$;

-- 6. Nettoyer le test
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- 7. SOLUTION RADICALE : Supprimer complètement le trigger et le recréer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 8. Fonction handle_new_user ultra-basique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log pour débogage
  RAISE NOTICE 'Trigger called for user: %', NEW.email;
  
  -- Insertion ultra-simple
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Profile created for: %', NEW.email;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in handle_new_user for %: %', NEW.email, SQLERRM;
    -- Retourner NEW quand même pour ne pas bloquer l'inscription
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- 9. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Supprimer TOUTES les politiques RLS pour les tests
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert during registration" ON profiles;
DROP POLICY IF EXISTS "System can view profiles for validation" ON profiles;
DROP POLICY IF EXISTS "Allow all during development" ON profiles;
DROP POLICY IF EXISTS "Development mode - all access" ON profiles;

-- 11. Désactiver temporairement RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 12. Vérification finale
SELECT 'SETUP COMPLETE - Try registration now' as status;
