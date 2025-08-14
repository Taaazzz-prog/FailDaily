-- Fonction pour trouver les réactions orphelines
DROP FUNCTION IF EXISTS find_orphaned_reactions();
CREATE FUNCTION find_orphaned_reactions()
RETURNS TABLE (
    reaction_id uuid,
    fail_id uuid,
    user_id uuid,
    reaction_type text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as reaction_id,
        r.fail_id,
        r.user_id,
        r.reaction_type,
        r.created_at
    FROM reactions r
    LEFT JOIN fails f ON r.fail_id = f.id
    WHERE f.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour trouver les compteurs invalides
DROP FUNCTION IF EXISTS find_invalid_reaction_counts();
CREATE FUNCTION find_invalid_reaction_counts()
RETURNS TABLE (
    fail_id uuid,
    fail_title text,
    stored_courage integer,
    actual_courage bigint,
    stored_laugh integer,
    actual_laugh bigint,
    stored_empathy integer,
    actual_empathy bigint,
    stored_support integer,
    actual_support bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as fail_id,
        f.title as fail_title,
        f.courage_count as stored_courage,
        COALESCE(courage_stats.count, 0) as actual_courage,
        f.laugh_count as stored_laugh,
        COALESCE(laugh_stats.count, 0) as actual_laugh,
        f.empathy_count as stored_empathy,
        COALESCE(empathy_stats.count, 0) as actual_empathy,
        f.support_count as stored_support,
        COALESCE(support_stats.count, 0) as actual_support
    FROM fails f
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'courage' 
        GROUP BY fail_id
    ) courage_stats ON f.id = courage_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'laugh' 
        GROUP BY fail_id
    ) laugh_stats ON f.id = laugh_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'empathy' 
        GROUP BY fail_id
    ) empathy_stats ON f.id = empathy_stats.fail_id
    LEFT JOIN (
        SELECT fail_id, COUNT(*) as count
        FROM reactions 
        WHERE reaction_type = 'support' 
        GROUP BY fail_id
    ) support_stats ON f.id = support_stats.fail_id
    WHERE 
        f.courage_count != COALESCE(courage_stats.count, 0) OR
        f.laugh_count != COALESCE(laugh_stats.count, 0) OR
        f.empathy_count != COALESCE(empathy_stats.count, 0) OR
        f.support_count != COALESCE(support_stats.count, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour corriger les compteurs de réactions
CREATE OR REPLACE FUNCTION fix_reaction_counts(fail_id uuid)
RETURNS void AS $$
DECLARE
    courage_count integer;
    laugh_count integer;
    empathy_count integer;
    support_count integer;
BEGIN
    -- Compter les vraies réactions
    SELECT COUNT(*) INTO courage_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'courage';
    
    SELECT COUNT(*) INTO laugh_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'laugh';
    
    SELECT COUNT(*) INTO empathy_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'empathy';
    
    SELECT COUNT(*) INTO support_count
    FROM reactions 
    WHERE fail_id = fix_reaction_counts.fail_id AND reaction_type = 'support';
    
    -- Mettre à jour les compteurs
    UPDATE fails SET 
        courage_count = fix_reaction_counts.courage_count,
        laugh_count = fix_reaction_counts.laugh_count,
        empathy_count = fix_reaction_counts.empathy_count,
        support_count = fix_reaction_counts.support_count
    WHERE id = fix_reaction_counts.fail_id;
END;
$$ LANGUAGE plpgsql;
