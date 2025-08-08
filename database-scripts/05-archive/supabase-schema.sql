-- ================================================
-- SCRIPT SQL POUR SUPABASE - FailDaily Database
-- ================================================
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query

-- ================================================
-- 1. TABLE PROFILES (Profils utilisateurs)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    stats JSONB DEFAULT '{"totalFails": 0, "couragePoints": 0, "badges": []}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- ================================================
-- 2. TABLE FAILS (Les fails partagés)
-- ================================================
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

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS fails_user_id_idx ON public.fails(user_id);
CREATE INDEX IF NOT EXISTS fails_category_idx ON public.fails(category);
CREATE INDEX IF NOT EXISTS fails_created_at_idx ON public.fails(created_at DESC);
CREATE INDEX IF NOT EXISTS fails_public_idx ON public.fails(is_public, created_at DESC);

-- ================================================
-- 3. TABLE BADGES (Badges débloqués par les utilisateurs)
-- ================================================
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('courage', 'humour', 'entraide', 'perseverance', 'special')),
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les badges
CREATE INDEX IF NOT EXISTS badges_user_id_idx ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS badges_category_idx ON public.badges(category);
CREATE INDEX IF NOT EXISTS badges_rarity_idx ON public.badges(rarity);

-- ================================================
-- 4. TABLE REACTIONS (Réactions aux fails)
-- ================================================
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('courage', 'empathy', 'laugh', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fail_id, user_id, reaction_type)
);

-- Index pour les réactions
CREATE INDEX IF NOT EXISTS reactions_fail_id_idx ON public.reactions(fail_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON public.reactions(user_id);

-- ================================================
-- 5. TABLE COMMENTS (Commentaires sur les fails)
-- ================================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fail_id UUID REFERENCES public.fails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_encouragement BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les commentaires
CREATE INDEX IF NOT EXISTS comments_fail_id_idx ON public.comments(fail_id, created_at);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);

-- ================================================
-- 6. FONCTIONS ET TRIGGERS
-- ================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_fails_updated_at 
    BEFORE UPDATE ON public.fails 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON public.comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 7. RLS (Row Level Security) Policies
-- ================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies pour PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies pour FAILS
CREATE POLICY "Anyone can view public fails" ON public.fails FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own fails" ON public.fails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create fails" ON public.fails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fails" ON public.fails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fails" ON public.fails FOR DELETE USING (auth.uid() = user_id);

-- Policies pour BADGES
CREATE POLICY "Users can view all badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "System can create badges" ON public.badges FOR INSERT WITH CHECK (true);

-- Policies pour REACTIONS
CREATE POLICY "Anyone can view reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can create reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- Policies pour COMMENTS
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 8. STORAGE BUCKETS (pour les images)
-- ================================================

-- Bucket pour les avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- Bucket pour les images de fails
INSERT INTO storage.buckets (id, name, public) VALUES ('fails', 'fails', true);

-- Policies pour le storage
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Fail images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'fails');
CREATE POLICY "Users can upload fail images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- 9. DONNÉES DE TEST (OPTIONNEL)
-- ================================================

-- Exemples de fails de démo (optionnel)
-- Ces données peuvent être ajoutées pour tester l'application
-- Remplacez 'your-user-id' par un vrai UUID utilisateur après inscription

/*
INSERT INTO public.fails (user_id, title, description, category, is_public) VALUES
('00000000-0000-0000-0000-000000000000', 'Raté ma présentation', 'J''ai complètement oublié mes mots pendant ma présentation importante...', 'courage', true),
('00000000-0000-0000-0000-000000000000', 'Cuisine désastreuse', 'Ma tarte aux pommes a fini par ressembler à une pizza brûlée 😅', 'humour', true),
('00000000-0000-0000-0000-000000000000', 'Première fois au sport', 'Premier jour de running, j''ai tenu... 2 minutes ! Mais j''y retourne demain 💪', 'perseverance', true);
*/

-- ================================================
-- SCRIPT TERMINÉ
-- ================================================
-- Après avoir exécuté ce script dans Supabase:
-- 1. Vérifiez que toutes les tables sont créées
-- 2. Testez l'inscription d'un utilisateur
-- 3. Vérifiez que le profil est créé automatiquement
-- 4. Testez l'upload d'images si nécessaire
