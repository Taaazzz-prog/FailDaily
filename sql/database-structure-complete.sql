-- ====================================================================
-- REQUÊTE ULTRA-COMPLÈTE POUR OBTENIR LA STRUCTURE DE TOUTES LES TABLES
-- Compatible PostgreSQL (Supabase) - VERSION EXHAUSTIVE
-- ====================================================================

-- 1. STRUCTURE DÉTAILLÉE DE TOUTES LES TABLES (TOUS SCHÉMAS)
SELECT 
    t.table_schema as "Schéma",
    t.table_name as "Table",
    c.column_name as "Colonne",
    c.ordinal_position as "Position",
    c.data_type as "Type",
    CASE 
        WHEN c.data_type = 'character varying' THEN 'varchar(' || COALESCE(c.character_maximum_length::text, 'unlimited') || ')'
        WHEN c.data_type = 'character' THEN 'char(' || COALESCE(c.character_maximum_length::text, '') || ')'
        WHEN c.data_type = 'numeric' THEN 'numeric(' || COALESCE(c.numeric_precision::text, '') || ',' || COALESCE(c.numeric_scale::text, '') || ')'
        WHEN c.data_type = 'integer' THEN 'integer'
        WHEN c.data_type = 'bigint' THEN 'bigint'
        WHEN c.data_type = 'uuid' THEN 'uuid'
        WHEN c.data_type = 'timestamp with time zone' THEN 'timestamptz'
        WHEN c.data_type = 'timestamp without time zone' THEN 'timestamp'
        WHEN c.data_type = 'boolean' THEN 'boolean'
        WHEN c.data_type = 'text' THEN 'text'
        WHEN c.data_type = 'json' THEN 'json'
        WHEN c.data_type = 'jsonb' THEN 'jsonb'
        WHEN c.data_type = 'array' THEN c.udt_name
        ELSE c.data_type
    END as "Type_Complet",
    c.character_maximum_length as "Taille_Max",
    c.numeric_precision as "Précision",
    c.numeric_scale as "Échelle",
    c.is_nullable as "Nullable",
    c.column_default as "Valeur_Par_Défaut",
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY → ' || fk.foreign_table_name || '.' || fk.foreign_column_name
        WHEN uk.column_name IS NOT NULL THEN 'UNIQUE'
        WHEN ck.column_name IS NOT NULL THEN 'CHECK'
        ELSE ''
    END as "Contrainte",
    col_description(pgc.oid, c.ordinal_position) as "Description"
FROM 
    information_schema.tables t
LEFT JOIN 
    information_schema.columns c ON c.table_name = t.table_name AND c.table_schema = t.table_schema
LEFT JOIN 
    pg_class pgc ON pgc.relname = t.table_name
LEFT JOIN 
    pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = t.table_schema
-- Clés primaires
LEFT JOIN (
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE 
        tc.constraint_type = 'PRIMARY KEY'
) pk ON pk.table_schema = c.table_schema AND pk.table_name = c.table_name AND pk.column_name = c.column_name
-- Clés étrangères
LEFT JOIN (
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN 
        information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE 
        tc.constraint_type = 'FOREIGN KEY'
) fk ON fk.table_schema = c.table_schema AND fk.table_name = c.table_name AND fk.column_name = c.column_name
-- Contraintes uniques
LEFT JOIN (
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE 
        tc.constraint_type = 'UNIQUE'
) uk ON uk.table_schema = c.table_schema AND uk.table_name = c.table_name AND uk.column_name = c.column_name
-- Contraintes CHECK
LEFT JOIN (
    SELECT 
        kcu.table_schema,
        kcu.table_name,
        kcu.column_name
    FROM 
        information_schema.table_constraints tc
    JOIN 
        information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE 
        tc.constraint_type = 'CHECK'
) ck ON ck.table_schema = c.table_schema AND ck.table_name = c.table_name AND ck.column_name = c.column_name
WHERE 
    t.table_type = 'BASE TABLE'
    -- INCLURE TOUS LES SCHÉMAS (pas de filtre)
