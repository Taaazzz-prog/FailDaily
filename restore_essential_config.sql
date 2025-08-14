-- Restauration d'urgence des configurations essentielles après reset de base de données
-- À exécuter dans l'interface Supabase ou via psql

-- Restaurer la configuration des points
INSERT INTO app_config (key, value, created_at, updated_at) 
VALUES (
    'points_config',
    '{
        "createFailPoints": 10,
        "courageReactionPoints": 2,
        "laughReactionPoints": 1,
        "empathyReactionPoints": 2,
        "supportReactionPoints": 2,
        "dailyBonusPoints": 5
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Remettre à zéro tous les compteurs et stats globales
INSERT INTO app_config (key, value, created_at, updated_at) 
VALUES (
    'stats_global',
    '{
        "totalFails": 0,
        "totalUsers": 0,
        "totalReactions": 0,
        "totalComments": 0,
        "totalBadgesAwarded": 0,
        "lastResetDate": "' || NOW() || '"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Restaurer les réglages généraux de l'application
INSERT INTO app_config (key, value, created_at, updated_at) 
VALUES (
    'app_settings',
    '{
        "maintenanceMode": false,
        "allowRegistrations": true,
        "maxFailsPerDay": 10,
        "minDescriptionLength": 10,
        "maxDescriptionLength": 500,
        "lastMaintenanceDate": "' || NOW() || '"
    }'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = NOW();

-- Vérifier que toutes les configurations ont été restaurées
SELECT key, value FROM app_config WHERE key IN ('points_config', 'stats_global', 'app_settings');
