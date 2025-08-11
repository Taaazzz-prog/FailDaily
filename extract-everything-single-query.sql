-- =====================================================
-- UNE SEULE REQUÊTE POUR TOUT EXTRAIRE
-- =====================================================

-- Exécutez cette requête UNIQUE dans votre Supabase distant
-- Elle va sortir TOUS les INSERT statements d'un coup

WITH data_extraction AS (
  -- Badge definitions
  SELECT 1 as ordre, 'badge_definitions' as table_name,
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
    ) || ';' as sql_insert
  FROM badge_definitions
  
  UNION ALL
  
  -- Profiles
  SELECT 2 as ordre, 'profiles' as table_name,
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
      quote_literal(created_at::text) || '::timestamptz, ' ||
      quote_literal(updated_at::text) || '::timestamptz' ||
      ')',
      ', '
    ) || ';' as sql_insert
  FROM profiles
  WHERE id IS NOT NULL
  
  UNION ALL
  
  -- Fails
  SELECT 3 as ordre, 'fails' as table_name,
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
    ) || ';' as sql_insert
  FROM fails
  
  UNION ALL
  
  -- User badges
  SELECT 4 as ordre, 'user_badges' as table_name,
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
    ) || ';' as sql_insert
  FROM user_badges
  
  UNION ALL
  
  -- Reactions
  SELECT 5 as ordre, 'reactions' as table_name,
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
    ) || ';' as sql_insert
  FROM reactions
  
  UNION ALL
  
  -- Comments
  SELECT 6 as ordre, 'comments' as table_name,
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
    ) || ';' as sql_insert
  FROM comments
  
  UNION ALL
  
  -- Badges
  SELECT 7 as ordre, 'badges' as table_name,
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
    ) || ';' as sql_insert
  FROM badges
)
SELECT 
  '-- ===== TABLE: ' || table_name || ' ===== ' as separator,
  sql_insert
FROM data_extraction 
ORDER BY ordre;
