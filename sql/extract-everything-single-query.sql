-- ================================================
-- EXTRACTION COMPLÈTE DE TOUTES LES DONNÉES
-- ================================================
-- Cette requête extrait absolutement toutes les données
-- de toutes les tables de votre application FailDaily
-- ================================================

\echo '=== DÉBUT EXTRACTION COMPLÈTE ==='

-- 1. BADGE_DEFINITIONS
\echo 'Extraction des badge_definitions...'
COPY (
    SELECT 
        'INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id) || ', ' ||
            QUOTE_LITERAL(name) || ', ' ||
            QUOTE_LITERAL(description) || ', ' ||
            QUOTE_LITERAL(icon) || ', ' ||
            QUOTE_LITERAL(category) || ', ' ||
            QUOTE_LITERAL(rarity) || ', ' ||
            QUOTE_LITERAL(requirement_type) || ', ' ||
            requirement_value || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM badge_definitions
) TO STDOUT;

-- 2. PROFILES  
\echo 'Extraction des profiles...'
COPY (
    SELECT 
        'INSERT INTO profiles (id, email, username, display_name, avatar_url, bio, email_confirmed, registration_completed, stats, preferences, legal_consent, age_verification, created_at, updated_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(email) || ', ' ||
            QUOTE_LITERAL(username) || ', ' ||
            QUOTE_LITERAL(display_name) || ', ' ||
            COALESCE(QUOTE_LITERAL(avatar_url), 'NULL') || ', ' ||
            COALESCE(QUOTE_LITERAL(bio), 'NULL') || ', ' ||
            email_confirmed || ', ' ||
            registration_completed || ', ' ||
            QUOTE_LITERAL(stats::jsonb) || '::jsonb, ' ||
            QUOTE_LITERAL(preferences::jsonb) || '::jsonb, ' ||
            QUOTE_LITERAL(legal_consent::jsonb) || '::jsonb, ' ||
            QUOTE_LITERAL(age_verification::jsonb) || '::jsonb, ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz, ' ||
            QUOTE_LITERAL(updated_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM profiles
) TO STDOUT;

-- 3. FAILS
\echo 'Extraction des fails...'
COPY (
    SELECT 
        'INSERT INTO fails (id, user_id, title, description, category, image_url, is_public, reactions, comments_count, created_at, updated_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(user_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(title) || ', ' ||
            QUOTE_LITERAL(description) || ', ' ||
            QUOTE_LITERAL(category) || ', ' ||
            COALESCE(QUOTE_LITERAL(image_url), 'NULL') || ', ' ||
            is_public || ', ' ||
            QUOTE_LITERAL(reactions::jsonb) || '::jsonb, ' ||
            comments_count || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz, ' ||
            QUOTE_LITERAL(updated_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM fails
) TO STDOUT;

-- 4. USER_BADGES
\echo 'Extraction des user_badges...'
COPY (
    SELECT 
        'INSERT INTO user_badges (id, user_id, badge_id, created_at, unlocked_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(user_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(badge_id) || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz, ' ||
            QUOTE_LITERAL(unlocked_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM user_badges
) TO STDOUT;

-- 5. REACTIONS
\echo 'Extraction des reactions...'
COPY (
    SELECT 
        'INSERT INTO reactions (id, user_id, fail_id, reaction_type, created_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(user_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(fail_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(reaction_type) || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM reactions
) TO STDOUT;

-- 6. BADGES
\echo 'Extraction des badges...'
COPY (
    SELECT 
        'INSERT INTO badges (id, user_id, name, description, icon, category, badge_type, rarity, created_at, unlocked_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(user_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(name) || ', ' ||
            QUOTE_LITERAL(description) || ', ' ||
            QUOTE_LITERAL(icon) || ', ' ||
            QUOTE_LITERAL(category) || ', ' ||
            QUOTE_LITERAL(badge_type) || ', ' ||
            QUOTE_LITERAL(rarity) || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz, ' ||
            QUOTE_LITERAL(unlocked_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM badges
) TO STDOUT;

-- 7. COMMENTS
\echo 'Extraction des comments...'
COPY (
    SELECT 
        'INSERT INTO comments (id, user_id, fail_id, content, created_at, updated_at) VALUES ' ||
        STRING_AGG(
            '(' || 
            QUOTE_LITERAL(id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(user_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(fail_id::uuid) || '::uuid, ' ||
            QUOTE_LITERAL(content) || ', ' ||
            QUOTE_LITERAL(created_at::timestamptz) || '::timestamptz, ' ||
            QUOTE_LITERAL(updated_at::timestamptz) || '::timestamptz)',
            ', '
        ) || ';'
    FROM comments
    WHERE EXISTS (SELECT 1 FROM comments)
) TO STDOUT;

\echo '=== FIN EXTRACTION COMPLÈTE ==='
\echo 'Toutes les données ont été extraites avec succès !'
