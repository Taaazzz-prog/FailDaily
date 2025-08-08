-- =========================================
-- SCRIPT DE RÉCUPÉRATION COMPLÈTE - FailDaily
-- =========================================
-- Ce script reconstitue INTÉGRALEMENT la base de données FailDaily
-- avec TOUTES les structures, données et fonctionnalités originales
-- 
-- ATTENTION : Ce script remplace complètement la base de données
-- Exécuter dans l'ordre dans Supabase SQL Editor

-- =========================================
-- 1. SUPPRIMER TOUTES LES STRUCTURES EXISTANTES
-- =========================================

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup_trigger ON auth.users;
DROP TRIGGER IF EXISTS trigger_check_badges_on_fail ON public.fails;
DROP TRIGGER IF EXISTS trigger_check_badges_on_reaction ON public.reactions;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_fails_updated_at ON public.fails;
DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS create_profile_on_signup();
DROP FUNCTION IF EXISTS create_profile_manually(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_user_registration(UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS check_user_registration_status(UUID);
DROP FUNCTION IF EXISTS validate_legal_consent(JSONB);
DROP FUNCTION IF EXISTS validate_age_verification(JSONB);
DROP FUNCTION IF EXISTS complete_registration(UUID, JSONB, JSONB);
DROP FUNCTION IF EXISTS check_registration_status(UUID);
DROP FUNCTION IF EXISTS public.check_and_unlock_badges();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Supprimer les vues
DROP VIEW IF EXISTS user_profiles_complete;

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badge_definitions CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.fails CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Supprimer les buckets storage
DELETE FROM storage.buckets WHERE id IN ('avatars', 'fails');

-- =========================================
-- 2. CRÉER LA TABLE PROFILES COMPLÈTE
-- =========================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    stats JSONB DEFAULT '{"totalFails": 0, "couragePoints": 0, "badges": []}',
    preferences JSONB DEFAULT '{}',
    
    -- Colonnes légales
    legal_consent JSONB DEFAULT NULL,
    age_verification JSONB DEFAULT NULL,
    email_confirmed BOOLEAN DEFAULT FALSE,
    registration_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX profiles_username_idx ON public.profiles(username);
CREATE INDEX profiles_email_idx ON public.profiles(email);
CREATE INDEX idx_profiles_legal_consent ON public.profiles USING GIN (legal_consent);
CREATE INDEX idx_profiles_age_verification ON public.profiles USING GIN (age_verification);

-- =========================================
-- 3. CRÉER LA TABLE FAILS COMPLÈTE
-- =========================================

CREATE TABLE public.fails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('courage', 'humour', 'entraide', 'perseverance', 'special')),
    image_url TEXT,
    reactions JSONB DEFAULT '{"courage": 0, "empathy": 0, "laugh": 0, "support": 0}',
    comments_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX fails_user_id_idx ON public.fails(user_id);
CREATE INDEX fails_category_idx ON public.fails(category);
CREATE INDEX fails_created_at_idx ON public.fails(created_at DESC);
CREATE INDEX fails_public_idx ON public.fails(is_public, created_at DESC);

-- =========================================
-- 4. CRÉER LA TABLE BADGES COMPLÈTE
-- =========================================

CREATE TABLE public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('COURAGE', 'HUMOUR', 'ENTRAIDE', 'PERSEVERANCE', 'SPECIAL', 'RESILIENCE')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Index pour les badges
CREATE INDEX badges_user_id_idx ON public.badges(user_id);
CREATE INDEX badges_category_idx ON public.badges(category);
CREATE INDEX badges_rarity_idx ON public.badges(rarity);
CREATE INDEX idx_badges_user_badge ON public.badges(user_id, badge_type);
CREATE INDEX idx_badges_unlocked_at ON public.badges(unlocked_at);

-- =========================================
-- 5. CRÉER LA TABLE BADGE_DEFINITIONS COMPLÈTE
-- =========================================

CREATE TABLE public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index pour optimiser les performances
CREATE INDEX idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX idx_badge_definitions_rarity ON public.badge_definitions(rarity);

-- =========================================
-- 6. CRÉER LA TABLE REACTIONS COMPLÈTE
-- =========================================

CREATE TABLE public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('courage', 'empathy', 'laugh', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fail_id, user_id, reaction_type)
);

-- Index pour les réactions
CREATE INDEX reactions_fail_id_idx ON public.reactions(fail_id);
CREATE INDEX reactions_user_id_idx ON public.reactions(user_id);

-- =========================================
-- 7. CRÉER LA TABLE COMMENTS COMPLÈTE
-- =========================================

CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_encouragement BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les commentaires
CREATE INDEX comments_fail_id_idx ON public.comments(fail_id, created_at);
CREATE INDEX comments_user_id_idx ON public.comments(user_id);

-- =========================================
-- 8. INSÉRER TOUS LES BADGES ORIGINAUX (50+ badges)
-- =========================================

INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES

