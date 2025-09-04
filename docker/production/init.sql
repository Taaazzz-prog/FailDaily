-- ===============================================
-- 🗄️ SCRIPT D'INITIALISATION MYSQL PRODUCTION
-- ===============================================
-- Configuration optimisée pour FailDaily

-- Création de l'utilisateur applicatif
CREATE USER IF NOT EXISTS 'faildaily_user'@'%' IDENTIFIED BY '@51008473@Alexia@';
GRANT SELECT, INSERT, UPDATE, DELETE ON faildaily.* TO 'faildaily_user'@'%';

-- Optimisations MySQL pour production
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL query_cache_type = 1;

-- Index optimisés pour FailDaily
USE faildaily;

-- Index sur les tables principales (si elles existent déjà)
-- Ces commandes ne feront rien si les tables n'existent pas encore

-- Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Index pour les fails
CREATE INDEX IF NOT EXISTS idx_fails_user_id ON fails(user_id);
CREATE INDEX IF NOT EXISTS idx_fails_created_at ON fails(created_at);
CREATE INDEX IF NOT EXISTS idx_fails_status ON fails(status);
CREATE INDEX IF NOT EXISTS idx_fails_category ON fails(category);

-- Index pour les réactions
CREATE INDEX IF NOT EXISTS idx_reactions_fail_id ON reactions(fail_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(type);

-- Index pour les commentaires
CREATE INDEX IF NOT EXISTS idx_comments_fail_id ON comments(fail_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Index pour les badges utilisateurs
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at);

-- Configuration des performances
FLUSH PRIVILEGES;
FLUSH TABLES;

-- Log de l'initialisation
INSERT INTO system_logs (level, message, created_at) 
VALUES ('INFO', 'Database initialized for production', NOW())
ON DUPLICATE KEY UPDATE message = VALUES(message);
