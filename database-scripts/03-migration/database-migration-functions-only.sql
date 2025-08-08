-- =========================================
-- MIGRATION : Fonctions manquantes pour la table profiles existante
-- =========================================
-- Date: 8 août 2025
-- Description: Ajoute les fonctions de validation et RPC manquantes pour la table profiles

-- 0. Supprimer d'abord les contraintes qui dépendent des fonctions
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_legal_consent;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_age_verification;

-- 1. Supprimer les fonctions existantes pour éviter les conflits de paramètres
DROP FUNCTION IF EXISTS validate_legal_consent(jsonb);
DROP FUNCTION IF EXISTS validate_age_verification(jsonb);
DROP FUNCTION IF EXISTS complete_user_registration(uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS check_user_registration_status(uuid);
DROP FUNCTION IF EXISTS confirm_user_email(uuid);

-- 2. Fonction de validation du consentement légal (référencée par la contrainte)
CREATE OR REPLACE FUNCTION validate_legal_consent(consent_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier la structure minimale du consentement
  IF consent_data IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier les champs obligatoires
  IF NOT (consent_data ? 'documentsAccepted' AND 
          consent_data ? 'consentDate' AND
          consent_data ? 'consentVersion') THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que les documents sont acceptés
  IF NOT (consent_data->>'documentsAccepted')::BOOLEAN THEN
    RETURN FALSE;
  END IF;

  -- Vérifier la date de consentement (pas dans le futur)
  IF (consent_data->>'consentDate')::TIMESTAMP > NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 2. Fonction de validation de la vérification d'âge (référencée par la contrainte)
CREATE OR REPLACE FUNCTION validate_age_verification(age_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier la structure minimale
  IF age_data IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Vérifier les champs obligatoires
  IF NOT (age_data ? 'birthDate' AND age_data ? 'isMinor') THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que la date de naissance n'est pas dans le futur
  IF (age_data->>'birthDate')::DATE > CURRENT_DATE THEN
    RETURN FALSE;
  END IF;

  -- Calculer si l'utilisateur est vraiment mineur
  IF EXTRACT(YEAR FROM AGE((age_data->>'birthDate')::DATE)) < 18 THEN
    -- Vérifier que isMinor est true pour les mineurs
    IF NOT (age_data->>'isMinor')::BOOLEAN THEN
      RETURN FALSE;
    END IF;
  ELSE
    -- Vérifier que isMinor est false pour les adultes
    IF (age_data->>'isMinor')::BOOLEAN THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 3. Fonction pour compléter l'inscription avec données légales
CREATE OR REPLACE FUNCTION complete_user_registration(
  user_id UUID,
  legal_consent_data JSONB,
  age_verification_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  -- Mettre à jour le profil avec les données légales
  UPDATE profiles 
  SET 
    legal_consent = legal_consent_data,
    age_verification = age_verification_data,
    registration_completed = true,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING * INTO updated_profile;

  -- Vérifier si la mise à jour a réussi
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', user_id;
  END IF;

  -- Retourner les données du profil mis à jour
  RETURN row_to_json(updated_profile)::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error completing registration: %', SQLERRM;
END;
$$;

-- 4. Fonction pour vérifier le statut d'inscription
CREATE OR REPLACE FUNCTION check_user_registration_status(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data profiles%ROWTYPE;
  result JSONB;
BEGIN
  -- Récupérer les données du profil
  SELECT * INTO profile_data FROM profiles WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'exists', false,
      'hasLegalConsent', false,
      'hasAgeVerification', false,
      'registrationCompleted', false,
      'emailConfirmed', false
    );
  END IF;

  -- Construire le résultat
  result := jsonb_build_object(
    'exists', true,
    'hasLegalConsent', (profile_data.legal_consent IS NOT NULL),
    'hasAgeVerification', (profile_data.age_verification IS NOT NULL),
    'registrationCompleted', COALESCE(profile_data.registration_completed, false),
    'emailConfirmed', COALESCE(profile_data.email_confirmed, false),
    'profile', row_to_json(profile_data)
  );

  RETURN result;
END;
$$;

-- 5. Fonction pour marquer l'email comme confirmé
CREATE OR REPLACE FUNCTION confirm_user_email(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    email_confirmed = true,
    updated_at = NOW()
  WHERE id = user_id;

  RETURN FOUND;
END;
$$;

-- 6. Trigger pour marquer automatiquement l'email confirmé lors de l'authentification
CREATE OR REPLACE FUNCTION auto_confirm_email_on_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si l'utilisateur vient de confirmer son email dans auth.users
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Marquer l'email comme confirmé dans profiles
    UPDATE profiles 
    SET 
      email_confirmed = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur auth.users (si autorisé)
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_email_on_login();

-- 7. Mettre à jour la fonction handle_new_user pour inclure les nouveaux champs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    display_name,
    email_confirmed,
    registration_completed
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    (NEW.email_confirmed_at IS NOT NULL),
    false
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- 8. Accorder les permissions aux fonctions RPC
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registration_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_legal_consent(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_age_verification(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO authenticated;

-- 9. Activer RLS et créer les politiques si pas déjà fait
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politiques mises à jour
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert during registration" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert during registration" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politique pour permettre au système de voir les profils pour validation
CREATE POLICY "System can view profiles for validation" ON profiles
  FOR SELECT USING (true);

-- 10. Recréer les contraintes avec les nouvelles fonctions
-- Note: On utilise DO block pour gérer l'existence des contraintes
DO $$
BEGIN
  -- Ajouter la contrainte pour legal_consent si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_legal_consent' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT check_legal_consent 
    CHECK (
      (legal_consent IS NULL)
      OR validate_legal_consent(legal_consent)
    );
  END IF;

  -- Ajouter la contrainte pour age_verification si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_age_verification' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT check_age_verification 
    CHECK (
      (age_verification IS NULL)
      OR validate_age_verification(age_verification)
    );
  END IF;
END $$;

-- 11. Commentaires pour documentation
COMMENT ON FUNCTION validate_legal_consent IS 'Valide la structure des données de consentement légal';
COMMENT ON FUNCTION validate_age_verification IS 'Valide la structure des données de vérification d''âge';
COMMENT ON FUNCTION complete_user_registration IS 'Finalise l''inscription avec les données légales';
COMMENT ON FUNCTION check_user_registration_status IS 'Vérifie le statut d''inscription complet d''un utilisateur';
COMMENT ON FUNCTION confirm_user_email IS 'Marque l''email comme confirmé dans le profil';

-- =========================================
-- FIN DE LA MIGRATION
-- =========================================

-- Pour tester les fonctions :
-- SELECT validate_legal_consent('{"documentsAccepted": true, "consentDate": "2025-08-08T10:00:00.000Z", "consentVersion": "1.0"}'::jsonb);
-- SELECT validate_age_verification('{"birthDate": "2000-01-01", "isMinor": false}'::jsonb);
