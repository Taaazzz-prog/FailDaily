-- Fonctions SQL pour contourner les politiques RLS lors du reset administrateur
-- Ces fonctions doivent être créées dans Supabase avec des privilèges de sécurité défini

-- Fonction pour vider complètement une table (TRUNCATE)
CREATE OR REPLACE FUNCTION admin_truncate_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Vérifier que la table existe et est autorisée
  IF table_name IN (
    'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges', 
    'system_logs', 'activity_logs', 'reaction_logs', 'user_activities', 
    'user_management_logs', 'user_preferences'
  ) THEN
    -- Construire et exécuter la commande TRUNCATE
    sql_statement := 'TRUNCATE TABLE public.' || quote_ident(table_name) || ' RESTART IDENTITY CASCADE';
    EXECUTE sql_statement;
  ELSE
    RAISE EXCEPTION 'Table % non autorisée pour le reset administrateur', table_name;
  END IF;
END;
$$;

-- Fonction pour supprimer tous les enregistrements d'une table (DELETE)
CREATE OR REPLACE FUNCTION admin_delete_all(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Vérifier que la table existe et est autorisée
  IF table_name IN (
    'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges', 
    'system_logs', 'activity_logs', 'reaction_logs', 'user_activities', 
    'user_management_logs', 'user_preferences'
  ) THEN
    -- Construire et exécuter la commande DELETE
    sql_statement := 'DELETE FROM public.' || quote_ident(table_name);
    EXECUTE sql_statement;
  ELSE
    RAISE EXCEPTION 'Table % non autorisée pour le reset administrateur', table_name;
  END IF;
END;
$$;

-- Fonction pour compter les enregistrements d'une table
CREATE OR REPLACE FUNCTION admin_count_table(table_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
  record_count integer;
BEGIN
  -- Vérifier que la table existe et est autorisée
  IF table_name IN (
    'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges', 
    'system_logs', 'activity_logs', 'reaction_logs', 'user_activities', 
    'user_management_logs', 'user_preferences'
  ) THEN
    -- Construire et exécuter la commande COUNT
    sql_statement := 'SELECT COUNT(*) FROM public.' || quote_ident(table_name);
    EXECUTE sql_statement INTO record_count;
    RETURN record_count;
  ELSE
    RAISE EXCEPTION 'Table % non autorisée pour le comptage administrateur', table_name;
  END IF;
END;
$$;

-- Fonction pour supprimer tous les utilisateurs d'authentification
CREATE OR REPLACE FUNCTION admin_delete_all_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
  user_record record;
BEGIN
  -- Compter d'abord les utilisateurs
  SELECT COUNT(*) INTO deleted_count FROM auth.users;
  
  -- Si aucun utilisateur, retourner 0
  IF deleted_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- Supprimer les utilisateurs un par un pour éviter l'erreur "DELETE requires WHERE clause"
  FOR user_record IN SELECT id FROM auth.users LOOP
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
  
  -- Retourner le nombre d'utilisateurs supprimés
  RETURN deleted_count;
END;
$$;

-- Fonction pour compter les utilisateurs d'authentification
CREATE OR REPLACE FUNCTION admin_count_auth_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RETURN user_count;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION admin_truncate_table(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_all(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_count_table(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_all_users() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_count_auth_users() TO anon, authenticated;
