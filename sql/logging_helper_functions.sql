-- ========================================
-- FONCTIONS D'AIDE POUR L'INTÉGRATION TYPESCRIPT
-- ========================================
-- Ces fonctions simplifient l'utilisation du système de logs depuis TypeScript

-- 1. FONCTIONS DE LOGGING SIMPLIFIÉES

-- Log d'action sociale rapide
CREATE OR REPLACE FUNCTION log_social_action(
    p_user_id uuid,
    p_action text, -- 'follow', 'unfollow', 'comment', 'react'
    p_target_user_id uuid,
    p_resource_id uuid DEFAULT NULL,
    p_details jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    action_titles jsonb := jsonb_build_object(
        'follow', 'Utilisateur suivi',
        'unfollow', 'Utilisateur non suivi',
        'comment', 'Commentaire ajouté',
        'react', 'Réaction ajoutée',
        'view_profile', 'Profil visité'
    );
BEGIN
    RETURN log_comprehensive_activity(
        p_action || '_action',
        'social',
        p_action || '_user',
        action_titles->p_action,
        p_user_id,
        CASE p_action 
            WHEN 'follow' THEN 'follow'
            WHEN 'unfollow' THEN 'follow'
            WHEN 'comment' THEN 'comment'
            WHEN 'react' THEN 'reaction'
            ELSE 'social'
        END,
        p_resource_id,
        p_target_user_id,
        'Action sociale: ' || p_action,
        p_details
    );
END;
$$ LANGUAGE plpgsql;

-- Log de navigation rapide
CREATE OR REPLACE FUNCTION log_navigation(
    p_user_id uuid,
    p_page text,
    p_from_page text DEFAULT NULL,
    p_session_id text DEFAULT NULL
)
RETURNS uuid AS $$
BEGIN
    RETURN log_comprehensive_activity(
        'page_visit',
        'navigation',
        'visit_page',
        'Visite de page: ' || p_page,
        p_user_id,
        'page',
        NULL,
        NULL,
        'Navigation vers: ' || p_page || CASE WHEN p_from_page IS NOT NULL THEN ' depuis: ' || p_from_page ELSE '' END,
        jsonb_build_object(
            'page', p_page,
            'from_page', p_from_page,
            'timestamp', now()
        ),
        NULL,
        NULL,
        NULL,
        NULL,
        p_session_id
    );
END;
$$ LANGUAGE plpgsql;

-- Log d'erreur rapide
CREATE OR REPLACE FUNCTION log_error(
    p_user_id uuid,
    p_error_type text,
    p_error_message text,
    p_context jsonb DEFAULT NULL
)
RETURNS uuid AS $$
BEGIN
    RETURN log_comprehensive_activity(
        'error_occurred',
        'system',
        'error',
        'Erreur: ' || p_error_type,
        p_user_id,
        'error',
        NULL,
        NULL,
        p_error_message,
        p_context,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        false,
        p_error_message
    );
END;
$$ LANGUAGE plpgsql;

-- 2. FONCTIONS D'AGRÉGATION POUR LES STATISTIQUES

-- Obtenir le résumé d'activité d'aujourd'hui
CREATE OR REPLACE FUNCTION get_today_activity_summary(p_user_id uuid)
RETURNS jsonb AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'total_actions', COUNT(*),
            'social_actions', COUNT(*) FILTER (WHERE event_category = 'social'),
            'navigation_actions', COUNT(*) FILTER (WHERE event_category = 'navigation'),
            'content_actions', COUNT(*) FILTER (WHERE event_category = 'fail'),
            'errors', COUNT(*) FILTER (WHERE success = false),
            'most_active_hour', (
                SELECT EXTRACT(hour FROM created_at)
                FROM activity_logs
                WHERE user_id = p_user_id 
                    AND created_at >= current_date
                GROUP BY EXTRACT(hour FROM created_at)
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ),
            'last_action', MAX(created_at)
        )
        FROM activity_logs
        WHERE user_id = p_user_id
            AND created_at >= current_date
    );
