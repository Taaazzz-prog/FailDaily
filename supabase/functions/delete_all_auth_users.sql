-- Fonction pour supprimer tous les utilisateurs de la table auth.users
-- Cette fonction doit être créée dans Supabase pour permettre la suppression via RPC

CREATE OR REPLACE FUNCTION delete_all_auth_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Nécessaire pour accéder à auth.users
AS $$
DECLARE
    user_rec RECORD;
BEGIN
    -- Log de début
    RAISE NOTICE 'Début de suppression de tous les utilisateurs auth';
    
    -- Boucle sur tous les utilisateurs de auth.users
    FOR user_rec IN 
        SELECT id FROM auth.users
    LOOP
        -- Supprimer l'utilisateur via l'API auth
        -- Note: Cette approche nécessite des permissions spéciales
        DELETE FROM auth.users WHERE id = user_rec.id;
        RAISE NOTICE 'Utilisateur supprimé: %', user_rec.id;
    END LOOP;
    
    -- Log de fin
    RAISE NOTICE 'Suppression terminée';
END;
$$;

-- Accordez les permissions nécessaires (à exécuter en tant que service_role)
-- GRANT EXECUTE ON FUNCTION delete_all_auth_users() TO authenticated;
-- GRANT EXECUTE ON FUNCTION delete_all_auth_users() TO anon;
