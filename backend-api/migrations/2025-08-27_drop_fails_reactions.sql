-- Migration: Drop fails.reactions JSON column and its trigger
-- Safe, idempotent, with archival of existing JSON values for rollback/audit.

SET @old_sql_mode := @@SESSION.sql_mode;
SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'STRICT_TRANS_TABLES', '');

DELIMITER $$
DROP PROCEDURE IF EXISTS migrate_drop_fails_reactions $$
CREATE PROCEDURE migrate_drop_fails_reactions()
BEGIN
  -- 1) Archive table for legacy JSON values
  CREATE TABLE IF NOT EXISTS fail_reactions_archive (
    fail_id CHAR(36) NOT NULL,
    reactions_json LONGTEXT NULL,
    archived_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (fail_id),
    KEY idx_archived_at (archived_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

  -- 2) If the column exists, back it up once
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'fails'
       AND COLUMN_NAME = 'reactions'
  ) THEN
    -- Insert only rows that are not already archived
    INSERT INTO fail_reactions_archive (fail_id, reactions_json)
    SELECT f.id, f.reactions
      FROM fails f
      LEFT JOIN fail_reactions_archive a ON a.fail_id = f.id
     WHERE a.fail_id IS NULL;

    -- 3) Drop trigger that was initializing the JSON column
    DROP TRIGGER IF EXISTS `fails_before_insert`;

    -- 4) Drop the column
    SET @sql := 'ALTER TABLE fails DROP COLUMN reactions';
    PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;

CALL migrate_drop_fails_reactions();
DROP PROCEDURE migrate_drop_fails_reactions;

-- Optional: you can DROP the archive after a few releases if not needed
-- DROP TABLE IF EXISTS fail_reactions_archive;

SET SESSION sql_mode = @old_sql_mode;

-- Rollback (manual):
-- 1) ALTER TABLE fails ADD COLUMN reactions LONGTEXT NULL COMMENT 'JSON data';
-- 2) Recreate trigger if needed.
-- 3) Restore data:
--    UPDATE fails f JOIN fail_reactions_archive a ON a.fail_id = f.id
--       SET f.reactions = a.reactions_json;

