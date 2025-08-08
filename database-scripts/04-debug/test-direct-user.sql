-- Test d'insertion directe dans auth.users (temporaire)
-- ATTENTION: NE PAS utiliser en production

-- Insérer un utilisateur test directement
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    aud,
    role,
    is_sso_user,
    is_anonymous
) VALUES (
    gen_random_uuid(),
    'bruno@taaazzz.be',
    crypt('51008473', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"username": "Taaazzz-prog", "display_name": "Taaazzz-prog"}',
    'authenticated',
    'authenticated',
    false,
    false
);

-- Vérifier l'insertion
SELECT id, email, created_at FROM auth.users WHERE email = 'bruno@taaazzz.be';
