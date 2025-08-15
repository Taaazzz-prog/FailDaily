-- Diagnostic complet du problème d'inscription
-- Exécutez ceci dans Supabase pour diagnostiquer le problème

-- 1. Vérifier les utilisateurs dans auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- 2. Vérifier les profils correspondants dans profiles
SELECT 
    p.id,
    p.email,
    p.display_name,
    p.username,
    p.created_at,
    p.registration_completed
FROM profiles p
WHERE p.id IN (
    SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 3
);

-- 3. Vérifier les logs d'activité récents
SELECT 
    id,
    event_type,
    event_category,
    action,
    title,
    user_id,
    user_email,
    success,
    error_message,
    created_at
FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Vérifier les permissions sur la table profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Trouver l'utilisateur le plus récent sans profil
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.created_at as profile_created
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;
