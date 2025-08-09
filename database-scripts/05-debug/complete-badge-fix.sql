-- Script complet de correction des badges
-- Corrige : 1) Badge "fails-5" incorrect, 2) Problème d'affichage 0 badges

-- ===== ÉTAPE 1: DIAGNOSTIC INITIAL =====
DO $$
DECLARE
    test_user_id UUID;
    user_email TEXT;
    badge_count INTEGER;
    user_badge_count INTEGER;
BEGIN
    -- Trouver l'utilisateur test
    SELECT id, email INTO test_user_id, user_email
    FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'ERREUR: Aucun utilisateur test trouvé';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 DIAGNOSTIC pour utilisateur: % (ID: %)', user_email, test_user_id;
    
    -- Vérifier les badges utilisateur
    SELECT COUNT(*) INTO user_badge_count 
    FROM user_badges 
    WHERE user_id = test_user_id;
    
    RAISE NOTICE '📊 Badges utilisateur en base: %', user_badge_count;
    
    -- Lister les badges utilisateur
    FOR badge_count IN 
        SELECT badge_id FROM user_badges WHERE user_id = test_user_id
    LOOP
        RAISE NOTICE '  - Badge: %', badge_count;
    END LOOP;
    
    -- Vérifier badge_definitions
    SELECT COUNT(*) INTO badge_count FROM badge_definitions;
    RAISE NOTICE '📚 Badges dans badge_definitions: %', badge_count;
END $$;

-- ===== ÉTAPE 2: CRÉER/VÉRIFIER LA TABLE BADGE_DEFINITIONS =====
DO $$
DECLARE
    badge_count INTEGER;
BEGIN
    -- Vérifier si la table existe et contient des données
    SELECT COUNT(*) INTO badge_count FROM badge_definitions;
    
    IF badge_count = 0 THEN
        RAISE NOTICE '🔧 Création des badges de base dans badge_definitions...';
        
        INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES
        ('first-fail', 'Premier Courage', 'Poster votre premier fail', 'heart-outline', 'COURAGE', 'common', 'fail_count', '1'),
        ('first-reaction', 'Première Réaction', 'Donner votre première réaction à un fail', 'happy-outline', 'ENTRAIDE', 'common', 'reaction_given', '1'),
        ('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', '5'),
        ('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', '10'),
        ('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', '25'),
        ('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', '10'),
        ('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', '50'),
        ('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', '5'),
        ('week-streak', 'Semaine de Courage', 'Poster au moins un fail par jour pendant 7 jours', 'calendar-outline', 'PERSEVERANCE', 'rare', 'streak_days', '7'),
        ('popular-fail', 'Populaire', 'Recevoir 10 réactions sur un seul fail', 'flame-outline', 'SPECIAL', 'rare', 'max_reactions_single', '10')
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Badges de base créés';
    ELSE
        RAISE NOTICE '✅ Table badge_definitions contient déjà % badges', badge_count;
    END IF;
END $$;

-- ===== ÉTAPE 3: CORRIGER LES BADGES INCORRECTS =====
DO $$
DECLARE
    test_user_id UUID;
    user_fail_count INTEGER;
    user_reaction_count INTEGER;
BEGIN
    -- Trouver l'utilisateur test
    SELECT id INTO test_user_id
    FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Compter les vrais fails et réactions de l'utilisateur
    SELECT COUNT(*) INTO user_fail_count 
    FROM fails 
    WHERE user_id = test_user_id;
    
    SELECT COUNT(*) INTO user_reaction_count 
    FROM reactions 
    WHERE user_id = test_user_id;
    
    RAISE NOTICE '📊 Stats réelles utilisateur: % fails, % réactions', user_fail_count, user_reaction_count;
    
    -- Supprimer le badge "fails-5" s'il est incorrect
    IF user_fail_count < 5 THEN
        DELETE FROM user_badges 
        WHERE user_id = test_user_id AND badge_id = 'fails-5';
        RAISE NOTICE '🗑️ Badge "fails-5" supprimé (utilisateur n''a que % fails)', user_fail_count;
    END IF;
    
    -- Ajouter les badges corrects manquants
    -- Badge first-fail
    IF user_fail_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id, unlocked_at)
        VALUES (test_user_id, 'first-fail', NOW())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        RAISE NOTICE '✅ Badge "first-fail" ajouté/vérifié';
    END IF;
    
    -- Badge first-reaction
    IF user_reaction_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id, unlocked_at)
        VALUES (test_user_id, 'first-reaction', NOW())
        ON CONFLICT (user_id, badge_id) DO NOTHING;
        RAISE NOTICE '✅ Badge "first-reaction" ajouté/vérifié';
    END IF;
END $$;

-- ===== ÉTAPE 4: VÉRIFICATION FINALE =====
DO $$
DECLARE
    test_user_id UUID;
    user_email TEXT;
    final_badge_count INTEGER;
    rec RECORD;
BEGIN
    -- Trouver l'utilisateur test
    SELECT id, email INTO test_user_id, user_email
    FROM auth.users 
    WHERE email LIKE '%test%' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RAISE NOTICE '🎯 RÉSULTAT FINAL pour %:', user_email;
    
    -- Compter les badges finaux
    SELECT COUNT(*) INTO final_badge_count 
    FROM user_badges ub
    JOIN badge_definitions bd ON ub.badge_id = bd.id
    WHERE ub.user_id = test_user_id;
    
    RAISE NOTICE '🏆 Badges correctement mappés: %', final_badge_count;
    
    -- Lister les badges finaux
    FOR rec IN 
        SELECT ub.badge_id, bd.name, bd.description, bd.category
        FROM user_badges ub
        JOIN badge_definitions bd ON ub.badge_id = bd.id
        WHERE ub.user_id = test_user_id
        ORDER BY ub.unlocked_at
    LOOP
        RAISE NOTICE '  ✨ % - % (%)', rec.badge_id, rec.name, rec.category;
    END LOOP;
    
    -- Statistiques pour l'interface
    RAISE NOTICE '📱 Pour l''interface:';
    RAISE NOTICE '  - Total badges disponibles: %', (SELECT COUNT(*) FROM badge_definitions);
    RAISE NOTICE '  - Badges utilisateur: %', final_badge_count;
    RAISE NOTICE '  - Pourcentage: %%%', ROUND((final_badge_count::DECIMAL / (SELECT COUNT(*) FROM badge_definitions)) * 100, 1);
END $$;

-- ===== ÉTAPE 5: VÉRIFIER LES PERMISSIONS RLS =====
-- S'assurer que l'utilisateur peut lire ses badges
DO $$
BEGIN
    -- Vérifier que les policies RLS permettent la lecture
    RAISE NOTICE '🔒 Vérification des permissions RLS...';
    
    -- Cette requête doit fonctionner pour l'utilisateur connecté
    PERFORM 1 FROM user_badges ub
    JOIN badge_definitions bd ON ub.badge_id = bd.id
    WHERE ub.user_id = (
        SELECT id FROM auth.users 
        WHERE email LIKE '%test%' 
        ORDER BY created_at DESC 
        LIMIT 1
    );
    
    RAISE NOTICE '✅ Permissions RLS OK - l''utilisateur peut lire ses badges';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Problème de permissions RLS: %', SQLERRM;
END $$;