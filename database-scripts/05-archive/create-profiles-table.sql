-- =========================================
-- CRÉATION DE LA TABLE PROFILES - URGENCE
-- =========================================

-- 1. Supprimer la table si elle existe (au cas où)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Créer la table profiles avec TOUS les champs nécessaires
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    email text NOT NULL,
    display_name text NOT NULL,
    avatar_url text,
    bio text DEFAULT '',
    stats jsonb DEFAULT '{}',
    preferences jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW(),
    legal_consent jsonb DEFAULT '{}',
    age_verification jsonb DEFAULT '{}',
    email_confirmed boolean DEFAULT false,
    registration_completed boolean DEFAULT false,
    
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_username_unique UNIQUE (username),
    CONSTRAINT profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$')
);

-- 3. Ajouter les index pour les performances
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- 4. Configurer RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Politique RLS : Les utilisateurs peuvent voir et modifier leur propre profil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Permissions pour le service role (pour les triggers)
GRANT ALL ON public.profiles TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. Restaurer le trigger correct (simplifié)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        username,
        email,
        display_name,
        avatar_url,
        bio,
        stats,
        preferences,
        created_at,
        updated_at,
        legal_consent,
        age_verification,
        email_confirmed,
        registration_completed
    ) VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'display_name',
            SPLIT_PART(NEW.email, '@', 1),
            'user_' || SUBSTRING(NEW.id::text, 1, 8)
        ),
        COALESCE(NEW.email, ''),
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.raw_user_meta_data->>'username',
            SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
            'Utilisateur'
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        '',
        '{}',
        '{}',
        NOW(),
        NOW(),
        COALESCE(NEW.raw_user_meta_data->'legal_consent', '{}'),
        COALESCE(NEW.raw_user_meta_data->'age_verification', '{}'),
        COALESCE((NEW.raw_user_meta_data->>'email_confirmed')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'registration_completed')::boolean, false)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Vérification finale
SELECT 'TABLE PROFILES CRÉÉE AVEC SUCCÈS' as status;
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
