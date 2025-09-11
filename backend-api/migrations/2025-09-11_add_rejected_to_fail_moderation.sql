-- Ajoute le statut 'rejected' aux tables de modération
ALTER TABLE fail_moderation
  MODIFY COLUMN status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review';

-- (Optionnel) faire de même pour les commentaires si souhaité
-- ALTER TABLE comment_moderation
--   MODIFY COLUMN status ENUM('under_review','hidden','approved','rejected') NOT NULL DEFAULT 'under_review';

