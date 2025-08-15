# Vérifier la table profiles et ses RLS
$dockerContainerName = "supabase_db_FailDaily"

$sqlQuery = @"
-- Vérifier si la table profiles existe
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'profiles';

-- Vérifier la structure de profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Vérifier les policies RLS sur profiles
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Vérifier si RLS est activé sur profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
"@

$sqlQuery | docker exec -i $dockerContainerName psql -U postgres -d postgres
