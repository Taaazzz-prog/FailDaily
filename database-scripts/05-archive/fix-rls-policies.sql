-- Correction des politiques RLS pour la table profiles
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer toutes les politiques existantes sur profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Désactiver temporairement RLS pour les tests
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- OU créer des politiques plus permissives pour le développement
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour voir tous les profils (développement seulement)
-- CREATE POLICY "Allow all profile reads" ON profiles FOR SELECT USING (true);

-- Politique pour insérer des profils
-- CREATE POLICY "Allow all profile inserts" ON profiles FOR INSERT WITH CHECK (true);

-- Politique pour modifier des profils
-- CREATE POLICY "Allow all profile updates" ON profiles FOR UPDATE USING (true);
