-- Script pour désactiver la validation d'email en développement
-- À exécuter dans Supabase SQL Editor pour les tests

-- ATTENTION : NE PAS UTILISER EN PRODUCTION !
-- Ce script est uniquement pour faciliter les tests en développement

-- 1. Confirmer tous les emails existants non confirmés
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Mettre à jour les profils pour marquer les emails comme confirmés
UPDATE profiles 
SET email_confirmed = TRUE 
WHERE email_confirmed = FALSE OR email_confirmed IS NULL;

-- 3. (Optionnel) Désactiver complètement la validation d'email pour nouveaux utilisateurs
-- ATTENTION : Cela affecte tous les nouveaux utilisateurs !
-- Décommentez seulement si vous voulez désactiver la validation complètement
/*
UPDATE auth.config 
SET email_confirm_required = false 
WHERE name = 'email_confirm_required';
*/

-- 4. Afficher les utilisateurs confirmés
SELECT 
    id, 
    email, 
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Afficher les profils correspondants
SELECT 
    p.id,
    p.email,
    p.username,
    p.email_confirmed,
    p.registration_completed,
    p.created_at
FROM profiles p
ORDER BY p.created_at DESC 
LIMIT 10;
