-- Ajouter la colonne role à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Créer un index sur la colonne role pour les performances
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Mettre à jour votre compte Albert pour le rendre admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'm666@666.lk' OR display_name = 'Albert pas einstein';
