-- Vérification complète de la configuration Supabase
-- Exécutez ces requêtes UNE PAR UNE dans Supabase SQL Editor

-- 1. Vérifier si l'email confirmation est désactivée
SELECT name, value FROM auth.config WHERE name = 'DISABLE_SIGNUP';

-- 2. Vérifier la configuration SMTP (peut causer des 500 si mal configurée)
SELECT name, value FROM auth.config WHERE name LIKE '%SMTP%' OR name LIKE '%MAIL%';

-- 3. Vérifier les politiques RLS sur auth.users (ne devrait pas en avoir)
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 4. Vérifier l'état de la table auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 5. Tenter une inscription directe (test)
-- NE PAS EXÉCUTER CECI - juste pour information
-- INSERT INTO auth.users (email, encrypted_password) VALUES ('test@test.com', 'test');

-- 6. Vérifier les extensions activées
SELECT name, installed_version 
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'pgcrypto', 'pgjwt');
