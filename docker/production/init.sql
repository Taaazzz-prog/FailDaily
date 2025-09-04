-- ===============================================
-- 🗄️ SCRIPT D'INITIALISATION MYSQL PRODUCTION
-- ===============================================
-- Configuration optimisée pour FailDaily

-- Création de l'utilisateur applicatif
CREATE USER IF NOT EXISTS 'faildaily_user'@'%' IDENTIFIED BY '@51008473@Alexia@';
GRANT ALL PRIVILEGES ON faildaily.* TO 'faildaily_user'@'%';

-- Configuration des performances MySQL
SET GLOBAL max_connections = 200;

-- Nettoyage et finalisation
FLUSH PRIVILEGES;
