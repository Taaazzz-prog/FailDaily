-- =========================================
-- BADGES COMPLETS 90+ - FailDaily
-- =========================================
-- Ce script ajoute TOUS les badges manquants pour atteindre 90+
-- Exécuter APRÈS database-complete-data-restore-SIMPLE.sql

-- =========================================
-- BADGES SUPPLÉMENTAIRES POUR ATTEINDRE 90+
-- =========================================

INSERT INTO public.badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value) VALUES

-- === BADGES COURAGE SUPPLÉMENTAIRES (15 badges) ===
('courage-warrior', 'Guerrier du Courage', 'Recevoir 1000 cœurs de courage', 'shield-outline', 'COURAGE', 'legendary', 'reactions_received', 1000),
('courage-legend', 'Légende Vivante', 'Recevoir 2000 cœurs de courage', 'star-half-outline', 'COURAGE', 'legendary', 'reactions_received', 2000),
('fail-master-200', 'Grand Maître', 'Partager 200 fails', 'trophy-outline', 'COURAGE', 'epic', 'fail_count', 200),
('fail-master-500', 'Maître Suprême', 'Partager 500 fails', 'medal-outline', 'COURAGE', 'legendary', 'fail_count', 500),
('fail-master-1000', 'Empereur des Fails', 'Partager 1000 fails', 'crown-outline', 'COURAGE', 'legendary', 'fail_count', 1000),
('courage-monthly', 'Courage Mensuel', 'Partager un fail chaque mois pendant 12 mois', 'calendar-outline', 'COURAGE', 'rare', 'monthly_consistency', 12),
('courage-weekly', 'Courage Hebdomadaire', 'Partager un fail chaque semaine pendant 52 semaines', 'time-outline', 'COURAGE', 'epic', 'weekly_consistency', 52),
('first-reaction', 'Première Réaction', 'Recevoir votre première réaction', 'heart-outline', 'COURAGE', 'common', 'first_reaction', 1),
('reaction-magnet', 'Aimant à Réactions', 'Recevoir 10000 réactions au total', 'magnet-outline', 'COURAGE', 'legendary', 'total_reactions', 10000),
('courage-ambassador', 'Ambassadeur du Courage', 'Inspirer 50 personnes à partager leur premier fail', 'people-outline', 'COURAGE', 'epic', 'inspired_first_fails', 50),
('courage-mentor', 'Mentor du Courage', 'Aider 100 personnes avec des conseils courageux', 'school-outline', 'COURAGE', 'epic', 'courage_advice', 100),
('brave-heart', 'Cœur Brave', 'Partager un fail très personnel', 'heart-half-outline', 'COURAGE', 'rare', 'personal_fail', 1),
('fearless', 'Sans Peur', 'Partager 10 fails difficiles', 'flash-outline', 'COURAGE', 'epic', 'difficult_fails', 10),
('courage-champion', 'Champion du Courage', 'Être dans le top 10 des utilisateurs les plus courageux', 'podium-outline', 'COURAGE', 'legendary', 'courage_ranking', 10),
('daily-courage', 'Courage Quotidien', 'Partager un fail pendant 100 jours non-consécutifs', 'sunny-outline', 'COURAGE', 'epic', 'daily_courage', 100),

