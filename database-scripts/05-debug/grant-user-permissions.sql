-- Script pour accorder les permissions nécessaires aux utilisateurs authentifiés
-- Les permissions actuelles ne montrent que postgres, il faut ajouter les permissions pour authenticated

-- 1. ACCORDER les permissions de base aux utilisateurs authentifiés
GRANT SELECT, INSERT ON user_badges TO authenticated;
GRANT SELECT ON badge_definitions TO authenticated;
GRANT SELECT ON fails TO authenticated;
GRANT SELECT ON reactions TO authenticated;

-- 2. VÉRIFIER les nouvelles permissions
SELECT 
    grantee, 
    privilege_type,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('user_badges', 'badge_definitions', 'fails', 'reactions')
  AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- 3. VÉRIFIER les politiques RLS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'user_badges'
ORDER BY policyname;

-- 4. TEST FINAL: Essayer d'insérer un badge pour l'utilisateur test
INSERT INTO user_badges (user_id, badge_id, unlocked_at)
VALUES 
    ('b64524ba-9daa-4fe7-8372-a9e94402ab83', 'first-fail', NOW()),
    ('b64524ba-9daa-4fe7-8372-a9e94402ab83', 'first-reaction', NOW())
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- 5. VÉRIFIER le résultat
SELECT 
    user_id,
    badge_id,
    unlocked_at,
    CASE 
        WHEN badge_id = 'first-fail' THEN 'Premier Courage'
        WHEN badge_id = 'first-reaction' THEN 'Première Réaction'
        ELSE badge_id
    END as badge_name
FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83'
ORDER BY unlocked_at;