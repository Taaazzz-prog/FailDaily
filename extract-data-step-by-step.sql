-- =====================================================
-- EXTRACTION DES DONNÉES ÉTAPE PAR ÉTAPE
-- Exécutez ces requêtes UNE PAR UNE dans votre Supabase distant
-- =====================================================

-- ÉTAPE 1: Vérifiez combien de données vous avez
-- =====================================================
SELECT 'badge_definitions' as table_name, count(*) as row_count FROM badge_definitions
UNION ALL
SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'fails' as table_name, count(*) as row_count FROM fails
UNION ALL
SELECT 'badges' as table_name, count(*) as row_count FROM badges
UNION ALL
SELECT 'reactions' as table_name, count(*) as row_count FROM reactions
UNION ALL
SELECT 'comments' as table_name, count(*) as row_count FROM comments
UNION ALL
SELECT 'user_badges' as table_name, count(*) as row_count FROM user_badges
ORDER BY row_count DESC;

-- =====================================================
-- ÉTAPE 2: BADGE_DEFINITIONS (VOS 160+ BADGES) - PRIORITÉ ABSOLUE !
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "badge_definitions_insert.sql"

SELECT 
    'INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id) || ', ' ||
        quote_literal(name) || ', ' ||
        quote_literal(description) || ', ' ||
        quote_literal(icon) || ', ' ||
        quote_literal(category) || ', ' ||
        quote_literal(rarity) || ', ' ||
        quote_literal(requirement_type) || ', ' ||
        requirement_value || ', ' ||
        quote_literal(created_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM badge_definitions;

-- =====================================================
-- ÉTAPE 3: PROFILES (TOUS LES UTILISATEURS)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "profiles_insert.sql"

SELECT 
    'INSERT INTO profiles (id, email, username, display_name, avatar_url, bio, email_confirmed, registration_completed, stats, preferences, legal_consent, age_verification, created_at, updated_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        COALESCE(quote_literal(email), 'NULL') || ', ' ||
        COALESCE(quote_literal(username), 'NULL') || ', ' ||
        COALESCE(quote_literal(display_name), 'NULL') || ', ' ||
        COALESCE(quote_literal(avatar_url), 'NULL') || ', ' ||
        COALESCE(quote_literal(bio), 'NULL') || ', ' ||
        COALESCE(email_confirmed::text, 'false') || ', ' ||
        COALESCE(registration_completed::text, 'false') || ', ' ||
        COALESCE(quote_literal(stats::text), 'NULL') || '::jsonb, ' ||
        COALESCE(quote_literal(preferences::text), 'NULL') || '::jsonb, ' ||
        COALESCE(quote_literal(legal_consent::text), 'NULL') || '::jsonb, ' ||
        COALESCE(quote_literal(age_verification::text), 'NULL') || '::jsonb, ' ||
        quote_literal(created_at::text) || '::timestamp, ' ||
        quote_literal(updated_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM profiles
WHERE id IS NOT NULL;

-- =====================================================
-- ÉTAPE 4: FAILS (TOUTES LES PUBLICATIONS)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "fails_insert.sql"

SELECT 
    'INSERT INTO fails (id, user_id, title, description, category, image_url, is_public, reactions, comments_count, created_at, updated_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        quote_literal(user_id::text) || '::uuid, ' ||
        quote_literal(title) || ', ' ||
        quote_literal(description) || ', ' ||
        quote_literal(category) || ', ' ||
        COALESCE(quote_literal(image_url), 'NULL') || ', ' ||
        COALESCE(is_public::text, 'true') || ', ' ||
        COALESCE(quote_literal(reactions::text), 'NULL') || '::jsonb, ' ||
        COALESCE(comments_count::text, '0') || ', ' ||
        quote_literal(created_at::text) || '::timestamptz, ' ||
        quote_literal(updated_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM fails;

-- =====================================================
-- ÉTAPE 5: USER_BADGES (ASSOCIATIONS USER-BADGE)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "user_badges_insert.sql"

SELECT 
    'INSERT INTO user_badges (id, user_id, badge_id, created_at, unlocked_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        quote_literal(user_id::text) || '::uuid, ' ||
        quote_literal(badge_id) || ', ' ||
        quote_literal(created_at::text) || '::timestamptz, ' ||
        quote_literal(unlocked_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM user_badges;

-- =====================================================
-- ÉTAPE 6: REACTIONS (TOUTES LES RÉACTIONS)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "reactions_insert.sql"

SELECT 
    'INSERT INTO reactions (id, user_id, fail_id, reaction_type, created_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        quote_literal(user_id::text) || '::uuid, ' ||
        quote_literal(fail_id::text) || '::uuid, ' ||
        quote_literal(reaction_type) || ', ' ||
        quote_literal(created_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM reactions;

-- =====================================================
-- ÉTAPE 7: COMMENTS (TOUS LES COMMENTAIRES)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "comments_insert.sql"

SELECT 
    'INSERT INTO comments (id, fail_id, user_id, content, is_encouragement, created_at, updated_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        quote_literal(fail_id::text) || '::uuid, ' ||
        quote_literal(user_id::text) || '::uuid, ' ||
        quote_literal(content) || ', ' ||
        COALESCE(is_encouragement::text, 'true') || ', ' ||
        quote_literal(created_at::text) || '::timestamptz, ' ||
        quote_literal(updated_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM comments;

-- =====================================================
-- ÉTAPE 8: BADGES (BADGES OBTENUS PAR LES USERS)
-- =====================================================
-- Copiez ce résultat et sauvegardez-le dans un fichier "badges_insert.sql"

SELECT 
    'INSERT INTO badges (id, user_id, name, description, icon, category, badge_type, rarity, created_at, unlocked_at) VALUES ' ||
    string_agg(
        '(' || 
        quote_literal(id::text) || '::uuid, ' ||
        quote_literal(user_id::text) || '::uuid, ' ||
        quote_literal(name) || ', ' ||
        quote_literal(description) || ', ' ||
        quote_literal(icon) || ', ' ||
        quote_literal(category) || ', ' ||
        quote_literal(badge_type) || ', ' ||
        quote_literal(rarity) || ', ' ||
        quote_literal(created_at::text) || '::timestamptz, ' ||
        quote_literal(unlocked_at::text) || '::timestamptz' ||
        ')',
        ', '
    ) || ';' as insert_statement
FROM badges;
