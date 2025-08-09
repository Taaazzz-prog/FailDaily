-- Script pour corriger les badges en double et ajouter les badges manquants
-- PROBLÈME: L'utilisateur a des doublons de badges au lieu des bons badges pour ses 8 fails

-- 1. DIAGNOSTIC: Voir les doublons actuels
SELECT 
    user_id,
    badge_id,
    COUNT(*) as count,
    MIN(unlocked_at) as first_unlock,
    MAX(unlocked_at) as last_unlock
FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
GROUP BY user_id, badge_id
ORDER BY badge_id;

-- 2. NETTOYAGE: Supprimer tous les doublons en gardant seulement le premier
DELETE FROM user_badges 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, badge_id) id
    FROM user_badges 
    ORDER BY user_id, badge_id, unlocked_at ASC
);

-- 3. VÉRIFICATION: Voir l'état après nettoyage
SELECT 
    user_id,
    badge_id,
    unlocked_at
FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
ORDER BY unlocked_at;

-- 4. CORRECTION: Ajouter les badges manquants pour 8 fails
-- L'utilisateur avec 8 fails devrait avoir: first-fail, fails-5
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
VALUES 
    ('b64524ba-9daa-4fe7-8372-a9e94402ab83', 'fails-5', NOW())
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. VÉRIFICATION FINALE: État correct des badges
SELECT 
    ub.user_id,
    ub.badge_id,
    ub.unlocked_at,
    CASE 
        WHEN ub.badge_id = 'first-fail' THEN 'Premier Courage'
        WHEN ub.badge_id = 'first-reaction' THEN 'Première Réaction'
        WHEN ub.badge_id = 'fails-5' THEN 'Apprenti Courage'
        WHEN ub.badge_id = 'fails-10' THEN 'Courageux'
        ELSE ub.badge_id
    END as badge_name
FROM user_badges ub
WHERE ub.user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
ORDER BY ub.unlocked_at;

-- 6. NETTOYAGE GLOBAL: Supprimer tous les doublons pour tous les utilisateurs
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, badge_id ORDER BY unlocked_at ASC) as rn
    FROM user_badges
)
DELETE FROM user_badges 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 7. RAPPORT FINAL: État de tous les utilisateurs après correction
SELECT 
    u.email,
    COUNT(f.id) as total_fails,
    COUNT(r.id) as total_reactions_given,
    COUNT(DISTINCT ub.badge_id) as unique_badges,
    STRING_AGG(DISTINCT ub.badge_id, ', ' ORDER BY ub.badge_id) as badges_list
FROM auth.users u
LEFT JOIN fails f ON f.user_id = u.id
LEFT JOIN reactions r ON r.user_id = u.id
LEFT JOIN user_badges ub ON ub.user_id = u.id
WHERE u.email = 'test@test.fr'
GROUP BY u.id, u.email;