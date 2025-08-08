-- Création de la table user_badges pour gérer les badges débloqués
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(user_id, badge_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- Activer RLS (Row Level Security)
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Politique RLS: les utilisateurs ne peuvent voir que leurs propres badges
CREATE POLICY "Users can only see their own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Politique RLS: permettre l'insertion de badges (généralement fait par le système)
CREATE POLICY "Allow badge insertion" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Commentaires pour la documentation
COMMENT ON TABLE public.user_badges IS 'Table pour stocker les badges débloqués par chaque utilisateur';
COMMENT ON COLUMN public.user_badges.user_id IS 'Référence à l''utilisateur qui a débloqué le badge';
COMMENT ON COLUMN public.user_badges.badge_id IS 'Identifiant du badge (correspond aux IDs définis dans BadgeService)';
COMMENT ON COLUMN public.user_badges.unlocked_at IS 'Date et heure de débloquage du badge';
