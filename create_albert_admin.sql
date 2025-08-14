-- Créer Albert comme utilisateur admin pour tester le panel admin
-- UUID généré pour Albert
SET @albert_id = '11111111-2222-3333-4444-555555555555';

-- 1. Créer Albert dans auth.users
INSERT INTO auth.users (
    instance_id, 
    id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    is_super_admin, 
    created_at, 
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, 
    '11111111-2222-3333-4444-555555555555'::uuid, 
    'authenticated', 
    'authenticated', 
    'm666@666.lk', 
    '$2a$06$YCjSrm0CYnEXUjH5zXTyau2ntt82cK0o33z3vVcA3FAe7kHroT1Wa', -- Mot de passe: 51008473
    NOW(), 
    '{"provider": "email", "providers": ["email"]}', 
    '{"display_name": "Albert pas einstein"}', 
    FALSE, 
    NOW(), 
    NOW()
);

-- 2. Créer l'identity pour Albert
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    id
) VALUES (
    '11111111-2222-3333-4444-555555555555', 
    '11111111-2222-3333-4444-555555555555'::uuid,
    '{"sub": "11111111-2222-3333-4444-555555555555", "email": "m666@666.lk", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW(),
    gen_random_uuid()
);

-- 3. Créer le profil pour Albert avec le rôle admin
INSERT INTO profiles (
    id,
    email,
    username,
    display_name,
    role,
    points,
    created_at,
    updated_at
) VALUES (
    '11111111-2222-3333-4444-555555555555'::uuid,
    'm666@666.lk',
    'albert_einstein',
    'Albert pas einstein',
    'admin',
    0,
    NOW(),
    NOW()
);

-- 4. Créer quelques fails pour Albert pour avoir des données de test
INSERT INTO fails (
    id,
    user_id,
    title,
    description,
    category,
    is_public,
    reactions,
    created_at,
    updated_at
) VALUES 
(gen_random_uuid(), '11111111-2222-3333-4444-555555555555'::uuid, 'Test Fail 1', 'Premier fail de test', 'work', true, '{"courage": 2, "laugh": 5, "empathy": 1, "support": 3}'::jsonb, NOW(), NOW()),
(gen_random_uuid(), '11111111-2222-3333-4444-555555555555'::uuid, 'Test Fail 2', 'Deuxième fail de test', 'personal', true, '{"courage": 1, "laugh": 3, "empathy": 2, "support": 1}'::jsonb, NOW(), NOW()),
(gen_random_uuid(), '11111111-2222-3333-4444-555555555555'::uuid, 'Test Fail 3', 'Troisième fail de test', 'social', false, '{"courage": 0, "laugh": 1, "empathy": 0, "support": 2}'::jsonb, NOW(), NOW()),
(gen_random_uuid(), '11111111-2222-3333-4444-555555555555'::uuid, 'Test Fail 4', 'Quatrième fail de test', 'work', true, '{"courage": 3, "laugh": 2, "empathy": 4, "support": 1}'::jsonb, NOW(), NOW()),
(gen_random_uuid(), '11111111-2222-3333-4444-555555555555'::uuid, 'Test Fail 5', 'Cinquième fail de test', 'personal', true, '{"courage": 1, "laugh": 8, "empathy": 3, "support": 5}'::jsonb, NOW(), NOW());

-- 5. Créer des logs système de test
INSERT INTO system_logs (level, message, details, user_id, action) VALUES 
('info', 'Albert connecté au panel admin', '{"timestamp": "now", "ip": "127.0.0.1"}'::jsonb, '11111111-2222-3333-4444-555555555555'::uuid, 'admin_login'),
('info', 'Création d''un nouveau fail', '{"fail_title": "Test Fail 1", "category": "work"}'::jsonb, '11111111-2222-3333-4444-555555555555'::uuid, 'create_fail'),
('warning', 'Tentative de connexion échouée', '{"email": "wrong@email.com", "ip": "192.168.1.100"}'::jsonb, NULL, 'failed_login'),
('error', 'Erreur lors de la sauvegarde', '{"error": "Database timeout", "query": "INSERT INTO fails"}'::jsonb, '11111111-2222-3333-4444-555555555555'::uuid, 'db_error'),
('debug', 'Test de debugging', '{"debug_info": "Panel admin test"}'::jsonb, '11111111-2222-3333-4444-555555555555'::uuid, 'debug_test');

-- 6. Créer des activités utilisateur de test
INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id, reaction_type) VALUES 
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', 'create_fail', '{"fail_title": "Test Fail 1", "category": "work"}'::jsonb, (SELECT id FROM fails WHERE title = 'Test Fail 1' LIMIT 1), NULL),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', 'create_fail', '{"fail_title": "Test Fail 2", "category": "personal"}'::jsonb, (SELECT id FROM fails WHERE title = 'Test Fail 2' LIMIT 1), NULL),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', 'add_reaction', '{"reaction_type": "laugh", "points_awarded": 1}'::jsonb, (SELECT id FROM fails WHERE title = 'Test Fail 1' LIMIT 1), 'laugh'),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', 'add_reaction', '{"reaction_type": "courage", "points_awarded": 2}'::jsonb, (SELECT id FROM fails WHERE title = 'Test Fail 2' LIMIT 1), 'courage');

-- 7. Créer des logs de réactions de test
INSERT INTO reaction_logs (user_id, user_email, user_name, fail_id, fail_title, fail_author_name, reaction_type, points_awarded) VALUES 
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', (SELECT id FROM fails WHERE title = 'Test Fail 1' LIMIT 1), 'Test Fail 1', 'Albert pas einstein', 'laugh', 1),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', (SELECT id FROM fails WHERE title = 'Test Fail 1' LIMIT 1), 'Test Fail 1', 'Albert pas einstein', 'courage', 2),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', (SELECT id FROM fails WHERE title = 'Test Fail 2' LIMIT 1), 'Test Fail 2', 'Albert pas einstein', 'empathy', 2),
('11111111-2222-3333-4444-555555555555'::uuid, 'm666@666.lk', 'Albert pas einstein', (SELECT id FROM fails WHERE title = 'Test Fail 3' LIMIT 1), 'Test Fail 3', 'Albert pas einstein', 'support', 2);

-- Vérification
SELECT 'Albert créé avec succès !' as status;
SELECT id, email, raw_user_meta_data->>'display_name' as display_name FROM auth.users WHERE email = 'm666@666.lk';
SELECT id, email, display_name, role FROM profiles WHERE email = 'm666@666.lk';
