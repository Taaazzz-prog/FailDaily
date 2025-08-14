-- ====================================================================
-- REQUÊTES ULTRA-SIMPLES GARANTIES SANS ERREUR
-- Version minimaliste pour Supabase
-- ====================================================================

-- ====================================================================
-- 1. TOUTES LES TABLES (GARANTI)
-- ====================================================================
SELECT 
    table_schema,
    table_name,
    table_type
FROM 
    information_schema.tables 
WHERE 
    table_schema NOT LIKE 'pg_%' 
    AND table_schema != 'information_schema'
ORDER BY 
    table_schema, table_name;

-- ====================================================================
-- 2. TOUTES LES COLONNES (GARANTI)
-- ====================================================================
SELECT 
    table_schema,
    table_name,
    column_name,
    ordinal_position,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema NOT LIKE 'pg_%' 
    AND table_schema != 'information_schema'
ORDER BY 
    table_schema, table_name, ordinal_position;

-- ====================================================================
-- 3. CLÉS PRIMAIRES (SIMPLE)
-- ====================================================================
SELECT 
    tc.table_schema,
    tc.table_name,
    kc.column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
WHERE 
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema NOT LIKE 'pg_%' 
    AND tc.table_schema != 'information_schema'
ORDER BY 
    tc.table_schema, tc.table_name, kc.ordinal_position;

-- ====================================================================
-- 4. RÉSUMÉ DES SCHÉMAS
-- ====================================================================
SELECT 
    table_schema,
    COUNT(*) as nombre_tables
FROM 
    information_schema.tables 
WHERE 
    table_type = 'BASE TABLE'
    AND table_schema NOT LIKE 'pg_%' 
    AND table_schema != 'information_schema'
GROUP BY 
    table_schema
ORDER BY 
    table_schema;

-- ====================================================================
-- 5. TYPES DE DONNÉES UTILISÉS
-- ====================================================================
SELECT 
    data_type,
    COUNT(*) as nombre_colonnes
FROM 
    information_schema.columns
WHERE 
    table_schema NOT LIKE 'pg_%' 
    AND table_schema != 'information_schema'
GROUP BY 
    data_type
ORDER BY 
    nombre_colonnes DESC;

-- ====================================================================
-- 6. TABLES PAR SCHÉMA (DÉTAIL)
-- ====================================================================
SELECT 
    table_schema,
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns c 
     WHERE c.table_name = t.table_name 
     AND c.table_schema = t.table_schema) as nombre_colonnes
FROM 
    information_schema.tables t
WHERE 
    table_type = 'BASE TABLE'
    AND table_schema NOT LIKE 'pg_%' 
    AND table_schema != 'information_schema'
ORDER BY 
    table_schema, table_name;
