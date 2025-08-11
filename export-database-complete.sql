-- =====================================================
-- EXPORT COMPLET DE LA BASE DE DONNÉES FAILDAILY
-- =====================================================

-- 1. STRUCTURE DES TABLES (schéma complet)
-- =====================================================

-- Informations sur toutes les tables
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Structure détaillée de chaque table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Contraintes et index
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 2. LISTER D'ABORD TOUTES LES TABLES EXISTANTES
-- =====================================================

-- Voir exactement quelles tables existent
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 3. EXTRACTION DYNAMIQUE DE TOUTES LES DONNÉES
-- =====================================================

-- Génerer automatiquement les requêtes pour chaque table existante
SELECT 
    'SELECT ''' || table_name || ''' as table_name, count(*) as row_count FROM ' || table_name || ';' as count_query,
    'SELECT * FROM ' || table_name || ';' as data_query
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 4. REQUÊTES CONDITIONNELLES POUR TABLES COMMUNES
-- =====================================================

-- Table: profiles (si elle existe)
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
    THEN 'SELECT * FROM profiles ORDER BY created_at;'
    ELSE '-- Table profiles n''existe pas' 
END as query_profiles;

-- Table: fails (si elle existe)
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fails') 
    THEN 'SELECT * FROM fails ORDER BY created_at DESC;'
    ELSE '-- Table fails n''existe pas' 
END as query_fails;

-- Table: reactions (si elle existe)
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reactions') 
    THEN 'SELECT * FROM reactions ORDER BY created_at DESC;'
    ELSE '-- Table reactions n''existe pas' 
END as query_reactions;

-- Table: badges (si elle existe)
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'badges') 
    THEN 'SELECT * FROM badges ORDER BY created_at;'
    ELSE '-- Table badges n''existe pas' 
END as query_badges;

-- 3. DONNÉES D'AUTHENTIFICATION (si accessible)
-- =====================================================

-- Utilisateurs auth (peut nécessiter des permissions spéciales)
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at;

-- 4. POLITIQUES RLS ET FONCTIONS
-- =====================================================

-- Politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Fonctions personnalisées
SELECT 
    routine_name,
    routine_definition,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 5. RÉSUMÉ COMPLET PAR TABLE (DYNAMIQUE)
-- =====================================================

-- Vue d'ensemble avec comptage automatique
SELECT 
    t.table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count,
    'SELECT count(*) FROM ' || t.table_name || ';' as count_query
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 6. EXPORT COMPLET FINAL - TOUTES LES DONNÉES
-- =====================================================

-- Pour chaque table, générer l'export complet
SELECT 
    '-- ========== TABLE: ' || table_name || ' ========== ' || CHR(10) ||
    'SELECT * FROM ' || table_name || ';' || CHR(10) as export_queries
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 6. EXPORT COMPLET EN SÉRIE (pour copier-coller)
-- =====================================================

-- Générer les CREATE TABLE complets
SELECT 
    'CREATE TABLE ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
            WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
            WHEN data_type = 'uuid' THEN 'uuid'
            WHEN data_type = 'boolean' THEN 'boolean'
            WHEN data_type = 'integer' THEN 'integer'
            WHEN data_type = 'text' THEN 'text'
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
    ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
