-- =========================================
-- DIAGNOSTIC: Table "fails" manquante
-- =========================================
-- Ce script diagnostique le problème "relation 'public.fails' does not exist"
-- et propose des solutions de validation

-- =========================================
-- 1. VÉRIFIER L'EXISTENCE DES TABLES
-- =========================================

-- Vérifier si la table "fails" existe
SELECT 
    'TABLE FAILS' as diagnostic,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'fails'
        ) THEN 'EXISTE ✅'
        ELSE 'MANQUANTE ❌'
    END as status;

-- Lister toutes les tables existantes dans le schéma public
SELECT 
    'TABLES EXISTANTES' as diagnostic,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =========================================
-- 2. VÉRIFIER LES PERMISSIONS
-- =========================================

-- Vérifier les permissions sur le schéma public
SELECT 
    'PERMISSIONS SCHEMA' as diagnostic,
    has_schema_privilege('public', 'USAGE') as can_use_schema,
    has_schema_privilege('public', 'CREATE') as can_create_tables;

-- =========================================
-- 3. VÉRIFIER LA CONNEXION À LA BASE
-- =========================================

-- Vérifier la base de données actuelle
SELECT 
    'BASE DE DONNÉES' as diagnostic,
    current_database() as database_name,
    current_user as connected_user,
    session_user as session_user;

-- =========================================
-- 4. RECHERCHER LA TABLE DANS D'AUTRES SCHÉMAS
-- =========================================

-- Chercher si la table "fails" existe dans d'autres schémas
SELECT 
    'RECHERCHE FAILS' as diagnostic,
    table_schema,
    table_name,
    'Trouvée dans ' || table_schema as location
FROM information_schema.tables 
WHERE table_name = 'fails'
ORDER BY table_schema;

-- =========================================
-- 5. VÉRIFIER LES FONCTIONS LIÉES
-- =========================================

-- Vérifier si les fonctions qui utilisent la table "fails" existent
SELECT 
    'FONCTIONS LIÉES' as diagnostic,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_definition LIKE '%fails%' THEN 'Utilise table fails'
        ELSE 'N''utilise pas fails'
    END as uses_fails_table
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%fails%'
ORDER BY routine_name;

-- =========================================
-- DIAGNOSTIC COMPLET
-- =========================================

-- Résumé du diagnostic
SELECT 
    '=== RÉSUMÉ DIAGNOSTIC ===' as section,
    '' as details
UNION ALL
SELECT 
    'Problème identifié:',
    'ERROR 42P01: relation "public.fails" does not exist'
UNION ALL
SELECT 
    'Causes possibles:',
    '1. Table jamais créée | 2. Script de migration non exécuté | 3. Mauvaise base de données'
UNION ALL
SELECT 
    'Solutions:',
    '1. Exécuter database-recovery-COMPLETE-FINAL-FIXED.sql | 2. Vérifier la connexion Supabase'
UNION ALL
SELECT 
    'Prochaines étapes:',
    'Confirmer le diagnostic puis appliquer la solution appropriée';