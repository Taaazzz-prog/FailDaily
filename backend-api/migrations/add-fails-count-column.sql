-- Migration pour ajouter le champ fails_count à la table users
-- Fichier: add-fails-count-column.sql

USE faildaily;

-- Ajouter la colonne fails_count à la table users
ALTER TABLE users 
ADD COLUMN fails_count INT DEFAULT 0 
AFTER login_count;

-- Calculer et mettre à jour les valeurs existantes
UPDATE users u 
SET fails_count = (
    SELECT COUNT(*) 
    FROM fails f 
    WHERE f.user_id = u.id
);

-- Créer un trigger pour maintenir à jour automatiquement
DELIMITER $$
CREATE TRIGGER update_fails_count_after_insert
AFTER INSERT ON fails
FOR EACH ROW
BEGIN
    UPDATE users 
    SET fails_count = fails_count + 1 
    WHERE id = NEW.user_id;
END$$

CREATE TRIGGER update_fails_count_after_delete
AFTER DELETE ON fails
FOR EACH ROW
BEGIN
    UPDATE users 
    SET fails_count = fails_count - 1 
    WHERE id = OLD.user_id;
END$$
DELIMITER ;

-- Vérification
SELECT 'Migration terminée - fails_count ajouté à la table users' as status;
