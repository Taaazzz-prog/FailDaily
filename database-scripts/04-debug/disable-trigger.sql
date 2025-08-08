-- Désactiver temporairement TOUS les triggers pour tester l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_debug() CASCADE;

SELECT 'TOUS LES TRIGGERS SUPPRIMÉS - Testez inscription maintenant' as status;
