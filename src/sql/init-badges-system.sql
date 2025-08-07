-- =============================================
-- SCRIPT D'INITIALISATION DES BADGES SYSTÈME
-- =============================================

-- Table des définitions de badges (badges disponibles)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirement_type TEXT NOT NULL, -- 'fail_count', 'streak_days', 'reactions_received', etc.
    requirement_value INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insertion des badges de base
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
('resilience-champion', 'Champion de Résilience', 'Rebondir après 20 fails partagés', 'refresh-outline', 'RESILIENCE', 'epic', 'fail_count', 20);

-- Vérifier et modifier la structure de la table badges si nécessaire
-- Ajouter la colonne badge_id si elle n'existe pas
DO $$ 
BEGIN
    -- Vérifier si la colonne badge_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'badges' 
        AND column_name = 'badge_id'
        AND table_schema = 'public'
    ) THEN
        -- Ajouter la colonne badge_id
        ALTER TABLE public.badges ADD COLUMN badge_id TEXT;
        
        -- Mettre à jour les données existantes si nécessaire
        -- (optionnel : mapper les anciens badges vers les nouveaux IDs)
    END IF;
END $$;

-- Modifier la table badges existante pour ajouter des références
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_badge_id_fkey;
ALTER TABLE public.badges ADD CONSTRAINT badges_badge_id_fkey 
    FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id);

-- Fonction pour vérifier automatiquement les nouveaux badges
CREATE OR REPLACE FUNCTION public.check_and_unlock_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    user_stats RECORD;
BEGIN
    -- Récupérer les statistiques de l'utilisateur
    SELECT 
        COUNT(*) as total_fails,
        COALESCE(SUM(CASE WHEN r.type = 'courage' THEN r.count ELSE 0 END), 0) as courage_hearts,
        COALESCE(SUM(CASE WHEN r.type = 'laugh' THEN r.count ELSE 0 END), 0) as laugh_reactions,
        COALESCE(p.current_streak, 0) as current_streak
    INTO user_stats
    FROM fails f
    LEFT JOIN reactions r ON f.id = r.fail_id
    LEFT JOIN profiles p ON f.user_id = p.id
    WHERE f.user_id = NEW.user_id;

    -- Parcourir tous les badges et vérifier les conditions
    FOR badge_record IN 
        SELECT bd.* FROM badge_definitions bd
        WHERE bd.id NOT IN (
            SELECT badge_id FROM badges WHERE user_id = NEW.user_id
        )
    LOOP
        DECLARE
            should_unlock BOOLEAN := FALSE;
        BEGIN
            CASE badge_record.requirement_type
                WHEN 'fail_count' THEN
                    should_unlock := user_stats.total_fails >= badge_record.requirement_value;
                WHEN 'reactions_received' THEN
                    should_unlock := user_stats.courage_hearts >= badge_record.requirement_value;
                WHEN 'laugh_reactions' THEN
                    should_unlock := user_stats.laugh_reactions >= badge_record.requirement_value;
                WHEN 'streak_days' THEN
                    should_unlock := user_stats.current_streak >= badge_record.requirement_value;
                -- Ajouter d'autres conditions selon les besoins
                ELSE
                    should_unlock := FALSE;
            END CASE;

            IF should_unlock THEN
                INSERT INTO badges (user_id, badge_id, badge_name, badge_description, badge_icon, badge_category, badge_rarity, unlocked_at)
                VALUES (
                    NEW.user_id,
                    badge_record.id,
                    badge_record.name,
                    badge_record.description,
                    badge_record.icon,
                    badge_record.category,
                    badge_record.rarity,
                    NOW()
                )
                ON CONFLICT (user_id, badge_id) DO NOTHING;
            END IF;
        END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour vérifier les badges après chaque nouveau fail
DROP TRIGGER IF EXISTS trigger_check_badges_on_fail ON public.fails;
CREATE TRIGGER trigger_check_badges_on_fail
    AFTER INSERT ON public.fails
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_unlock_badges();

-- Trigger pour vérifier les badges après chaque nouvelle réaction
DROP TRIGGER IF EXISTS trigger_check_badges_on_reaction ON public.reactions;
CREATE TRIGGER trigger_check_badges_on_reaction
    AFTER INSERT OR UPDATE ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_unlock_badges();

-- RLS Policies pour badge_definitions
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badge definitions are public" ON public.badge_definitions
    FOR SELECT
    USING (true);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_badges_user_badge ON public.badges(user_id, badge_id);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_rarity ON public.badge_definitions(rarity);

COMMIT;
