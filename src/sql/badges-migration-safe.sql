-- =============================================
-- SCRIPT DE MIGRATION SÉCURISÉ - BADGES SYSTÈME
-- =============================================

-- Étape 1: Vérification de la structure existante
DO $$ 
DECLARE
    badges_table_exists BOOLEAN;
    badge_id_column_exists BOOLEAN;
BEGIN
    -- Vérifier si la table badges existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'badges' AND table_schema = 'public'
    ) INTO badges_table_exists;
    
    -- Vérifier si la colonne badge_id existe dans la table badges
    IF badges_table_exists THEN
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_id'
            AND table_schema = 'public'
        ) INTO badge_id_column_exists;
    ELSE
        badge_id_column_exists := FALSE;
    END IF;
    
    RAISE NOTICE 'Table badges existe: %', badges_table_exists;
    RAISE NOTICE 'Colonne badge_id existe: %', badge_id_column_exists;
END $$;

-- Étape 2: Créer la table badge_definitions
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

-- Étape 3: Insérer les badges de base (avec gestion des doublons)
INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1),
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'rare', 'streak_days', 7),
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'trophy-outline', 'PERSEVERANCE', 'epic', 'streak_days', 30),
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10),
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'epic', 'reactions_received', 50),
('courage-hearts-100', 'Légende du Courage', 'Recevoir 100 cœurs de courage', 'heart-outline', 'COURAGE', 'legendary', 'reactions_received', 100),
('community-helper', 'Ange Gardien', 'Aider 25 membres de la communauté', 'people-outline', 'ENTRAIDE', 'legendary', 'help_count', 25),
('funny-fail', 'Roi du Rire', 'Un fail qui a fait rire 50 personnes', 'happy-outline', 'HUMOUR', 'epic', 'laugh_reactions', 50),
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000),
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'rare', 'fail_count', 10),
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'library-outline', 'COURAGE', 'epic', 'fail_count', 50),
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'library-outline', 'COURAGE', 'legendary', 'fail_count', 100),
('supportive-soul', 'Âme Bienveillante', 'Donner 100 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'rare', 'support_given', 100),
('empathy-expert', 'Expert en Empathie', 'Donner 50 réactions d''empathie', 'sad-outline', 'ENTRAIDE', 'epic', 'empathy_given', 50),
('resilience-champion', 'Champion de Résilience', 'Rebondir après 20 fails partagés', 'refresh-outline', 'RESILIENCE', 'epic', 'fail_count', 20)
ON CONFLICT (id) DO NOTHING;

-- Étape 4: Gestion de la table badges
DO $$ 
BEGIN
    -- Si la table badges n'existe pas, la créer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'badges' AND table_schema = 'public'
    ) THEN
        CREATE TABLE public.badges (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            badge_id TEXT NOT NULL REFERENCES public.badge_definitions(id),
            badge_name TEXT NOT NULL,
            badge_description TEXT NOT NULL,
            badge_icon TEXT NOT NULL,
            badge_category TEXT NOT NULL,
            badge_rarity TEXT NOT NULL,
            unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
            UNIQUE(user_id, badge_id)
        );
    ELSE
        -- Si la table existe mais n'a pas la colonne badge_id, l'ajouter
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_id TEXT;
        END IF;
        
        -- Ajouter d'autres colonnes si nécessaires
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_name'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_name TEXT;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_description'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_description TEXT;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_icon'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_icon TEXT;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_category'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_category TEXT;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'badges' 
            AND column_name = 'badge_rarity'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.badges ADD COLUMN badge_rarity TEXT;
        END IF;
    END IF;
END $$;

-- Étape 5: Ajouter les contraintes de clé étrangère seulement après avoir créé/modifié la structure
DO $$
BEGIN
    -- Supprimer l'ancienne contrainte si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'badges' 
        AND constraint_name = 'badges_badge_id_fkey'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.badges DROP CONSTRAINT badges_badge_id_fkey;
    END IF;
    
    -- Ajouter la nouvelle contrainte seulement si la colonne badge_id existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' 
        AND column_name = 'badge_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.badges ADD CONSTRAINT badges_badge_id_fkey 
            FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id);
    END IF;
END $$;

-- Étape 6: RLS Policies
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Politique pour badge_definitions (lecture publique)
DROP POLICY IF EXISTS "Badge definitions are public" ON public.badge_definitions;
CREATE POLICY "Badge definitions are public" ON public.badge_definitions
    FOR SELECT
    USING (true);

-- Politiques pour badges (utilisateur ne peut voir que ses badges)
DROP POLICY IF EXISTS "Users can view their own badges" ON public.badges;
CREATE POLICY "Users can view their own badges" ON public.badges
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badges" ON public.badges;
CREATE POLICY "Users can insert their own badges" ON public.badges
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Étape 7: Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_badges_user_badge ON public.badges(user_id, badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_rarity ON public.badge_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_unlocked_at ON public.badges(unlocked_at);

-- Message de fin
DO $$ 
BEGIN
    RAISE NOTICE 'Migration du système de badges terminée avec succès !';
END $$;
