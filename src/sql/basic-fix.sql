-- =============================================
-- CORRECTION RAPIDE POUR LA CRÉATION DE FAILS
-- =============================================

-- Supprimer tous les triggers de badges temporairement
DROP TRIGGER IF EXISTS trigger_check_badges_on_fail ON public.fails;
DROP TRIGGER IF EXISTS trigger_check_badges_on_reaction ON public.reactions;

-- Supprimer la fonction qui pose problème
DROP FUNCTION IF EXISTS public.check_and_unlock_badges();

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE 'Triggers de badges désactivés - création de fails maintenant possible';
END $$;
