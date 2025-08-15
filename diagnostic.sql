-- Script de diagnostic pour comprendre l'état actuel de la base
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs' 
ORDER BY ordinal_position;

-- Vérifier si la fonction existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'log_comprehensive_activity';

-- Vérifier les policies RLS
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'activity_logs';

-- Vérifier si RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'activity_logs';
