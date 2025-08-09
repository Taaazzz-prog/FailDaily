-- Script pour corriger les permissions RLS sur user_badges
-- PROBLÈME: Erreur 403 lors de l'accès à user_badges

-- 1. VÉRIFIER les politiques RLS actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_badges';

-- 2. CORRIGER les politiques RLS pour user_badges
-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can update their own badges" ON user_badges;

-- Créer les nouvelles politiques correctes
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert badges for users" ON user_badges
    FOR INSERT WITH CHECK (true);

-- 3. VÉRIFIER que RLS est activé
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 4. TEST: Vérifier l'accès pour l'utilisateur test
SELECT 
    'TEST ACCESS' as test_type,
    COUNT(*) as badge_count
FROM user_badges 
WHERE user_id = 'b64524ba-9daa-4fe7-8372-a9e94402ab83';

-- 5. DIAGNOSTIC: Vérifier les permissions de la table
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'user_badges';