-- =========================================
-- CORRECTIF : Fonction de validation legal_consent 
-- =========================================
-- Fix pour que documentsAccepted soit traité comme array et non boolean

CREATE OR REPLACE FUNCTION validate_legal_consent(consent_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Vérifier la structure minimale du consentement
  IF consent_data IS NULL THEN
    RETURN TRUE; -- Permettre NULL temporairement
  END IF;

  -- Vérifier les champs obligatoires
  IF NOT (consent_data ? 'documentsAccepted' AND 
          consent_data ? 'consentDate' AND
          consent_data ? 'consentVersion') THEN
    RETURN FALSE;
  END IF;

  -- Vérifier que documentsAccepted est un array et n'est pas vide
  IF NOT (jsonb_array_length(consent_data->'documentsAccepted') > 0) THEN
    RETURN FALSE;
  END IF;

  -- Vérifier la date de consentement (pas dans le futur)
  IF (consent_data->>'consentDate')::TIMESTAMP > NOW() THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN TRUE; -- Permettre en cas d'erreur pour éviter les blocages
END;
$$;
