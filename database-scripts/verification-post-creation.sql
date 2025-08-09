-- =========================================
-- VÉRIFICATION POST-CRÉATION USER_BADGES
-- =========================================
-- Ce script vérifie que la table user_badges a été créée correctement

-- =========================================
-- 1. VÉRIFIER LA STRUCTURE DE USER_BADGES
-- =========================================

SELECT 
    'USER_BADGES_STRUCTURE' as status,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================================
-- 2. VÉRIFIER LES POLITIQUES RLS
-- =========================================

SELECT 
    'USER_BADGES_POLICIES' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'user_badges';

-- =========================================
-- 3. VÉRIFIER LES INDEX
-- =========================================

SELECT 
    'USER_BADGES_INDEXES' as status,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_badges' 
AND schemaname = 'public';

-- =========================================
-- 4. VÉRIFIER LES CONTRAINTES
-- =========================================

SELECT 
    'USER_BADGES_CONSTRAINTS' as status,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.user_badges'::regclass;

-- =========================================
-- 5. COMPTER LES DONNÉES ACTUELLES
-- =========================================

SELECT 
    'USER_BADGES_DATA' as status,
    COUNT(*) as total_user_badges,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT badge_id) as unique_badges
FROM public.user_badges;

-- =========================================
-- 6. TEST DE CONFORMITÉ FINALE
-- =========================================

SELECT 
    'CONFORMITÉ_FINALE' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges' AND table_schema = 'public') 
        THEN '✅ TABLE USER_BADGES CRÉÉE'
        ELSE '❌ TABLE USER_BADGES MANQUANTE'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_badges')
        THEN '✅ POLITIQUES RLS CONFIGURÉES'
        ELSE '❌ POLITIQUES RLS MANQUANTES'
    END as rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_badges' AND indexname LIKE '%user_id%')
        THEN '✅ INDEX OPTIMISÉS'
        ELSE '❌ INDEX MANQUANTS'
    END as index_status;

-- =========================================
-- VÉRIFICATION TERMINÉE
-- =========================================
-- Si tous les statuts sont ✅, votre système de badges est prêt !