END;
$$ LANGUAGE plpgsql;

-- Obtenir les interactions récentes avec un utilisateur spécifique
CREATE OR REPLACE FUNCTION get_recent_user_interactions(
    p_user_id uuid,
    p_target_user_id uuid,
    p_days integer DEFAULT 7
)
RETURNS TABLE(
    interaction_date date,
    interaction_count bigint,
    interaction_types jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::date as interaction_date,
        COUNT(*) as interaction_count,
        jsonb_object_agg(action, COUNT(*)) as interaction_types
    FROM activity_logs
    WHERE ((user_id = p_user_id AND target_user_id = p_target_user_id)
           OR (user_id = p_target_user_id AND target_user_id = p_user_id))
        AND created_at >= current_date - interval '%s days' % p_days
    GROUP BY created_at::date
    ORDER BY interaction_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. FONCTIONS D'ANALYSE COMPORTEMENTALE

-- Détecter les patterns d'utilisation d'un utilisateur
CREATE OR REPLACE FUNCTION analyze_user_patterns(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    patterns jsonb;
BEGIN
    SELECT jsonb_build_object(
        'most_active_day', (
            SELECT EXTRACT(dow FROM created_at) as day_of_week
            FROM activity_logs
            WHERE user_id = p_user_id
            GROUP BY EXTRACT(dow FROM created_at)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'most_active_hour', (
            SELECT EXTRACT(hour FROM created_at) as hour_of_day
            FROM activity_logs
            WHERE user_id = p_user_id
            GROUP BY EXTRACT(hour FROM created_at)
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ),
        'preferred_actions', (
            SELECT jsonb_object_agg(action, action_count)
            FROM (
                SELECT action, COUNT(*) as action_count
                FROM activity_logs
                WHERE user_id = p_user_id
                GROUP BY action
                ORDER BY action_count DESC
                LIMIT 5
            ) top_actions
        ),
        'social_ratio', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE event_category = 'social')::numeric / 
                 NULLIF(COUNT(*), 0) * 100), 2
            )
            FROM activity_logs
            WHERE user_id = p_user_id
        ),
        'consistency_score', (
            -- Score basé sur la régularité d'utilisation (0-100)
            SELECT CASE 
                WHEN COUNT(DISTINCT created_at::date) = 0 THEN 0
                ELSE LEAST(100, (COUNT(DISTINCT created_at::date) * 10))
            END
            FROM activity_logs
            WHERE user_id = p_user_id
                AND created_at >= current_date - interval '30 days'
        )
    ) INTO patterns;
    
    RETURN patterns;
END;
$$ LANGUAGE plpgsql;

-- 4. FONCTION DE NETTOYAGE AUTOMATIQUE

