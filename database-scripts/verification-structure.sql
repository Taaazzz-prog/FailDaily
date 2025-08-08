-- =========================================
-- VÉRIFICATION DE LA STRUCTURE ACTUELLE
-- =========================================
-- Ce script vérifie si votre structure correspond à la structure attendue

-- =========================================
-- 1. VÉRIFIER LES TABLES EXISTANTES
-- =========================================

SELECT 
    'TABLES EXISTANTES' as status,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- =========================================
-- 2. VÉRIFIER LA STRUCTURE DE CHAQUE TABLE
-- =========================================

-- Structure badge_definitions
SELECT 
    'BADGE_DEFINITIONS' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badge_definitions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure badges
SELECT 
    'BADGES' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure comments
SELECT 
    'COMMENTS' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure fails
SELECT 
    'FAILS' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fails' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure profiles
SELECT 
    'PROFILES' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure reactions
SELECT 
    'REACTIONS' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'reactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure user_badges (si elle existe)
SELECT 
    'USER_BADGES' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_badges' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =========================================
-- 3. COMPARAISON AVEC LA STRUCTURE ATTENDUE
-- =========================================

-- Vérifier si toutes les tables attendues existent
SELECT 
    'VÉRIFICATION TABLES' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badge_definitions' AND table_schema = 'public') THEN '✅ badge_definitions'
        ELSE '❌ badge_definitions MANQUANTE'
    END as badge_definitions,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges' AND table_schema = 'public') THEN '✅ badges'
        ELSE '❌ badges MANQUANTE'
    END as badges,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN '✅ comments'
        ELSE '❌ comments MANQUANTE'
    END as comments,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fails' AND table_schema = 'public') THEN '✅ fails'
        ELSE '❌ fails MANQUANTE'
    END as fails,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN '✅ profiles'
        ELSE '❌ profiles MANQUANTE'
    END as profiles,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions' AND table_schema = 'public') THEN '✅ reactions'
        ELSE '❌ reactions MANQUANTE'
    END as reactions,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges' AND table_schema = 'public') THEN '✅ user_badges'
        ELSE '❌ user_badges MANQUANTE'
    END as user_badges;

-- =========================================
-- 4. VÉRIFIER LES COLONNES CRITIQUES
-- =========================================

-- Vérifier les colonnes de profiles
SELECT 
    'PROFILES - COLONNES CRITIQUES' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'legal_consent' AND table_schema = 'public') THEN '✅ legal_consent'
        ELSE '❌ legal_consent MANQUANTE'
    END as legal_consent,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age_verification' AND table_schema = 'public') THEN '✅ age_verification'
        ELSE '❌ age_verification MANQUANTE'
    END as age_verification,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stats' AND table_schema = 'public') THEN '✅ stats'
        ELSE '❌ stats MANQUANTE'
    END as stats,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences' AND table_schema = 'public') THEN '✅ preferences'
        ELSE '❌ preferences MANQUANTE'
    END as preferences;

-- =========================================
-- 5. COMPTER LES DONNÉES
-- =========================================

-- Compter les badges disponibles
SELECT 
    'DONNÉES' as status,
    (SELECT COUNT(*) FROM badge_definitions) as total_badges,
    (SELECT COUNT(DISTINCT category) FROM badge_definitions) as categories_badges,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM fails) as total_fails,
    (SELECT COUNT(*) FROM badges) as badges_unlocked;

-- =========================================
-- 6. RÉSUMÉ DE CONFORMITÉ
-- =========================================

SELECT 
    'RÉSUMÉ CONFORMITÉ' as status,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badge_definitions' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'badges' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fails' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') AND
            EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reactions' AND table_schema = 'public')
        ) THEN '✅ STRUCTURE CONFORME'
        ELSE '❌ STRUCTURE NON CONFORME'
    END as conformite_globale;

-- =========================================
-- VÉRIFICATION TERMINÉE
-- =========================================
-- Analysez les résultats pour voir si votre structure correspond
-- à la structure attendue dans le JSON fourni.