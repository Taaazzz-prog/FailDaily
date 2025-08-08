-- =========================================
-- SCRIPT DE RÉCUPÉRATION MINIMAL - FailDaily
-- =========================================
-- Ce script crée UNIQUEMENT les tables essentielles
-- pour résoudre l'erreur "relation 'public.fails' does not exist"

-- =========================================
-- 1. CRÉER LA TABLE PROFILES
-- =========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    stats JSONB DEFAULT '{"totalFails": 0, "couragePoints": 0, "badges": []}',
    preferences JSONB DEFAULT '{}',
    legal_consent JSONB DEFAULT NULL,
    age_verification JSONB DEFAULT NULL,
    email_confirmed BOOLEAN DEFAULT FALSE,
    registration_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- 2. CRÉER LA TABLE FAILS (ESSENTIELLE)
-- =========================================

CREATE TABLE IF NOT EXISTS public.fails (
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

-- =========================================
-- 3. CRÉER LES AUTRES TABLES NÉCESSAIRES
-- =========================================

CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('courage', 'empathy', 'laugh', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fail_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_encouragement BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badge_definitions (
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

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT REFERENCES public.badge_definitions(id) NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('COURAGE', 'HUMOUR', 'ENTRAIDE', 'PERSEVERANCE', 'SPECIAL', 'RESILIENCE')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- =========================================
-- 4. CRÉER LES INDEX ESSENTIELS
-- =========================================

CREATE INDEX IF NOT EXISTS fails_user_id_idx ON public.fails(user_id);
CREATE INDEX IF NOT EXISTS fails_created_at_idx ON public.fails(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- =========================================
-- 5. ACTIVER RLS (ROW LEVEL SECURITY)
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 6. CRÉER LES POLITIQUES RLS BASIQUES
-- =========================================

-- Politiques pour PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour FAILS
DROP POLICY IF EXISTS "Anyone can view public fails" ON public.fails;
DROP POLICY IF EXISTS "Users can view own fails" ON public.fails;
DROP POLICY IF EXISTS "Users can create fails" ON public.fails;
DROP POLICY IF EXISTS "Users can update own fails" ON public.fails;
DROP POLICY IF EXISTS "Users can delete own fails" ON public.fails;

CREATE POLICY "Anyone can view public fails" ON public.fails FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own fails" ON public.fails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create fails" ON public.fails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fails" ON public.fails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fails" ON public.fails FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour REACTIONS
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can create reactions" ON public.reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.reactions;

CREATE POLICY "Anyone can view reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour COMMENTS
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour BADGES
DROP POLICY IF EXISTS "Users can view all badges" ON public.badges;
DROP POLICY IF EXISTS "System can create badges" ON public.badges;

CREATE POLICY "Users can view all badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "System can create badges" ON public.badges FOR INSERT WITH CHECK (true);

-- Politique pour BADGE_DEFINITIONS
DROP POLICY IF EXISTS "Badge definitions are public" ON public.badge_definitions;
CREATE POLICY "Badge definitions are public" ON public.badge_definitions FOR SELECT USING (true);

-- =========================================
-- 7. INSÉRER QUELQUES BADGES DE BASE
-- =========================================

INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1),
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 8. ACCORDER LES PERMISSIONS
-- =========================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.fails TO authenticated;
GRANT ALL ON public.reactions TO authenticated;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.badges TO authenticated;
GRANT ALL ON public.badge_definitions TO authenticated;

-- =========================================
-- VÉRIFICATION FINALE
-- =========================================

-- Vérifier que la table "fails" existe maintenant
SELECT 
    'VÉRIFICATION' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'fails'
        ) THEN 'Table "fails" créée avec succès ✅'
        ELSE 'Erreur: Table "fails" toujours manquante ❌'
    END as result;

-- Compter les tables créées
SELECT 
    'TABLES CRÉÉES' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'fails', 'reactions', 'badges', 'badge_definitions', 'comments');

-- =========================================
-- SCRIPT TERMINÉ !
-- =========================================
-- La table "fails" et toutes les tables essentielles sont maintenant créées.
-- L'erreur "relation 'public.fails' does not exist" devrait être résolue.