ORDER BY 
    t.table_schema, t.table_name, c.ordinal_position;

-- ====================================================================
-- 2. TOUS LES SCHÉMAS ET LEURS TABLES
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    COUNT(*) as "Nombre_de_Tables",
    STRING_AGG(table_name, ', ' ORDER BY table_name) as "Tables"
FROM 
    information_schema.tables 
WHERE 
    table_type = 'BASE TABLE'
    -- Exclure seulement les schémas système vraiment internes
    AND table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY 
    table_schema
ORDER BY 
    table_schema;

-- ====================================================================
-- 3. TOUS LES INDEX ET CONTRAINTES
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
-- 4. TOUTES LES CONTRAINTES DÉTAILLÉES
-- ====================================================================
SELECT 
    tc.table_schema as "Schéma",
    tc.table_name as "Table",
    tc.constraint_name as "Nom_Contrainte",
    tc.constraint_type as "Type_Contrainte",
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as "Colonnes",
    rc.match_option as "Match_Option",
    rc.update_rule as "Règle_Update",
    rc.delete_rule as "Règle_Delete",
    cc.check_clause as "Condition_Check"
FROM 
    information_schema.table_constraints tc
LEFT JOIN 
    information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN 
    information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
LEFT JOIN 
    information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
GROUP BY 
    tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type, 
    rc.match_option, rc.update_rule, rc.delete_rule, cc.check_clause
ORDER BY 
    tc.table_schema, tc.table_name, tc.constraint_type, tc.constraint_name;

-- ====================================================================
-- 5. TOUTES LES FONCTIONS ET PROCÉDURES
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    p.proname as "Fonction",
    pg_catalog.pg_get_function_result(p.oid) as "Type_Retour",
    pg_catalog.pg_get_function_arguments(p.oid) as "Arguments",
    CASE p.prokind
        WHEN 'f' THEN 'Fonction'
        WHEN 'p' THEN 'Procédure'
        WHEN 'a' THEN 'Agrégat'
        WHEN 'w' THEN 'Window'
        ELSE 'Autre'
    END as "Type",
    p.prosrc as "Code_Source",
    l.lanname as "Langage"
FROM 
    pg_catalog.pg_proc p
LEFT JOIN 
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
LEFT JOIN 
    pg_catalog.pg_language l ON l.oid = p.prolang
WHERE 
    n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    n.nspname, p.proname;

-- ====================================================================
-- 6. TOUS LES TRIGGERS
-- ====================================================================
SELECT 
    event_object_schema as "Schéma",
    event_object_table as "Table",
    trigger_name as "Trigger",
    event_manipulation as "Événement",
    action_timing as "Timing",
    action_condition as "Condition",
    action_statement as "Action",
    action_orientation as "Orientation"
FROM 
    information_schema.triggers 
WHERE 
    event_object_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    event_object_schema, event_object_table, trigger_name;

-- ====================================================================
-- 7. TOUTES LES VUES
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    table_name as "Vue",
    view_definition as "Définition",
    check_option as "Check_Option",
    is_updatable as "Modifiable",
    is_insertable_into as "Insertion_Possible"
FROM 
    information_schema.views 
WHERE 
    table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    table_schema, table_name;

-- ====================================================================
-- 8. TOUTES LES SÉQUENCES
-- ====================================================================
SELECT 
    sequence_schema as "Schéma",
    sequence_name as "Séquence",
    data_type as "Type",
    numeric_precision as "Précision",
    numeric_scale as "Échelle",
    start_value as "Valeur_Début",
    minimum_value as "Valeur_Min",
    maximum_value as "Valeur_Max",
    increment as "Incrément",
    cycle_option as "Cycle"
FROM 
    information_schema.sequences
WHERE 
    sequence_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    sequence_schema, sequence_name;

-- ====================================================================
-- 9. STATISTIQUES COMPLÈTES DES TABLES
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    attname as "Colonne",
    n_distinct as "Valeurs_Distinctes",
    most_common_vals as "Valeurs_Communes",
    most_common_freqs as "Fréquences",
    histogram_bounds as "Histogramme",
    correlation as "Corrélation",
    null_frac as "Pourcentage_NULL",
    avg_width as "Taille_Moyenne"
