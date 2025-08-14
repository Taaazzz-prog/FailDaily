-- Script pour créer la table 'follows' et les politiques RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- Création de la table follows
CREATE TABLE IF NOT EXISTS follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Contrainte pour éviter qu'un utilisateur se suive lui-même
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    
    -- Contrainte unique pour éviter les doublons
    CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Activation de Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir les relations de suivi publiques
CREATE POLICY "Les utilisateurs peuvent voir les relations de suivi" ON follows
    FOR SELECT USING (true);

-- Politique pour permettre aux utilisateurs authentifiés de suivre d'autres utilisateurs
CREATE POLICY "Les utilisateurs peuvent suivre d'autres utilisateurs" ON follows
    FOR INSERT WITH CHECK (
        auth.uid() = follower_id AND
        follower_id != following_id
    );

-- Politique pour permettre aux utilisateurs de se désabonner
CREATE POLICY "Les utilisateurs peuvent se désabonner" ON follows
    FOR DELETE USING (
        auth.uid() = follower_id
    );

-- Commentaires pour la documentation
COMMENT ON TABLE follows IS 'Table pour gérer les relations de suivi entre utilisateurs';
COMMENT ON COLUMN follows.follower_id IS 'ID de l''utilisateur qui suit';
COMMENT ON COLUMN follows.following_id IS 'ID de l''utilisateur qui est suivi';
COMMENT ON CONSTRAINT no_self_follow ON follows IS 'Empêche un utilisateur de se suivre lui-même';
COMMENT ON CONSTRAINT unique_follow ON follows IS 'Empêche les relations de suivi en double';
