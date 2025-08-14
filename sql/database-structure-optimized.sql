-- ====================================================================
-- REQUÊTES OPTIMISÉES POUR ÉVITER LES TIMEOUTS
-- À exécuter une par une dans l'ordre
-- ====================================================================

-- ====================================================================
-- 1. LISTE SIMPLE DE TOUTES LES TABLES
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    table_name as "Table",
    table_type as "Type"
FROM 
    information_schema.tables 
WHERE 
    table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    table_schema, table_name;

-- ====================================================================
-- 2. STRUCTURE DES COLONNES (SANS JOINS COMPLEXES)
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    table_name as "Table",
    column_name as "Colonne",
    ordinal_position as "Position",
    data_type as "Type",
    CASE 
        WHEN data_type = 'character varying' THEN 'varchar(' || COALESCE(character_maximum_length::text, 'unlimited') || ')'
        WHEN data_type = 'character' THEN 'char(' || COALESCE(character_maximum_length::text, '') || ')'
        WHEN data_type = 'numeric' THEN 'numeric(' || COALESCE(numeric_precision::text, '') || ',' || COALESCE(numeric_scale::text, '') || ')'
        ELSE data_type
    END as "Type_Complet",
    is_nullable as "Nullable",
    column_default as "Défaut"
FROM 
    information_schema.columns
WHERE 
    table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    table_schema, table_name, ordinal_position;

-- ====================================================================
-- 3. CLÉS PRIMAIRES
-- ====================================================================
SELECT 
    kcu.table_schema as "Schéma",
    kcu.table_name as "Table",
    kcu.column_name as "Colonne",
    tc.constraint_name as "Nom_Contrainte"
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE 
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    kcu.table_schema, kcu.table_name, kcu.ordinal_position;

-- ====================================================================
-- 4. CLÉS ÉTRANGÈRES
-- ====================================================================
SELECT 
    kcu.table_schema as "Schéma",
    kcu.table_name as "Table",
    kcu.column_name as "Colonne",
    ccu.table_name as "Référence_Table",
    ccu.column_name as "Référence_Colonne",
    tc.constraint_name as "Nom_Contrainte"
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN 
    information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    kcu.table_schema, kcu.table_name, kcu.column_name;

-- ====================================================================
-- 5. INDEX SIMPLES
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    indexname as "Index",
    indexdef as "Définition"
FROM 
    pg_indexes 
WHERE 
    schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    schemaname, tablename, indexname;

-- ====================================================================
-- 6. FONCTIONS RPC (OPTIMISÉE)
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    p.proname as "Fonction",
    CASE p.prokind
        WHEN 'f' THEN 'Fonction'
        WHEN 'p' THEN 'Procédure'
        ELSE 'Autre'
    END as "Type"
FROM 
    pg_proc p
JOIN 
    pg_namespace n ON n.oid = p.pronamespace
WHERE 
    n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND p.prokind IN ('f', 'p')
ORDER BY 
    n.nspname, p.proname;

-- ====================================================================
-- 7. ÉNUMÉRATIONS (ENUMS)
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    t.typname as "Nom_Enum",
    e.enumlabel as "Valeur"
FROM 
    pg_type t
JOIN 
    pg_enum e ON t.oid = e.enumtypid
JOIN 
    pg_namespace n ON n.oid = t.typnamespace
WHERE 
    n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    n.nspname, t.typname, e.enumsortorder;

-- ====================================================================
-- 8. TRIGGERS
-- ====================================================================
SELECT 
    event_object_schema as "Schéma",
    event_object_table as "Table",
    trigger_name as "Trigger",
    event_manipulation as "Événement",
    action_timing as "Timing"
FROM 
    information_schema.triggers 
WHERE 
    event_object_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    event_object_schema, event_object_table, trigger_name;

-- ====================================================================
-- 9. RÉSUMÉ SIMPLE PAR SCHÉMA
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    COUNT(*) as "Nombre_Tables",
    array_agg(table_name ORDER BY table_name) as "Tables"
FROM 
    information_schema.tables 
WHERE 
    table_type = 'BASE TABLE'
    AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY 
    table_schema
ORDER BY 
    table_schema;

-- ====================================================================
-- 10. STATISTIQUES SIMPLIFIÉES (pour éviter timeout)
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    COUNT(*) as "Nombre_Colonnes"
FROM 
    pg_stats 
WHERE 
    schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY 
    schemaname, tablename
ORDER BY 
    schemaname, tablename;

-- ====================================================================
-- BONUS: REQUÊTE POUR OBTENIR LE NOMBRE DE LIGNES DE CHAQUE TABLE
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    n_tup_ins as "Insertions",
    n_tup_upd as "Mises_à_jour",
    n_tup_del as "Suppressions",
    n_live_tup as "Lignes_Actives",
    n_dead_tup as "Lignes_Mortes"
FROM 
    pg_stat_user_tables
WHERE 
    schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    schemaname, tablename;

-- ====================================================================
-- REQUÊTE ALTERNATIVE POUR LES INDEX (si pg_indexes pose problème)
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    c.relname as "Table",
    i.relname as "Index",
    am.amname as "Type_Index"
FROM 
    pg_class c
JOIN 
    pg_namespace n ON n.oid = c.relnamespace
JOIN 
    pg_index ix ON c.oid = ix.indrelid
JOIN 
    pg_class i ON i.oid = ix.indexrelid
JOIN 
    pg_am am ON i.relam = am.oid
WHERE 
    n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND c.relkind = 'r'
ORDER BY 
    n.nspname, c.relname, i.relname;
