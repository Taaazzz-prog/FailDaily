-- Script SQL pour créer le système de suivi d'utilisateurs (follows)
-- À exécuter dans Supabase SQL Editor

-- 1. Créer la table follows
CREATE TABLE IF NOT EXISTS "public"."follows" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "follower_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "following_id" UUID NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Contrainte d'unicité pour éviter les doublons
ALTER TABLE "public"."follows" 
ADD CONSTRAINT "unique_follow_relationship" 
UNIQUE ("follower_id", "following_id");

-- 3. Contrainte pour empêcher de se suivre soi-même
ALTER TABLE "public"."follows" 
ADD CONSTRAINT "no_self_follow" 
CHECK ("follower_id" != "following_id");

-- 4. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS "idx_follows_follower_id" ON "public"."follows" ("follower_id");
CREATE INDEX IF NOT EXISTS "idx_follows_following_id" ON "public"."follows" ("following_id");
CREATE INDEX IF NOT EXISTS "idx_follows_created_at" ON "public"."follows" ("created_at");

-- 5. Activer Row Level Security
ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS

-- Politique pour la lecture (tout le monde peut voir les follows)
CREATE POLICY "Anyone can view follows" ON "public"."follows"
FOR SELECT USING (true);

-- Politique pour l'insertion (on ne peut suivre que si on est authentifié)
CREATE POLICY "Users can follow others" ON "public"."follows"
FOR INSERT WITH CHECK (
    "auth"."uid"() IS NOT NULL 
    AND "auth"."uid"() = "follower_id"
);

-- Politique pour la suppression (on ne peut supprimer que ses propres follows)
CREATE POLICY "Users can unfollow" ON "public"."follows"
FOR DELETE USING (
    "auth"."uid"() IS NOT NULL 
    AND "auth"."uid"() = "follower_id"
);

-- 7. Accorder les permissions aux rôles
GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";

-- 8. Fonction utilitaire pour obtenir le nombre de followers
CREATE OR REPLACE FUNCTION get_followers_count(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM "public"."follows"
    WHERE "following_id" = user_id;
$$;

-- 9. Fonction utilitaire pour obtenir le nombre de personnes suivies
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT COUNT(*)::INTEGER
    FROM "public"."follows"
    WHERE "follower_id" = user_id;
$$;

-- 10. Fonction utilitaire pour vérifier si un utilisateur en suit un autre
CREATE OR REPLACE FUNCTION is_following(follower_id UUID, following_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1
        FROM "public"."follows"
        WHERE "follower_id" = is_following.follower_id
        AND "following_id" = is_following.following_id
    );
$$;
