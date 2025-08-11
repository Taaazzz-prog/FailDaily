-- =====================================================
-- RECREATION COMPLETE DE LA BASE FAILDAILY DISTANTE
-- =====================================================

-- 1. Supprimer toutes les tables existantes (pour repartir à zéro)
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.fails CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badge_definitions CASCADE;
DROP TABLE IF EXISTS public.user_profiles_complete CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Créer toutes les tables avec la structure exacte du distant
-- =====================================================

-- Table: badge_definitions
CREATE TABLE public.badge_definitions (
    description text NOT NULL, 
    name text NOT NULL, 
    id text NOT NULL PRIMARY KEY, 
    requirement_type text NOT NULL, 
    requirement_value integer NOT NULL DEFAULT 1, 
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()), 
    category text NOT NULL, 
    icon text NOT NULL, 
    rarity text NOT NULL
);

-- Table: profiles
CREATE TABLE public.profiles (
    email_confirmed boolean DEFAULT false, 
    created_at timestamp without time zone DEFAULT now(), 
    updated_at timestamptz DEFAULT now(), 
    stats jsonb DEFAULT '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, 
    preferences jsonb DEFAULT '{}'::jsonb, 
    legal_consent jsonb, 
    age_verification jsonb, 
    registration_completed boolean DEFAULT false, 
    username text, 
    email text, 
    display_name text, 
    avatar_url text, 
    bio text, 
    id uuid NOT NULL PRIMARY KEY
);

-- Table: fails
CREATE TABLE public.fails (
    reactions jsonb DEFAULT '{"laugh": 0, "courage": 0, "empathy": 0, "support": 0}'::jsonb, 
    user_id uuid NOT NULL, 
    comments_count integer DEFAULT 0, 
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, 
    image_url text, 
    category text NOT NULL, 
    description text NOT NULL, 
    title text NOT NULL, 
    is_public boolean DEFAULT true, 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now()
);

-- Table: badges
CREATE TABLE public.badges (
    unlocked_at timestamptz DEFAULT now(), 
    created_at timestamptz DEFAULT now(), 
    icon text NOT NULL, 
    description text NOT NULL, 
    name text NOT NULL, 
    rarity text NOT NULL, 
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, 
    category text NOT NULL, 
    badge_type text NOT NULL, 
    user_id uuid NOT NULL
);

-- Table: reactions
CREATE TABLE public.reactions (
    reaction_type text NOT NULL, 
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, 
    user_id uuid NOT NULL, 
    fail_id uuid NOT NULL, 
    created_at timestamptz DEFAULT now()
);

-- Table: comments
CREATE TABLE public.comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, 
    fail_id uuid NOT NULL, 
    user_id uuid NOT NULL, 
    is_encouragement boolean DEFAULT true, 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now(), 
    content text NOT NULL
);

-- Table: user_badges
CREATE TABLE public.user_badges (
    created_at timestamptz DEFAULT now(), 
    badge_id varchar(50) NOT NULL, 
    user_id uuid NOT NULL, 
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, 
    unlocked_at timestamptz DEFAULT now()
);

-- Table: user_profiles_complete (vue/table complète)
CREATE TABLE public.user_profiles_complete (
    age_verification jsonb, 
    bio text, 
    id uuid, 
    email_confirmed boolean, 
    registration_completed boolean, 
    is_currently_minor boolean, 
    calculated_age numeric, 
    avatar_url text, 
    preferences jsonb, 
    legal_compliance_status text, 
    legal_consent jsonb, 
    updated_at timestamptz, 
    created_at timestamp without time zone, 
    stats jsonb, 
    username text, 
    display_name text, 
    email text
);

-- 3. Ajout des contraintes de clés étrangères
-- =====================================================

-- Fails référencent profiles
ALTER TABLE public.fails ADD CONSTRAINT fails_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Badges référencent profiles
ALTER TABLE public.badges ADD CONSTRAINT badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reactions référencent fails et profiles
ALTER TABLE public.reactions ADD CONSTRAINT reactions_fail_id_fkey 
    FOREIGN KEY (fail_id) REFERENCES public.fails(id) ON DELETE CASCADE;
ALTER TABLE public.reactions ADD CONSTRAINT reactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Comments référencent fails et profiles
ALTER TABLE public.comments ADD CONSTRAINT comments_fail_id_fkey 
    FOREIGN KEY (fail_id) REFERENCES public.fails(id) ON DELETE CASCADE;
ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- User_badges référencent profiles et badge_definitions
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_badge_id_fkey 
    FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id) ON DELETE CASCADE;

-- 4. Création des index pour optimiser les performances
-- =====================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_fails_user_id ON public.fails(user_id);
CREATE INDEX idx_fails_created_at ON public.fails(created_at DESC);
CREATE INDEX idx_fails_category ON public.fails(category);
CREATE INDEX idx_reactions_fail_id ON public.reactions(fail_id);
CREATE INDEX idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX idx_comments_fail_id ON public.comments(fail_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_badges_user_id ON public.badges(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);

-- 5. Politiques RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Politiques pour fails
CREATE POLICY "Public fails are viewable by everyone" ON public.fails
    FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own fails" ON public.fails
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fails" ON public.fails
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fails" ON public.fails
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour reactions
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own reactions" ON public.reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reactions" ON public.reactions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour comments
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour badges
CREATE POLICY "Badges are viewable by everyone" ON public.badges
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour user_badges
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
    FOR SELECT USING (true);
CREATE POLICY "Users can insert own user_badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour badge_definitions (lecture publique)
CREATE POLICY "Badge definitions are viewable by everyone" ON public.badge_definitions
    FOR SELECT USING (true);

-- 6. Fonctions utilitaires
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Triggers pour mettre à jour updated_at automatiquement
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.fails
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 7. Données de test pour badge_definitions
-- =====================================================

INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
    ('first_fail', 'Premier Échec', 'A publié son premier échec', 'trophy', 'milestone', 'common', 'post_count', 1),
    ('courage_warrior', 'Guerrier du Courage', '10 échecs publiés avec courage', 'shield', 'courage', 'uncommon', 'post_count', 10),
    ('support_master', 'Maître du Soutien', 'A donné 50 réactions de soutien', 'heart', 'social', 'rare', 'support_given', 50),
    ('weekly_contributor', 'Contributeur Hebdomadaire', '7 jours consécutifs d''activité', 'calendar', 'streak', 'uncommon', 'daily_streak', 7),
    ('fail_legend', 'Légende de l''Échec', '100 échecs partagés', 'crown', 'milestone', 'legendary', 'post_count', 100);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec informations complètes';
COMMENT ON TABLE public.fails IS 'Publications d''échecs partagées par les utilisateurs';
COMMENT ON TABLE public.reactions IS 'Réactions aux échecs (courage, empathie, soutien, rire)';
COMMENT ON TABLE public.comments IS 'Commentaires d''encouragement sur les échecs';
COMMENT ON TABLE public.badges IS 'Badges obtenus par les utilisateurs';
COMMENT ON TABLE public.badge_definitions IS 'Définitions des badges disponibles';
COMMENT ON TABLE public.user_badges IS 'Association utilisateurs-badges avec dates d''obtention';

-- Fin du script
SELECT 'Base de données FailDaily recréée avec succès !' as status;
