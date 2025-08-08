-- Script de diagnostic pour ton système de badges FailDaily
-- Utilise ce script dans Supabase SQL Editor pour vérifier ton système

-- 1. Vérifier la structure de ta table badge_definitions
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'badge_definitions' 
ORDER BY ordinal_position;

-- 2. Compter le nombre total de badges dans ta BDD
SELECT 
    'Total badges' as metric,
    COUNT(*) as count 
FROM badge_definitions;

-- 3. Répartition par catégorie et rareté
SELECT 
    category,
    rarity,
    COUNT(*) as count
FROM badge_definitions 
GROUP BY category, rarity 
ORDER BY category, 
    CASE rarity 
        WHEN 'common' THEN 1 
        WHEN 'rare' THEN 2 
        WHEN 'epic' THEN 3 
        WHEN 'legendary' THEN 4 
    END;

-- 4. Types de requirements utilisés
SELECT 
    requirement_type,
    COUNT(*) as count,
    MIN(requirement_value::int) as min_value,
    MAX(requirement_value::int) as max_value,
    AVG(requirement_value::int) as avg_value
FROM badge_definitions 
GROUP BY requirement_type 
ORDER BY count DESC;

-- 5. Quelques exemples de badges par catégorie
SELECT 
    category,
    name,
    rarity,
    requirement_type,
    requirement_value
FROM badge_definitions 
WHERE id IN (
    SELECT DISTINCT ON (category) id 
    FROM badge_definitions 
    ORDER BY category, rarity
)
ORDER BY category;

-- 6. Si tu as des utilisateurs avec des badges, vérifier la cohérence
-- (décommente si tu as des données utilisateur)
/*
SELECT 
    u.email,
    COUNT(ub.badge_id) as badges_unlocked
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
GROUP BY u.id, u.email
ORDER BY badges_unlocked DESC
LIMIT 10;
*/

-- 7. Badges les plus faciles à débloquer (pour encourager les nouveaux utilisateurs)
SELECT 
    name,
    description,
    category,
    rarity,
    requirement_type,
    requirement_value
FROM badge_definitions 
WHERE requirement_value::int <= 5
ORDER BY requirement_value::int, rarity;

-- 8. Badges les plus difficiles (pour les experts)
SELECT 
    name,
    description,
    category,
    rarity,
    requirement_type,
    requirement_value
FROM badge_definitions 
WHERE requirement_value::int >= 100
ORDER BY requirement_value::int DESC;

-- Résumé final
SELECT 
    '🎯 RÉSUMÉ DE TON SYSTÈME DE BADGES' as info,
    (SELECT COUNT(*) FROM badge_definitions) as total_badges,
    (SELECT COUNT(*) FROM badge_definitions WHERE rarity = 'common') as common_badges,
    (SELECT COUNT(*) FROM badge_definitions WHERE rarity = 'rare') as rare_badges,
    (SELECT COUNT(*) FROM badge_definitions WHERE rarity = 'epic') as epic_badges,
    (SELECT COUNT(*) FROM badge_definitions WHERE rarity = 'legendary') as legendary_badges;
