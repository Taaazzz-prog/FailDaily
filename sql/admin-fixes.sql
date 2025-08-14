-- ===== CORRECTION DES DONNÉES MANQUANTES =====

-- Fonction pour peupler rétroactivement les activités utilisateurs manquantes
CREATE OR REPLACE FUNCTION populate_missing_activities()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Ajouter les activités pour tous les fails existants
    INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id)
    SELECT DISTINCT
        f.user_id,
        p.email,
        p.display_name,
        'create_fail',
        jsonb_build_object(
            'fail_id', f.id,
            'fail_title', f.title,
            'fail_category', f.category,
            'is_public', f.is_public,
            'retroactive', true
        ),
        f.id
    FROM fails f
    JOIN profiles p ON p.id = f.user_id
    LEFT JOIN user_activities ua ON ua.fail_id = f.id AND ua.action = 'create_fail'
    WHERE ua.id IS NULL;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    -- Ajouter les activités pour toutes les réactions existantes
    INSERT INTO user_activities (user_id, user_email, user_name, action, details, fail_id, reaction_type)
    SELECT DISTINCT
        r.user_id,
        p.email,
        p.display_name,
        'add_reaction',
        jsonb_build_object(
            'reaction_id', r.id,
            'reaction_type', r.reaction_type,
            'fail_id', r.fail_id,
            'retroactive', true
        ),
        r.fail_id,
        r.reaction_type
    FROM reactions r
    JOIN profiles p ON p.id = r.user_id
    LEFT JOIN user_activities ua ON ua.user_id = r.user_id 
        AND ua.fail_id = r.fail_id 
        AND ua.reaction_type = r.reaction_type 
        AND ua.action = 'add_reaction'
    WHERE ua.id IS NULL;

    GET DIAGNOSTICS inserted_count = inserted_count + ROW_COUNT;

    -- Ajouter les logs de réactions manquants
    INSERT INTO reaction_logs (
        user_id, user_email, user_name, fail_id, fail_title, 
        fail_author_name, reaction_type, points_awarded
    )
    SELECT DISTINCT
        r.user_id,
        p.email,
        p.display_name,
        r.fail_id,
        f.title,
        author.display_name,
        r.reaction_type,
        CASE r.reaction_type
            WHEN 'courage' THEN 2
            WHEN 'empathy' THEN 2
            WHEN 'support' THEN 2
            WHEN 'laugh' THEN 1
            ELSE 1
        END
    FROM reactions r
    JOIN profiles p ON p.id = r.user_id
    JOIN fails f ON f.id = r.fail_id
    JOIN profiles author ON author.id = f.user_id
    LEFT JOIN reaction_logs rl ON rl.user_id = r.user_id 
        AND rl.fail_id = r.fail_id 
        AND rl.reaction_type = r.reaction_type
    WHERE rl.id IS NULL;

    RETURN inserted_count;
END;
$$;