FROM 
    pg_stats 
WHERE 
    schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    schemaname, tablename, attname;

-- ====================================================================
-- 10. TAILLES DES TABLES ET USAGE DE L'ESPACE
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Taille_Totale",
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Taille_Table",
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "Taille_Index"
FROM 
    pg_tables
WHERE 
    schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY 
    pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ====================================================================
-- 11. ÉNUMÉRATIONS (ENUMS)
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    t.typname as "Nom_Enum",
    e.enumlabel as "Valeur",
    e.enumsortorder as "Ordre"
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
-- 12. EXTENSIONS INSTALLÉES
-- ====================================================================
SELECT 
    extname as "Extension",
    extversion as "Version",
    n.nspname as "Schéma",
    extrelocatable as "Relocalisable",
    extconfig as "Configuration"
FROM 
    pg_extension e
LEFT JOIN 
    pg_namespace n ON n.oid = e.extnamespace
ORDER BY 
    extname;

-- ====================================================================
-- 2. RÉSUMÉ DES TABLES PAR SCHÉMA
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    COUNT(*) as "Nombre_de_Tables",
    STRING_AGG(table_name, ', ' ORDER BY table_name) as "Tables"
FROM 
    information_schema.tables 
WHERE 
    table_type = 'BASE TABLE'
    AND table_schema IN ('public', 'auth', 'storage')
GROUP BY 
    table_schema
ORDER BY 
    table_schema;

-- ====================================================================
-- 3. INDEX ET CONTRAINTES
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    indexname as "Index",
    indexdef as "Définition"
FROM 
    pg_indexes 
WHERE 
    schemaname IN ('public', 'auth', 'storage')
ORDER BY 
    schemaname, tablename, indexname;

-- ====================================================================
-- 4. FONCTIONS ET PROCÉDURES STOCKÉES
-- ====================================================================
SELECT 
    n.nspname as "Schéma",
    p.proname as "Fonction",
    pg_catalog.pg_get_function_result(p.oid) as "Type_Retour",
    pg_catalog.pg_get_function_arguments(p.oid) as "Arguments",
    CASE p.prokind
        WHEN 'f' THEN 'Fonction'
        WHEN 'p' THEN 'Procédure'
        WHEN 'a' THEN 'Agrégat'
        WHEN 'w' THEN 'Window'
        ELSE 'Autre'
    END as "Type"
FROM 
    pg_catalog.pg_proc p
LEFT JOIN 
    pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE 
    n.nspname IN ('public', 'auth', 'storage')
    AND p.prokind IN ('f', 'p')  -- Seulement fonctions et procédures
ORDER BY 
    n.nspname, p.proname;

-- ====================================================================
-- 5. TRIGGERS
-- ====================================================================
SELECT 
    event_object_schema as "Schéma",
    event_object_table as "Table",
    trigger_name as "Trigger",
    event_manipulation as "Événement",
    action_timing as "Timing",
    action_statement as "Action"
FROM 
    information_schema.triggers 
WHERE 
    event_object_schema IN ('public', 'auth', 'storage')
ORDER BY 
    event_object_schema, event_object_table, trigger_name;

-- ====================================================================
-- 6. VUES
-- ====================================================================
SELECT 
    table_schema as "Schéma",
    table_name as "Vue",
    view_definition as "Définition"
FROM 
    information_schema.views 
WHERE 
    table_schema IN ('public', 'auth', 'storage')
ORDER BY 
    table_schema, table_name;

-- ====================================================================
-- 7. STATISTIQUES DES TABLES (taille, nombre de lignes)
-- ====================================================================
SELECT 
    schemaname as "Schéma",
    tablename as "Table",
    attname as "Colonne",
    n_distinct as "Valeurs_Distinctes",
    most_common_vals as "Valeurs_Communes",
    correlation as "Corrélation"
FROM 
    pg_stats 
WHERE 
    schemaname IN ('public', 'auth', 'storage')
ORDER BY 
    schemaname, tablename, attname;