-- Nettoyer les anciens logs (à appeler périodiquement)
CREATE OR REPLACE FUNCTION cleanup_old_logs(
    p_days_to_keep integer DEFAULT 90
)
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Supprimer les logs de navigation anciens (moins critique)
    DELETE FROM activity_logs
    WHERE event_category = 'navigation'
        AND created_at < current_date - interval '%s days' % (p_days_to_keep / 2);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Supprimer les très anciens logs de debug
    DELETE FROM activity_logs
    WHERE event_level = 'debug'
        AND created_at < current_date - interval '%s days' % p_days_to_keep;
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    -- Log le nettoyage
    PERFORM log_comprehensive_activity(
        'system_cleanup',
        'system',
        'cleanup_logs',
        'Nettoyage automatique des anciens logs',
        NULL,
        'system',
        NULL,
        NULL,
        'Suppression de ' || deleted_count || ' anciens logs',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'days_threshold', p_days_to_keep
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. FONCTIONS DE REPORTING

-- Générer un rapport d'activité pour une période
CREATE OR REPLACE FUNCTION generate_activity_report(
    p_start_date date DEFAULT current_date - interval '7 days',
    p_end_date date DEFAULT current_date
)
RETURNS jsonb AS $$
BEGIN
    RETURN (
        SELECT jsonb_build_object(
            'period', jsonb_build_object(
                'start', p_start_date,
                'end', p_end_date,
                'days', p_end_date - p_start_date
            ),
            'overview', jsonb_build_object(
                'total_activities', COUNT(*),
                'unique_users', COUNT(DISTINCT user_id),
                'successful_actions', COUNT(*) FILTER (WHERE success = true),
                'failed_actions', COUNT(*) FILTER (WHERE success = false),
                'success_rate', ROUND(
                    (COUNT(*) FILTER (WHERE success = true)::numeric / 
                     NULLIF(COUNT(*), 0) * 100), 2
                )
            ),
            'by_category', (
                SELECT jsonb_object_agg(event_category, category_stats)
                FROM (
                    SELECT 
                        event_category,
                        jsonb_build_object(
                            'count', COUNT(*),
                            'unique_users', COUNT(DISTINCT user_id),
                            'success_rate', ROUND(
                                (COUNT(*) FILTER (WHERE success = true)::numeric / 
                                 NULLIF(COUNT(*), 0) * 100), 2
                            )
                        ) as category_stats
                    FROM activity_logs
                    WHERE created_at::date BETWEEN p_start_date AND p_end_date
                    GROUP BY event_category
                ) cat_data
            ),
            'top_users', (
                SELECT jsonb_agg(user_data ORDER BY activity_count DESC)
                FROM (
                    SELECT jsonb_build_object(
                        'user_id', user_id,
                        'user_name', user_display_name,
                        'activity_count', COUNT(*),
                        'success_rate', ROUND(
                            (COUNT(*) FILTER (WHERE success = true)::numeric / 
                             NULLIF(COUNT(*), 0) * 100), 2
                        )
                    ) as user_data,
                    COUNT(*) as activity_count
                    FROM activity_logs
                    WHERE created_at::date BETWEEN p_start_date AND p_end_date
                        AND user_id IS NOT NULL
                    GROUP BY user_id, user_display_name
                    ORDER BY activity_count DESC
                    LIMIT 10
                ) top_data
            )
        )
        FROM activity_logs
        WHERE created_at::date BETWEEN p_start_date AND p_end_date
    );
END;
$$ LANGUAGE plpgsql;

-- Permissions pour les nouvelles fonctions
GRANT EXECUTE ON FUNCTION log_social_action TO authenticated;
GRANT EXECUTE ON FUNCTION log_navigation TO authenticated;
GRANT EXECUTE ON FUNCTION log_error TO authenticated;
GRANT EXECUTE ON FUNCTION get_today_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_user_interactions TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_user_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_logs TO service_role; -- Seulement pour les tâches automatiques
GRANT EXECUTE ON FUNCTION generate_activity_report TO authenticated;

-- Messages de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Fonctions d''aide pour TypeScript créées avec succès !';
    RAISE NOTICE '📊 Fonctions disponibles:';
    RAISE NOTICE '   - log_social_action() : Log d''actions sociales simplifiées';
    RAISE NOTICE '   - log_navigation() : Log de navigation simplifié';
    RAISE NOTICE '   - log_error() : Log d''erreurs simplifié';
    RAISE NOTICE '   - get_today_activity_summary() : Résumé d''activité du jour';
    RAISE NOTICE '   - get_recent_user_interactions() : Interactions récentes entre utilisateurs';
    RAISE NOTICE '   - analyze_user_patterns() : Analyse comportementale';
    RAISE NOTICE '   - cleanup_old_logs() : Nettoyage automatique';
    RAISE NOTICE '   - generate_activity_report() : Rapports d''activité';
    RAISE NOTICE '🚀 Prêt pour intégration TypeScript !';
END $$;