-- === BADGES COURAGE (11 badges) ===
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1),
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'rare', 'reactions_received', 50),
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'epic', 'reactions_received', 100),
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'trophy-outline', 'COURAGE', 'legendary', 'reactions_received', 500),
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10),
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 25),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', 50),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', 100),
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365),

-- === BADGES PERSEVERANCE (10 badges) ===
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', 3),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', 7),
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', 14),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', 30),
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', 60),
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', 100),
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 365),
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'PERSEVERANCE', 'rare', 'comeback_count', 1),
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', 5),
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'PERSEVERANCE', 'legendary', 'resilience_count', 10),

-- === BADGES HUMOUR (8 badges) ===
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 25),
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', 50),
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', 100),
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500),
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laughs', 100),
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laughs', 500),
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laughs', 1000),
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme "drôles"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', 50),

-- === BADGES ENTRAIDE (9 badges) ===
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_given', 50),
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d''empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_given', 25),
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', 10),
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', 25),
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', 100),
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', 250),
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', 6),
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', 1000),
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', 100),

-- === BADGES RESILIENCE (7 badges) ===
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', 1),
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', 5),
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', 20),
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', 10),
('unbreakable', 'Incassable', 'Maintenir un état d''esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', 100),
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50),
('inspiration', 'Source d''Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', 100),

-- === BADGES SPECIAL (8 badges) ===
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000),
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', 1),
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l''anniversaire de l''app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', 1),
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fail', 1),
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fail', 1),
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', 50),
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', 5),
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', 10),

-- === BADGES ENGAGEMENT (5 badges) ===
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', 50),
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', 25),
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', 5),
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', 100),
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l''app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', 10)

ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 9. CRÉER TOUTES LES FONCTIONS ORIGINALES
-- =========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Fonction pour valider la structure du consentement légal
CREATE OR REPLACE FUNCTION validate_legal_consent(consent JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF consent IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF NOT (
        consent ? 'documentsAccepted' AND
        consent ? 'consentDate' AND
        consent ? 'consentVersion' AND
        consent ? 'marketingOptIn'
    ) THEN
        RETURN FALSE;
    END IF;
    
    IF NOT (
        jsonb_typeof(consent->'documentsAccepted') = 'array' AND
        consent->'documentsAccepted' @> '["terms-of-service"]'::jsonb
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider la vérification d'âge
CREATE OR REPLACE FUNCTION validate_age_verification(age_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    IF age_data IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF NOT (
        age_data ? 'birthDate' AND
        age_data ? 'isMinor' AND
        age_data ? 'needsParentalConsent'
    ) THEN
        RETURN FALSE;
    END IF;
    
    IF (age_data->>'needsParentalConsent')::boolean = true THEN
        IF NOT (age_data ? 'parentEmail' AND age_data->>'parentEmail' != '') THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        username, 
        display_name, 
        email,
        created_at,
        updated_at,
        email_confirmed,
        registration_completed,
        stats,
        preferences
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
        NEW.email,
        NOW(),
        NOW(),
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
        FALSE,
        '{"totalFails": 0, "couragePoints": 0, "badges": []}',
        '{}'
    );
    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Fonction pour créer un profil manuellement
CREATE OR REPLACE FUNCTION create_profile_manually(
    user_id UUID,
    user_email TEXT,
    username TEXT
)
RETURNS JSONB AS $$
DECLARE
    new_profile profiles%ROWTYPE;
BEGIN
    INSERT INTO profiles (
        id,
        username,
        email,
        display_name,
        email_confirmed,
        registration_completed,
        created_at,
        updated_at,
        stats,
        preferences
    )
    VALUES (
        user_id,
        username,
        user_email,
        username,
        true,
        false,
        NOW(),
        NOW(),
        '{"totalFails": 0, "couragePoints": 0, "badges": []}',
        '{}'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, profiles.username),
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
        updated_at = NOW()
    RETURNING * INTO new_profile;

    RETURN row_to_json(new_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error creating profile: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour finaliser l'inscription avec les données légales
CREATE OR REPLACE FUNCTION complete_user_registration(
    user_id UUID,
    legal_consent_data JSONB,
    age_verification_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    updated_profile profiles%ROWTYPE;
BEGIN
    UPDATE profiles
    SET
        legal_consent = legal_consent_data,
        age_verification = age_verification_data,
        registration_completed = TRUE,
        updated_at = NOW()
    WHERE id = user_id
    RETURNING * INTO updated_profile;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
    END IF;

    RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error completing registration: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier le statut de l'inscription
CREATE OR REPLACE FUNCTION check_user_registration_status(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    profile_data profiles%ROWTYPE;
    result JSONB;
BEGIN
    SELECT * INTO profile_data FROM profiles WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'exists', false,
            'hasLegalConsent', false,
            'hasAgeVerification', false,
            'registrationCompleted', false
        );
    END IF;

    result := jsonb_build_object(
        'exists', true,
        'hasLegalConsent', (profile_data.legal_consent IS NOT NULL),
        'hasAgeVerification', (profile_data.age_verification IS NOT NULL),
        '