-- Diagnostic Supabase - Version simplifiée
-- Exécutez ces requêtes UNE PAR UNE

-- 1. Vérifier l'état de base de auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 2. Vérifier les extensions disponibles
SELECT name, installed_version 
FROM pg_available_extensions 
WHERE name IN ('uuid-ossp', 'pgcrypto', 'pgjwt') AND installed_version IS NOT NULL;

-- 3. Vérifier les schémas existants
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('auth', 'public');

-- 4. Vérifier les tables dans le schéma auth
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth';

-- 5. Vérifier la structure de auth.users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth'
ORDER BY ordinal_position;
