-- Utilisateur de test pour l'environnement local
INSERT INTO users (
    id, 
    email, 
    email_confirmed, 
    password_hash, 
    role, 
    account_status, 
    registration_step,
    created_at, 
    updated_at
) VALUES (
    UUID(), 
    'test@local.com', 
    1, 
    '$2b$10$LQv3c1yqBwlVHpPa0jMwOeYsm5xTj3yYlvQz7aBcDeFgHiJkLmNoP', 
    'user', 
    'active', 
    'completed',
    NOW(), 
    NOW()
);

-- Vérifier l'insertion
SELECT id, email, role, account_status, created_at FROM users WHERE email = 'test@local.com';
