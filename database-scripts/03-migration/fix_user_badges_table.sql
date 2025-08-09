-- =========================================
-- CORRECTION DE LA TABLE USER_BADGES
-- =========================================
-- Ce script corrige la table user_badges existante sans créer de doublons

-- =========================================
-- 1. VÉRIFIER L'ÉTAT ACTUEL
-- =========================================

-- Vérifier si la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Table user_badges existe déjà';
    ELSE
        RAISE NOTICE '❌ Table user_badges n''existe pas';
    END IF;
END $$;

-- =========================================
-- 2. CRÉER LA TABLE SI ELLE N'EXISTE PAS
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- 3. AJOUTER LA CONTRAINTE UNIQUE SI ELLE N'EXISTE PAS
-- =========================================

DO $$
BEGIN
    -- Vérifier si la contrainte unique existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_badges' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%user_id%badge_id%'
    ) THEN
        -- Ajouter la contrainte unique
        ALTER TABLE public.user_badges 
        ADD CONSTRAINT user_badges_user_id_badge_id_unique UNIQUE(user_id, badge_id);
        RAISE NOTICE '✅ Contrainte unique ajoutée';
    ELSE
        RAISE NOTICE '✅ Contrainte unique existe déjà';
    END IF;
END $$;

-- =========================================
-- 4. CRÉER LES INDEX SI ILS N'EXISTENT PAS
-- =========================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);

-- =========================================
-- 5. ACTIVER RLS SI PAS DÉJÀ FAIT
-- =========================================

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 6. CRÉER LES POLITIQUES RLS SI ELLES N'EXISTENT PAS
-- =========================================

-- Politique pour SELECT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_badges' 
        AND policyname = 'Users can only see their own badges'
    ) THEN
        CREATE POLICY "Users can only see their own badges" ON public.user_badges
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE '✅ Politique SELECT créée';
    ELSE
        RAISE NOTICE '✅ Politique SELECT existe déjà';
    END IF;
END $$;

-- Politique pour INSERT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_badges' 
        AND policyname = 'Allow badge insertion'
    ) THEN
        CREATE POLICY "Allow badge insertion" ON public.user_badges
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE '✅ Politique INSERT créée';
    ELSE
        RAISE NOTICE '✅ Politique INSERT existe déjà';
    END IF;
END $$;

-- =========================================
-- 7. AJOUTER LES COMMENTAIRES
-- =========================================

COMMENT ON TABLE public.user_badges IS 'Table pour stocker les badges débloqués par chaque utilisateur';
COMMENT ON COLUMN public.user_badges.user_id IS 'Référence à l''utilisateur qui a débloqué le badge';
COMMENT ON COLUMN public.user_badges.badge_id IS 'Identifiant du badge (correspond aux IDs définis dans BadgeService)';
COMMENT ON COLUMN public.user_badges.unlocked_at IS 'Date et heure de débloquage du badge';

-- =========================================
-- 8. VÉRIFICATION FINALE
-- =========================================

SELECT 
    'VÉRIFICATION_FINALE' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_badges' AND table_schema = 'public') 
        THEN '✅ TABLE CRÉÉE/CORRIGÉE'
        ELSE '❌ PROBLÈME AVEC LA TABLE'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_badges')
        THEN '✅ POLITIQUES RLS OK'
        ELSE '❌ POLITIQUES RLS MANQUANTES'
    END as rls_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'user_badges' AND constraint_type = 'UNIQUE')
        THEN '✅ CONTRAINTE UNIQUE OK'
        ELSE '❌ CONTRAINTE UNIQUE MANQUANTE'
    END as constraint_status;

-- =========================================
-- SCRIPT TERMINÉ
-- =========================================
-- La table user_badges est maintenant prête à l'emploi !