-- Fonction pour obtenir les détails des compteurs invalides
CREATE OR REPLACE FUNCTION get_invalid_counters_details()
RETURNS TABLE(
    fail_id UUID,
    fail_title TEXT,
    fail_author TEXT,
    stored_courage INTEGER,
    actual_courage BIGINT,
    stored_laugh INTEGER,
    actual_laugh BIGINT,
    stored_empathy INTEGER,
    actual_empathy BIGINT,
    stored_support INTEGER,
    actual_support BIGINT,
    discrepancy TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH reaction_counts AS (
        SELECT 
            f.id,
            f.title,
            author.display_name as author_name,
            COALESCE((f.reactions->>'courage')::integer, 0) as stored_courage,
            COALESCE((f.reactions->>'laugh')::integer, 0) as stored_laugh,
            COALESCE((f.reactions->>'empathy')::integer, 0) as stored_empathy,
            COALESCE((f.reactions->>'support')::integer, 0) as stored_support,
            COUNT(CASE WHEN r.reaction_type = 'courage' THEN 1 END) as actual_courage,
            COUNT(CASE WHEN r.reaction_type = 'laugh' THEN 1 END) as actual_laugh,
            COUNT(CASE WHEN r.reaction_type = 'empathy' THEN 1 END) as actual_empathy,
            COUNT(CASE WHEN r.reaction_type = 'support' THEN 1 END) as actual_support
        FROM fails f
        JOIN profiles author ON author.id = f.user_id
        LEFT JOIN reactions r ON f.id = r.fail_id
        GROUP BY f.id, f.title, f.reactions, author.display_name
    )
    SELECT 
        id as fail_id,
        title as fail_title,
        author_name as fail_author,
        stored_courage,
        actual_courage,
        stored_laugh,
        actual_laugh,
        stored_empathy,
        actual_empathy,
        stored_support,
        actual_support,
        ARRAY[
            CASE WHEN stored_courage != actual_courage THEN 'courage: ' || stored_courage || ' vs ' || actual_courage ELSE NULL END,
            CASE WHEN stored_laugh != actual_laugh THEN 'laugh: ' || stored_laugh || ' vs ' || actual_laugh ELSE NULL END,
            CASE WHEN stored_empathy != actual_empathy THEN 'empathy: ' || stored_empathy || ' vs ' || actual_empathy ELSE NULL END,
            CASE WHEN stored_support != actual_support THEN 'support: ' || stored_support || ' vs ' || actual_support ELSE NULL END
        ]::TEXT[] as discrepancy
    FROM reaction_counts
    WHERE stored_courage != actual_courage 
       OR stored_laugh != actual_laugh
       OR stored_empathy != actual_empathy
       OR stored_support != actual_support;
$$;

-- Fonction pour corriger automatiquement les compteurs
CREATE OR REPLACE FUNCTION fix_reaction_counters()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    fixed_count INTEGER := 0;
BEGIN
    -- Mettre à jour tous les compteurs avec les vraies valeurs
    WITH reaction_counts AS (
        SELECT 
            f.id,
            COALESCE(COUNT(CASE WHEN r.reaction_type = 'courage' THEN 1 END), 0) as courage_count,
            COALESCE(COUNT(CASE WHEN r.reaction_type = 'laugh' THEN 1 END), 0) as laugh_count,
            COALESCE(COUNT(CASE WHEN r.reaction_type = 'empathy' THEN 1 END), 0) as empathy_count,
            COALESCE(COUNT(CASE WHEN r.reaction_type = 'support' THEN 1 END), 0) as support_count
        FROM fails f
        LEFT JOIN reactions r ON f.id = r.fail_id
        GROUP BY f.id
    )
    UPDATE fails 
    SET reactions = jsonb_build_object(
        'courage', rc.courage_count,
        'laugh', rc.laugh_count,
        'empathy', rc.empathy_count,
        'support', rc.support_count
    )
    FROM reaction_counts rc
    WHERE fails.id = rc.id
    AND (
        COALESCE((fails.reactions->>'courage')::integer, 0) != rc.courage_count OR
        COALESCE((fails.reactions->>'laugh')::integer, 0) != rc.laugh_count OR
        COALESCE((fails.reactions->>'empathy')::integer, 0) != rc.empathy_count OR
        COALESCE((fails.reactions->>'support')::integer, 0) != rc.support_count
    );

    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RETURN fixed_count;
END;
$$;

-- Fonction pour obtenir les dernières activités en temps réel
CREATE OR REPLACE FUNCTION get_realtime_activities(limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
    id UUID,
    user_name TEXT,
    action TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ,
    fail_id UUID,
    reaction_type TEXT,
    event_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Union de toutes les activités récentes
    SELECT 
        ua.id,
        ua.user_name,
        ua.action,
        ua.details,
        ua.timestamp,
        ua.fail_id,
        ua.reaction_type,
        'user_activity' as event_type
    FROM user_activities ua
    WHERE ua.timestamp >= NOW() - INTERVAL '1 hour'
    
    UNION ALL
    
    SELECT 
        rl.id,
        rl.user_name,
        'reaction_logged' as action,
        jsonb_build_object(
            'reaction_type', rl.reaction_type,
            'fail_title', rl.fail_title,
            'points_awarded', rl.points_awarded
        ) as details,
        rl.timestamp,
        rl.fail_id,
        rl.reaction_type,
        'reaction_log' as event_type
    FROM reaction_logs rl
    WHERE rl.timestamp >= NOW() - INTERVAL '1 hour'
    
    UNION ALL
    
    SELECT 
        sl.id,
        'System' as user_name,
        sl.action || '_system' as action,
        sl.details,
        sl.timestamp,
        NULL as fail_id,
        NULL as reaction_type,
        'system_log' as event_type
    FROM system_logs sl
    WHERE sl.timestamp >= NOW() - INTERVAL '1 hour'
    AND sl.level IN ('info', 'warning', 'error')
    
    ORDER BY timestamp DESC
    LIMIT limit_count;
$$;
