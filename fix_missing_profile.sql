-- CORRECTION URGENTE : Créer le profil manquant
-- Exécutez ceci dans Supabase pour réparer l'inscription

-- 1. Créer le profil pour l'utilisateur orphelin
INSERT INTO profiles (
    id,
    email,
    display_name,
    username,
    created_at,
    updated_at,
    registration_completed,
    email_confirmed,
    stats,
    preferences,
    role
) VALUES (
    'bbc7c74f-1741-47e2-91b3-3afa89c78f22',
    'bruno@taaazzz-prog.fr',
    'Taaazzz-prog',
    'taaazzz-prog',
    '2025-08-15 07:53:20.393656+00',
    NOW(),
    false, -- Pas encore complètement enregistré
    true,  -- Email confirmé (déjà dans auth.users)
    '{"badges": [], "totalFails": 0, "couragePoints": 0}',
    '{}',
    'user'
);

-- 2. Vérifier que le profil a été créé
SELECT 
    id,
    email,
    display_name,
    username,
    created_at,
    registration_completed
FROM profiles 
WHERE id = 'bbc7c74f-1741-47e2-91b3-3afa89c78f22';

-- 3. Créer un log manuel pour cette correction
SELECT log_comprehensive_activity(
    'profile_manual_fix',
    'admin',
    'create_missing_profile',
    'Correction manuelle : Profil créé pour utilisateur orphelin',
    'bbc7c74f-1741-47e2-91b3-3afa89c78f22',
    'profile',
    'bbc7c74f-1741-47e2-91b3-3afa89c78f22',
    NULL,
    'Profil manquant créé manuellement suite à un bug lors de l''inscription',
    '{"email": "bruno@taaazzz-prog.fr", "display_name": "Taaazzz-prog", "fix_reason": "missing_profile_after_auth_creation"}',
    NULL,
    NULL,
    '127.0.0.1',
    'Manual Admin Fix',
    'admin_fix_session',
    true,
    NULL,
    NULL,
    NULL
);

-- 4. Vérifier les logs après la correction
SELECT 
    id,
    event_type,
    action,
    title,
    user_email,
    success,
    created_at
FROM activity_logs 
WHERE user_id = 'bbc7c74f-1741-47e2-91b3-3afa89c78f22'
ORDER BY created_at DESC;
