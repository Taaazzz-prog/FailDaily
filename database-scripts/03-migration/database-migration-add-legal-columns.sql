-- =========================================
-- MIGRATION : Ajout des colonnes légales à la table profiles existante
-- =========================================
-- Date: 8 août 2025
-- Description: Ajoute les colonnes legal_consent et age_verification à la table profiles

-- 1. Ajouter les colonnes JSONB pour les données légales
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS legal_consent JSONB,
ADD COLUMN IF NOT EXISTS age_verification JSONB;

-- 2. Créer des index pour optimiser les requêtes sur les données légales
CREATE INDEX IF NOT EXISTS idx_profiles_legal_consent ON profiles USING GIN (legal_consent);
CREATE INDEX IF NOT EXISTS idx_profiles_age_verification ON profiles USING GIN (age_verification);

-- 3. Ajouter des contraintes de validation pour les données légales
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS check_legal_consent_structure 
CHECK (
  legal_consent IS NULL OR (
    legal_consent ? 'documentsAccepted' AND
    legal_consent ? 'consentDate' AND
    legal_consent ? 'consentVersion'
  )
);

ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS check_age_verification_structure 
CHECK (
  age_verification IS NULL OR (
    age_verification ? 'birthDate' AND
    age_verification ? 'isMinor'
  )
);

-- 4. Fonction pour compléter l'inscription avec données légales
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

-- 5. Fonction pour vérifier le statut d'inscription
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
      'hasAgeVerification', false
    );
  END IF;

  -- Construire le résultat
  result := jsonb_build_object(
    'exists', true,
    'hasLegalConsent', (profile_data.legal_consent IS NOT NULL),
    'hasAgeVerification', (profile_data.age_verification IS NOT NULL),
    'profile', row_to_json(profile_data)
  );

  RETURN result;
END;
$$;

-- 6. Fonction pour valider le consentement légal
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
END;
$$;

-- 7. Trigger pour valider les données légales avant insertion/mise à jour
CREATE OR REPLACE FUNCTION validate_legal_data_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Valider legal_consent si présent
  IF NEW.legal_consent IS NOT NULL THEN
    IF NOT validate_legal_consent(NEW.legal_consent) THEN
      RAISE EXCEPTION 'Invalid legal consent data';
    END IF;
  END IF;

  -- Valider age_verification si présent
  IF NEW.age_verification IS NOT NULL THEN
    -- Vérifier que la date de naissance n'est pas dans le futur
    IF (NEW.age_verification->>'birthDate')::DATE > CURRENT_DATE THEN
      RAISE EXCEPTION 'Birth date cannot be in the future';
    END IF;

    -- Calculer si l'utilisateur est mineur
    IF EXTRACT(YEAR FROM AGE((NEW.age_verification->>'birthDate')::DATE)) < 18 THEN
      -- Vérifier que isMinor est true pour les mineurs
      IF NOT (NEW.age_verification->>'isMinor')::BOOLEAN THEN
        RAISE EXCEPTION 'isMinor must be true for users under 18';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS validate_legal_data ON profiles;
CREATE TRIGGER validate_legal_data
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_legal_data_trigger();

-- 8. Activer RLS et créer les politiques
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leur propre profil
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre la création de profils lors de l'inscription
CREATE POLICY IF NOT EXISTS "Enable insert during registration" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 9. Accorder les permissions aux fonctions RPC
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_registration_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_legal_consent(JSONB) TO authenticated;

-- 10. Commentaires pour documentation
COMMENT ON COLUMN profiles.legal_consent IS 'JSONB contenant les données de consentement légal (CGU, politique de confidentialité, etc.)';
COMMENT ON COLUMN profiles.age_verification IS 'JSONB contenant les données de vérification d''âge et consentement parental si nécessaire';
COMMENT ON FUNCTION complete_user_registration IS 'Fonction pour finaliser l''inscription avec les données légales';
COMMENT ON FUNCTION check_user_registration_status IS 'Fonction pour vérifier le statut d''inscription d''un utilisateur';

-- =========================================
-- FIN DE LA MIGRATION
-- =========================================

-- Pour vérifier que tout fonctionne :
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('legal_consent', 'age_verification');
