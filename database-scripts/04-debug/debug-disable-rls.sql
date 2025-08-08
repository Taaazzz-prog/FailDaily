-- ================================================
-- SCRIPT DE DEBUG - DÉSACTIVER RLS TEMPORAIREMENT
-- ================================================
-- ATTENTION : À utiliser uniquement pour le debugging
-- Réactivez RLS après avoir identifié le problème

-- Désactiver RLS temporairement
ALTER TABLE public.fails DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;

-- Pour réactiver plus tard :
-- ALTER TABLE public.fails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
