-- =========================================
-- SCRIPT DE RÉCUPÉRATION COMPLÈTE APRÈS NETTOYAGE TROP AGRESSIF
-- =========================================
-- Date: 8 août 2025
-- Description: Recrée toutes les structures essentielles supprimées par le script de nettoyage

-- 1. RECRÉER LA TABLE PROFILES AVEC TOUTES LES COLONNES NÉCESSAIRES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Colonnes pour les statistiques
    stats JSONB DEFAULT '{"totalFails": 0, "couragePoints": 0, "badges": []}'::jsonb,
    
    -- Colonnes pour les préférences utilisateur
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Colonnes légales
    legal_consent JSONB,
    age_verification JSONB,
    email_confirmed BOOLEAN DEFAULT FALSE,
    registration_completed BOOLEAN DEFAULT FALSE
);

-- 2. CRÉER LA TABLE FAILS
CREATE TABLE IF NOT EXISTS fails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    reactions JSONB DEFAULT '{"courage": 0, "empathy": 0, "laugh": 0, "support": 0}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. CRÉER LA TABLE REACTIONS
CREATE TABLE IF NOT EXISTS reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fail_id UUID REFERENCES fails(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(fail_id, user_id, reaction_type)
);

-- 4. CRÉER LES TABLES POUR LES BADGES
CREATE TABLE IF NOT EXISTS badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    condition_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id TEXT REFERENCES badge_definitions(id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- 5. CRÉER LES INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_legal_consent ON profiles USING GIN (legal_consent);
CREATE INDEX IF NOT EXISTS idx_profiles_age_verification ON profiles USING GIN (age_verification);

CREATE INDEX IF NOT EXISTS idx_fails_user_id ON fails(user_id);
CREATE INDEX IF NOT EXISTS idx_fails_category ON fails(category);
CREATE INDEX IF NOT EXISTS idx_fails_created_at ON fails(created_at);
CREATE INDEX IF NOT EXISTS idx_fails_is_public ON fails(is_public);

CREATE INDEX IF NOT EXISTS idx_reactions_fail_id ON reactions(fail_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- 6. FONCTION POUR CRÉER UN PROFIL MANUELLEMENT
CREATE OR REPLACE FUNCTION create_profile_manually(
    user_id UUID,
    user_email TEXT,
    username TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_profile profiles%ROWTYPE;
BEGIN
    -- Insérer le nouveau profil
    INSERT INTO profiles (
        id,
        username,
        email,
        display_name,
        created_at,
        updated_at,
        stats,
        preferences,
        email_confirmed,
        registration_completed
    ) VALUES (
        user_id,
        username,
        user_email,
        username,
        NOW(),
        NOW(),
        '{"totalFails": 0, "couragePoints": 0, "badges": []}'::jsonb,
        '{}'::jsonb,
        true,
        false
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
    RETURNING * INTO new_profile;

    -- Retourner le profil créé
    RETURN row_to_json(new_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$;

-- 7. FONCTION POUR COMPLÉTER L'INSCRIPTION
CREATE OR REPLACE FUNCTION complete_user_registration(
    user_id UUID,
    legal_consent_data JSONB,
    age_verification_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_profile profiles%ROWTYPE;
BEGIN
    -- Mettre à jour le profil avec les données légales
    UPDATE profiles 
    SET 
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = true,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    -- Vérifier si la mise à jour a réussi
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
    END IF;

    -- Retourner les données du profil mis à jour
    RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error completing registration: %', SQLERRM;
END;
$$;

-- 8. FONCTION POUR VÉRIFIER LE STATUT D'INSCRIPTION
CREATE OR REPLACE FUNCTION check_user_registration_status(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_data profiles%ROWTYPE;
    result JSONB;
BEGIN
    -- Récupérer les données du profil
    SELECT * INTO profile_data FROM profiles WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false,
            'hasLegalConsent', false,
            'hasAgeVerification', false,
            'registrationCompleted', false
        );
    END IF;

    -- Construire le résultat
    result := jsonb_build_object(
        'exists', true,
        'hasLegalConsent', (profile_data.legal_consent IS NOT NULL),
        'hasAgeVerification', (profile_data.age_verification IS NOT NULL),
        'registrationCompleted', COALESCE(profile_data.registration_completed, false),
        'profile', row_to_json(profile_data)
    );

    RETURN result;
END;
$$;

-- 9. ACTIVER RLS ET CRÉER LES POLITIQUES DE SÉCURITÉ
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fails ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour fails
DROP POLICY IF EXISTS "Users can view public fails" ON fails;
DROP POLICY IF EXISTS "Users can view own fails" ON fails;
DROP POLICY IF EXISTS "Users can insert own fails" ON fails;
DROP POLICY IF EXISTS "Users can update own fails" ON fails;

CREATE POLICY "Users can view public fails" ON fails
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own fails" ON fails
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fails" ON fails
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour reactions
DROP POLICY IF EXISTS "Users can view reactions" ON reactions;
DROP POLICY IF EXISTS "Users can insert own reactions" ON reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON reactions;

CREATE POLICY "Users can view reactions" ON reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own reactions" ON reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour user_badges
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "System can insert badges" ON user_badges;

CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. ACCORDER LES PERMISSIONS
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON fails TO authenticated;
GRANT ALL ON reactions TO authenticated;
GRANT ALL ON badge_definitions TO authenticated;
GRANT ALL ON user_badges TO authenticated;

-- Permissions pour les fonctions RPC
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_manually(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registration_status(UUID) TO authenticated;

-- 11. INSÉRER QUELQUES BADGES DE BASE
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, condition_type, condition_value) VALUES
('first_fail', 'Premier Fail', 'Votre premier fail partagé', '🎯', 'milestone', 'common', 'fails_count', 1),
('brave_soul', 'Âme Courageuse', '5 fails partagés', '💪', 'milestone', 'common', 'fails_count', 5),
('fail_master', 'Maître du Fail', '10 fails partagés', '🏆', 'milestone', 'rare', 'fails_count', 10),
('supportive', 'Soutien', '10 réactions données', '❤️', 'social', 'common', 'reactions_given', 10),
('empathetic', 'Empathique', '25 réactions données', '🤗', 'social', 'rare', 'reactions_given', 25)
ON CONFLICT (id) DO NOTHING;

-- 12. COMMENTAIRES POUR DOCUMENTATION
COMMENT ON TABLE profiles IS 'Table des profils utilisateurs avec données légales et préférences';
COMMENT ON TABLE fails IS 'Table des fails partagés par les utilisateurs';
COMMENT ON TABLE reactions IS 'Table des réactions aux fails';
COMMENT ON TABLE badge_definitions IS 'Définitions des badges disponibles';
COMMENT ON TABLE user_badges IS 'Badges débloqués par les utilisateurs';

COMMENT ON FUNCTION create_profile_manually IS 'Fonction pour créer un profil utilisateur manuellement';
COMMENT ON FUNCTION complete_user_registration IS 'Fonction pour finaliser l''inscription avec les données légales';
COMMENT ON FUNCTION check_user_registration_status IS 'Fonction pour vérifier le statut d''inscription';

-- =========================================
-- FIN DU SCRIPT DE RÉCUPÉRATION
-- =========================================

-- Pour vérifier que tout fonctionne :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'fails', 'reactions', 'badge_definitions', 'user_badges');
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('create_profile_manually', 'complete_user_registration', 'check_user_registration_status');