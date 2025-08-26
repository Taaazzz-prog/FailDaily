-- Migration: Rename is_public to is_anonyme (anonymat du créateur)
-- Safe for MySQL 8+/9+, preserves NULLability and DEFAULT values
-- Applies to tables if, and only if, the old column exists.

SET @old_sql_mode := @@SESSION.sql_mode;
SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'STRICT_TRANS_TABLES', '');

DELIMITER $$
DROP PROCEDURE IF EXISTS migrate_is_public_to_is_anonyme $$
CREATE PROCEDURE migrate_is_public_to_is_anonyme()
BEGIN
  DECLARE col_nullable VARCHAR(3);
  DECLARE col_default TEXT;
  DECLARE sql_stmt TEXT;

  -- Helper: rename column on a given table if present
  -- Note: We force TINYINT(1) to standardize, preserving NULL/DEFAULT
  -- Params via session variables: @tbl

  -- Fails table
  IF EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fails'
      AND COLUMN_NAME = 'is_public'
  ) THEN
    SELECT IS_NULLABLE, COLUMN_DEFAULT
      INTO col_nullable, col_default
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'fails'
      AND COLUMN_NAME = 'is_public';

    SET sql_stmt = CONCAT(
      'ALTER TABLE fails CHANGE COLUMN is_public is_anonyme TINYINT(1) ',
      IF(col_nullable = 'YES', 'NULL', 'NOT NULL'),
      IF(col_default IS NOT NULL, CONCAT(' DEFAULT ', QUOTE(col_default)), ''),
      ';'
    );
    PREPARE stmt FROM sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;

  -- user_profiles table (legacy)
  IF EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_profiles'
      AND COLUMN_NAME = 'is_public'
  ) THEN
    SELECT IS_NULLABLE, COLUMN_DEFAULT
      INTO col_nullable, col_default
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_profiles'
      AND COLUMN_NAME = 'is_public';

    SET sql_stmt = CONCAT(
      'ALTER TABLE user_profiles CHANGE COLUMN is_public is_anonyme TINYINT(1) ',
      IF(col_nullable = 'YES', 'NULL', 'NOT NULL'),
      IF(col_default IS NOT NULL, CONCAT(' DEFAULT ', QUOTE(col_default)), ''),
      ';'
    );
    PREPARE stmt FROM sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;

  -- profiles table (if such column exists)
  IF EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'profiles'
      AND COLUMN_NAME = 'is_public'
  ) THEN
    SELECT IS_NULLABLE, COLUMN_DEFAULT
      INTO col_nullable, col_default
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'profiles'
      AND COLUMN_NAME = 'is_public';

    SET sql_stmt = CONCAT(
      'ALTER TABLE profiles CHANGE COLUMN is_public is_anonyme TINYINT(1) ',
      IF(col_nullable = 'YES', 'NULL', 'NOT NULL'),
      IF(col_default IS NOT NULL, CONCAT(' DEFAULT ', QUOTE(col_default)), ''),
      ';'
    );
    PREPARE stmt FROM sql_stmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END $$
DELIMITER ;

CALL migrate_is_public_to_is_anonyme();
DROP PROCEDURE migrate_is_public_to_is_anonyme;

-- Restore SQL mode
SET SESSION sql_mode = @old_sql_mode;

