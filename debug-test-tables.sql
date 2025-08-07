-- ================================================
-- SCRIPT DE VÉRIFICATION - TESTER LES TABLES
-- ================================================

-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'fails', 'badges', 'reactions', 'comments');

-- Vérifier le contenu des tables
SELECT 'profiles' as table_name, count(*) as row_count FROM public.profiles
UNION ALL
SELECT 'fails' as table_name, count(*) as row_count FROM public.fails
UNION ALL
SELECT 'badges' as table_name, count(*) as row_count FROM public.badges
UNION ALL
SELECT 'reactions' as table_name, count(*) as row_count FROM public.reactions
UNION ALL
SELECT 'comments' as table_name, count(*) as row_count FROM public.comments;

-- Tester une requête simple sur fails
SELECT id, title, category, is_public, created_at 
FROM public.fails 
WHERE is_public = true 
ORDER BY created_at DESC 
LIMIT 5;
