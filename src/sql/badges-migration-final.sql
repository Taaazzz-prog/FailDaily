-- =============================================
-- SCRIPT DE MIGRATION ADAPTÉ À LA STRUCTURE EXISTANTE
-- =============================================

-- Étape 1: Créer la table badge_definitions
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

-- Étape 2: Insérer les badges de base (Collection complète de 50+ badges)
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

-- Étape 3: Utiliser badge_type comme référence vers badge_definitions
-- (badge_type correspond à l'id dans badge_definitions)
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_badge_type_fkey;
ALTER TABLE public.badges ADD CONSTRAINT badges_badge_type_fkey 
    FOREIGN KEY (badge_type) REFERENCES public.badge_definitions(id);

-- Étape 4: Fonction de vérification automatique des badges (adaptée à la structure existante)
CREATE OR REPLACE FUNCTION public.check_and_unlock_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_record RECORD;
    user_stats RECORD;
BEGIN
    -- Récupérer les statistiques de l'utilisateur
    SELECT 
        COUNT(DISTINCT f.id) as total_fails,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'courage' THEN 1 ELSE 0 END), 0) as courage_hearts,
        COALESCE(SUM(CASE WHEN r.reaction_type = 'laugh' THEN 1 ELSE 0 END), 0) as laugh_reactions,
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
            SELECT badge_type FROM badges WHERE user_id = NEW.user_id AND badge_type IS NOT NULL
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
                ELSE
                    should_unlock := FALSE;
            END CASE;

            IF should_unlock THEN
                -- Utiliser la structure existante de la table badges
                INSERT INTO badges (
                    user_id, 
                    badge_type, 
                    category, 
                    rarity, 
                    name, 
                    description, 
                    icon, 
                    unlocked_at,
                    created_at
                )
                VALUES (
                    NEW.user_id,
                    badge_record.id,          -- badge_type = id du badge_definition
                    badge_record.category,
                    badge_record.rarity,
                    badge_record.name,
                    badge_record.description,
                    badge_record.icon,
                    NOW(),
                    NOW()
                )
                ON CONFLICT (user_id, badge_type) DO NOTHING;
            END IF;
        END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 5: Triggers pour vérification automatique
DROP TRIGGER IF EXISTS trigger_check_badges_on_fail ON public.fails;
CREATE TRIGGER trigger_check_badges_on_fail
    AFTER INSERT ON public.fails
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_unlock_badges();

DROP TRIGGER IF EXISTS trigger_check_badges_on_reaction ON public.reactions;
CREATE TRIGGER trigger_check_badges_on_reaction
    AFTER INSERT OR UPDATE ON public.reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_and_unlock_badges();

-- Étape 6: Contrainte d'unicité pour éviter les doublons
DO $$
BEGIN
    -- Ajouter contrainte unique si elle n'existe pas déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'badges'
        AND constraint_name = 'badges_user_badge_unique'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.badges ADD CONSTRAINT badges_user_badge_unique 
            UNIQUE (user_id, badge_type);
    END IF;
END $$;

-- Étape 7: RLS Policies
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

-- Étape 8: Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_badges_user_badge ON public.badges(user_id, badge_type);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON public.badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_rarity ON public.badge_definitions(rarity);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_unlocked_at ON public.badges(unlocked_at);

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'Migration du système de badges terminée avec succès !';
    RAISE NOTICE 'Structure adaptée : badge_type -> badge_definitions.id';
END $$;