-- === BADGES PERSEVERANCE SUPPLÉMENTAIRES (12 badges) ===
('streak-master-200', 'Maître des Séries', '200 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 200),
('streak-legend-500', 'Légende des Séries', '500 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 500),
('comeback-master', 'Maître du Retour', 'Reprendre 5 fois après des pauses', 'refresh-outline', 'PERSEVERANCE', 'epic', 'comeback_count', 5),
('persistence-king', 'Roi de la Persistance', 'Maintenir 10 streaks de plus de 14 jours', 'crown-outline', 'PERSEVERANCE', 'legendary', 'long_streaks', 10),
('never-quit', 'Jamais Abandonner', 'Continuer après 50 échecs', 'shield-checkmark-outline', 'PERSEVERANCE', 'legendary', 'after_failures', 50),
('steady-progress', 'Progrès Constant', 'Améliorer ses stats chaque mois pendant 6 mois', 'trending-up-outline', 'PERSEVERANCE', 'rare', 'monthly_progress', 6),
('endurance-runner', 'Coureur d''Endurance', 'Maintenir une activité constante pendant 2 ans', 'fitness-outline', 'PERSEVERANCE', 'legendary', 'years_active', 2),
('habit-builder', 'Créateur d''Habitudes', 'Créer 5 habitudes positives grâce aux fails', 'checkmark-circle-outline', 'PERSEVERANCE', 'epic', 'habits_created', 5),
('goal-achiever', 'Atteigneur d''Objectifs', 'Atteindre 10 objectifs personnels', 'flag-outline', 'PERSEVERANCE', 'epic', 'goals_achieved', 10),
('milestone-master', 'Maître des Étapes', 'Franchir 25 étapes importantes', 'trophy-outline', 'PERSEVERANCE', 'epic', 'milestones', 25),
('consistency-king', 'Roi de la Régularité', 'Être actif 300 jours dans l''année', 'calendar-outline', 'PERSEVERANCE', 'legendary', 'active_days_year', 300),
('long-term-vision', 'Vision à Long Terme', 'Planifier et atteindre des objectifs sur 5 ans', 'telescope-outline', 'PERSEVERANCE', 'legendary', 'long_term_goals', 5),

-- === BADGES HUMOUR SUPPLÉMENTAIRES (10 badges) ===
('joke-master', 'Maître de la Blague', 'Faire rire avec 100 fails drôles', 'happy-outline', 'HUMOUR', 'epic', 'funny_fails', 100),
('comedy-genius', 'Génie de la Comédie', 'Créer 10 fails viraux drôles', 'bulb-outline', 'HUMOUR', 'legendary', 'viral_funny', 10),
('smile-bringer', 'Apporteur de Sourires', 'Faire sourire 1000 personnes', 'sunny-outline', 'HUMOUR', 'epic', 'smiles_brought', 1000),
('laughter-healer', 'Guérisseur par le Rire', 'Aider 50 personnes à surmonter des difficultés par l''humour', 'medical-outline', 'HUMOUR', 'epic', 'humor_healing', 50),
('wit-master', 'Maître de l''Esprit', 'Créer 500 commentaires drôles', 'chatbox-outline', 'HUMOUR', 'epic', 'funny_comments', 500),
('meme-creator', 'Créateur de Mèmes', 'Créer 25 fails qui deviennent des mèmes', 'image-outline', 'HUMOUR', 'rare', 'memes_created', 25),
('comic-relief', 'Soulagement Comique', 'Détendre l''atmosphère dans 100 situations tendues', 'leaf-outline', 'HUMOUR', 'epic', 'tension_relief', 100),
('humor-therapist', 'Thérapeute de l''Humour', 'Utiliser l''humour pour aider 200 personnes', 'heart-outline', 'HUMOUR', 'legendary', 'humor_therapy', 200),
('laugh-track', 'Piste de Rire', 'Générer 10000 éclats de rire', 'musical-note-outline', 'HUMOUR', 'legendary', 'laughs_generated', 10000),
('comedy-hall-of-fame', 'Temple de la Comédie', 'Être reconnu comme légende de l''humour', 'star-outline', 'HUMOUR', 'legendary', 'comedy_legend', 1),

-- === BADGES ENTRAIDE SUPPLÉMENTAIRES (15 badges) ===
('super-helper', 'Super Assistant', 'Aider 100 membres de la communauté', 'hand-right-outline', 'ENTRAIDE', 'epic', 'help_count', 100),
('kindness-ambassador', 'Ambassadeur de la Gentillesse', 'Répandre la gentillesse pendant 365 jours', 'heart-outline', 'ENTRAIDE', 'legendary', 'kindness_days', 365),
('support-network', 'Réseau de Soutien', 'Créer un réseau de soutien de 50 personnes', 'people-circle-outline', 'ENTRAIDE', 'epic', 'support_network', 50),
('empathy-master', 'Maître de l''Empathie', 'Donner 1000 réactions d''empathie', 'heart-half-outline', 'ENTRAIDE', 'epic', 'empathy_given', 1000),
('counselor-supreme', 'Conseiller Suprême', 'Donner des conseils constructifs à 500 personnes', 'school-outline', 'ENTRAIDE', 'legendary', 'advice_given', 500),
('community-builder', 'Bâtisseur de Communauté', 'Créer 10 groupes de soutien', 'home-outline', 'ENTRAIDE', 'epic', 'groups_created', 10),
('bridge-builder', 'Constructeur de Ponts', 'Réconcilier 25 conflits', 'git-merge-outline', 'ENTRAIDE', 'rare', 'conflicts_resolved', 25),
('hope-giver', 'Donneur d''Espoir', 'Redonner espoir à 100 personnes', 'sunny-outline', 'ENTRAIDE', 'epic', 'hope_given', 100),
('volunteer-hero', 'Héros Bénévole', 'Faire du bénévolat 500 heures', 'time-outline', 'ENTRAIDE', 'legendary', 'volunteer_hours', 500),
('charity-champion', 'Champion de la Charité', 'Organiser 10 actions caritatives', 'gift-outline', 'ENTRAIDE', 'epic', 'charity_events', 10),
('mentor-supreme', 'Mentor Suprême', 'Mentorer 50 nouveaux utilisateurs', 'school-outline', 'ENTRAIDE', 'legendary', 'mentored_users', 50),
('peace-maker', 'Artisan de Paix', 'Apporter la paix dans 100 situations', 'leaf-outline', 'ENTRAIDE', 'epic', 'peace_brought', 100),
('love-spreader', 'Répandeur d''Amour', 'Répandre l''amour et la positivité', 'heart-outline', 'ENTRAIDE', 'legendary', 'love_spread', 1000),
('unity-builder', 'Bâtisseur d''Unité', 'Unir 200 personnes autour de causes communes', 'people-outline', 'ENTRAIDE', 'legendary', 'unity_built', 200),
('compassion-master', 'Maître de la Compassion', 'Montrer de la compassion dans 1000 interactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'compassion_shown', 1000),

-- === BADGES RESILIENCE SUPPLÉMENTAIRES (12 badges) ===
('resilience-master', 'Maître de la Résilience', 'Surmonter 100 défis majeurs', 'shield-outline', 'RESILIENCE', 'legendary', 'major_challenges', 100),
('comeback-legend', 'Légende du Retour', 'Revenir plus fort après 25 échecs majeurs', 'arrow-up-outline', 'RESILIENCE', 'legendary', 'major_comebacks', 25),
('stress-warrior', 'Guerrier du Stress', 'Gérer le stress pendant 200 jours difficiles', 'fitness-outline', 'RESILIENCE', 'epic', 'stress_days', 200),
('adaptation-master', 'Maître de l''Adaptation', 'S''adapter à 50 changements majeurs', 'refresh-outline', 'RESILIENCE', 'epic', 'adaptations', 50),
('growth-mindset', 'Mentalité de Croissance', 'Transformer 100 échecs en apprentissages', 'trending-up-outline', 'RESILIENCE', 'epic', 'learning_from_failure', 100),
('inner-strength', 'Force Intérieure', 'Puiser dans sa force intérieure 500 fois', 'fitness-outline', 'RESILIENCE', 'legendary', 'inner_strength', 500),
('crisis-manager', 'Gestionnaire de Crise', 'Gérer 25 crises personnelles', 'alert-outline', 'RESILIENCE', 'epic', 'crises_managed', 25),
('transformation-master', 'Maître de la Transformation', 'Se transformer positivement 10 fois', 'refresh-outline', 'RESILIENCE', 'legendary', 'transformations', 10),
('endurance-champion', 'Champion d''Endurance', 'Endurer 365 jours de difficultés', 'time-outline', 'RESILIENCE', 'legendary', 'endurance_days', 365),
('recovery-expert', 'Expert en Récupération', 'Récupérer rapidement de 50 échecs', 'medical-outline', 'RESILIENCE', 'epic', 'quick_recoveries', 50),
('strength-builder', 'Bâtisseur de Force', 'Développer sa force mentale sur 2 ans', 'barbell-outline', 'RESILIENCE', 'legendary', 'strength_years', 2),
('wisdom-keeper', 'Gardien de la Sagesse', 'Acquérir la sagesse de 1000 expériences', 'library-outline', 'RESILIENCE', 'legendary', 'wisdom_experiences', 1000),

-- === BADGES SPECIAL SUPPLÉMENTAIRES (20 badges) ===
('anniversary-veteran', 'Vétéran Anniversaire', 'Célébrer 5 anniversaires de FailDaily', 'cake-outline', 'SPECIAL', 'legendary', 'anniversaries', 5),
('season-master', 'Maître des Saisons', 'Être actif pendant toutes les saisons', 'leaf-outline', 'SPECIAL', 'rare', 'seasons_active', 4),
('time-traveler', 'Voyageur du Temps', 'Partager des fails à toutes les heures de la journée', 'time-outline', 'SPECIAL', 'epic', 'all_hours', 24),
('world-explorer', 'Explorateur Mondial', 'Partager des fails de 25 pays', 'earth-outline', 'SPECIAL', 'legendary', 'countries_visited', 25),
('culture-bridge', 'Pont Culturel', 'Connecter 10 cultures différentes', 'people-circle-outline', 'SPECIAL', 'epic', 'cultures_connected', 10),
('language-master', 'Maître des Langues', 'Partager des fails en 5 langues', 'chatbox-outline', 'SPECIAL', 'rare', 'languages_used', 5),
('innovation-pioneer', 'Pionnier de l''Innovation', 'Proposer 10 nouvelles fonctionnalités', 'bulb-outline', 'SPECIAL', 'epic', 'features_proposed', 10),
('community-founder', 'Fondateur de Communauté', 'Créer une communauté de 1000 membres', 'people-outline', 'SPECIAL', 'legendary', 'community_size', 1000),
('trend-prophet', 'Prophète des Tendances', 'Prédire 10 tendances futures', 'eye-outline', 'SPECIAL', 'epic', 'trends_predicted', 10),
('viral-master', 'Maître du Viral', 'Créer 5 contenus viraux', 'flash-outline', 'SPECIAL', 'legendary', 'viral_content', 5),
('influence-master', 'Maître d''Influence', 'Influencer positivement 10000 personnes', 'megaphone-outline', 'SPECIAL', 'legendary', 'people_influenced', 10000),
('legacy-builder', 'Bâtisseur d''Héritage', 'Créer un héritage durable', 'library-outline', 'SPECIAL', 'legendary', 'legacy_built', 1),
('change-maker', 'Faiseur de Changement', 'Initier 25 changements positifs', 'refresh-outline', 'SPECIAL', 'epic', 'changes_initiated', 25),
('vision-keeper', 'Gardien de Vision', 'Maintenir une vision claire pendant 5 ans', 'eye-outline', 'SPECIAL', 'legendary', 'vision_years', 5),
('dream-achiever', 'Réalisateur de Rêves', 'Réaliser 100 rêves personnels', 'star-outline', 'SPECIAL', 'legendary', 'dreams_achieved', 100),
('magic-maker', 'Faiseur de Magie', 'Créer de la magie dans 500 moments', 'sparkles-outline', 'SPECIAL', 'legendary', 'magic_moments', 500),
('miracle-worker', 'Travailleur de Miracles', 'Accomplir 10 miracles personnels', 'flash-outline', 'SPECIAL', 'legendary', 'miracles', 10),
('legend-maker', 'Créateur de Légendes', 'Devenir une légende vivante', 'trophy-outline', 'SPECIAL', 'legendary', 'legend_status', 1),
('immortal-spirit', 'Esprit Immortel', 'Laisser une marque éternelle', 'infinite-outline', 'SPECIAL', 'legendary', 'immortal_impact', 1),
('universe-changer', 'Changeur d''Univers', 'Changer l''univers d''une personne', 'planet-outline', 'SPECIAL', 'legendary', 'universe_changed', 1)

ON CONFLICT (id) DO NOTHING;

-- =========================================
-- VÉRIFICATION FINALE
-- =========================================

-- Compter le nombre total de badges
SELECT 
    'BADGES TOTAUX' as status,
    COUNT(*) as total_badges,
    COUNT(DISTINCT category) as categories_count
FROM public.badge_definitions;

-- Compter par catégorie
SELECT 
    'BADGES PAR CATÉGORIE' as status,
    category,
    COUNT(*) as badge_count
FROM public.badge_definitions
GROUP BY category
ORDER BY badge_count DESC;

-- =========================================
-- BADGES COMPLETS 90+ TERMINÉ !
-- =========================================

-- 🎉 SUCCÈS ! 🎉
-- Vous avez maintenant 90+ badges dans votre système :
-- 
-- ✅ COURAGE: 26 badges (11 originaux + 15 nouveaux)
-- ✅ PERSEVERANCE: 22 badges (10 originaux + 12 nouveaux)  
-- ✅ HUMOUR: 18 badges (8 originaux + 10 nouveaux)
-- ✅ ENTRAIDE: 24 badges (9 originaux + 15 nouveaux)
-- ✅ RESILIENCE: 19 badges (7 originaux + 12 nouveaux)
-- ✅ SPECIAL: 28 badges (8 originaux + 20 nouveaux)
-- 
-- TOTAL: 137 BADGES DISPONIBLES !
-- 
-- Votre système de badges est maintenant ultra-complet avec plus de 90 badges !