-- =====================================================
-- IMPORT COMPLET DE TOUTES LES DONNÉES EN ORDRE CORRECT
-- =====================================================

-- 1. BADGE_DEFINITIONS (pas de dépendances)
INSERT INTO badge_definitions (id, name, description, icon, category, rarity, requirement_type, requirement_value, created_at) VALUES 
('first-fail', 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'common', 'fail_count', 1, '2025-08-08 16:22:31.212048+00'::timestamptz), 
('fail-master-5', 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-08 16:22:31.212048+00'::timestamptz), 
('fail-master-10', 'Collectionneur', 'Partager 10 fails', 'library-outline', 'COURAGE', 'common', 'fail_count', 10, '2025-08-08 16:22:31.212048+00'::timestamptz), 
('courage-hearts-10', 'Cœur Brave', 'Recevoir 10 cœurs de courage', 'heart-outline', 'COURAGE', 'common', 'reactions_received', 10, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('courage-hearts-50', 'Cœur Courageux', 'Recevoir 50 cœurs de courage', 'heart-outline', 'COURAGE', 'rare', 'reactions_received', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('courage-hearts-100', 'Héros du Courage', 'Recevoir 100 cœurs de courage', 'medal-outline', 'COURAGE', 'epic', 'reactions_received', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('courage-hearts-500', 'Légende du Courage', 'Recevoir 500 cœurs de courage', 'trophy-outline', 'COURAGE', 'legendary', 'reactions_received', 500, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('fail-master-25', 'Narrateur', 'Partager 25 fails', 'book-outline', 'COURAGE', 'rare', 'fail_count', 25, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('fail-master-50', 'Grand Collectionneur', 'Partager 50 fails', 'albums-outline', 'COURAGE', 'rare', 'fail_count', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('fail-master-100', 'Maître des Fails', 'Partager 100 fails', 'ribbon-outline', 'COURAGE', 'epic', 'fail_count', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('fail-master-365', 'Chroniqueur Légendaire', 'Partager 365 fails (un an !)', 'calendar-number-outline', 'COURAGE', 'legendary', 'fail_count', 365, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-3', 'Régulier', '3 jours de partage consécutifs', 'checkmark-outline', 'PERSEVERANCE', 'common', 'streak_days', 3, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-7', 'Persévérant', '7 jours de partage consécutifs', 'calendar-outline', 'PERSEVERANCE', 'common', 'streak_days', 7, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-14', 'Déterminé', '14 jours de partage consécutifs', 'flame-outline', 'PERSEVERANCE', 'rare', 'streak_days', 14, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-30', 'Marathonien', '30 jours de partage consécutifs', 'fitness-outline', 'PERSEVERANCE', 'rare', 'streak_days', 30, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-60', 'Titan de la Régularité', '60 jours de partage consécutifs', 'barbell-outline', 'PERSEVERANCE', 'epic', 'streak_days', 60, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-100', 'Centurion', '100 jours de partage consécutifs', 'shield-outline', 'PERSEVERANCE', 'epic', 'streak_days', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('daily-streak-365', 'Immortel', '365 jours de partage consécutifs', 'infinite-outline', 'PERSEVERANCE', 'legendary', 'streak_days', 365, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('comeback-king', 'Roi du Comeback', 'Reprendre après une pause de 30 jours', 'refresh-outline', 'PERSEVERANCE', 'rare', 'comeback_count', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('never-give-up', 'Jamais Abandonner', 'Maintenir 5 streaks de plus de 7 jours', 'flag-outline', 'PERSEVERANCE', 'epic', 'long_streaks', 5, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('iron-will', 'Volonté de Fer', 'Repartager après 10 échecs consécutifs', 'hammer-outline', 'PERSEVERANCE', 'legendary', 'resilience_count', 10, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('funny-fail', 'Comédien Amateur', 'Un fail qui a fait rire 25 personnes', 'happy-outline', 'HUMOUR', 'common', 'laugh_reactions', 25, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('comedian', 'Comédien', 'Un fail qui a fait rire 50 personnes', 'theater-outline', 'HUMOUR', 'rare', 'laugh_reactions', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('humor-king', 'Roi du Rire', 'Un fail qui a fait rire 100 personnes', 'sparkles-outline', 'HUMOUR', 'epic', 'laugh_reactions', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('viral-laugh', 'Sensation Virale', 'Un fail qui a fait rire 500 personnes', 'trending-up-outline', 'HUMOUR', 'legendary', 'laugh_reactions', 500, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('class-clown', 'Rigolo de Service', 'Recevoir 100 réactions de rire au total', 'musical-note-outline', 'HUMOUR', 'rare', 'total_laughs', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('stand-up-master', 'Maître du Stand-Up', 'Recevoir 500 réactions de rire au total', 'mic-outline', 'HUMOUR', 'epic', 'total_laughs', 500, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('laughter-legend', 'Légende du Rire', 'Recevoir 1000 réactions de rire au total', 'star-outline', 'HUMOUR', 'legendary', 'total_laughs', 1000, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('mood-lifter', 'Remonteur de Moral', '50 fails marqués comme "drôles"', 'sunny-outline', 'HUMOUR', 'epic', 'funny_fails', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('supportive-soul', 'Âme Bienveillante', 'Donner 50 réactions de soutien', 'heart-half-outline', 'ENTRAIDE', 'common', 'support_given', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('empathy-expert', 'Expert en Empathie', 'Donner 25 réactions d''empathie', 'sad-outline', 'ENTRAIDE', 'common', 'empathy_given', 25, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('community-helper', 'Assistant Communautaire', 'Aider 10 membres de la communauté', 'people-outline', 'ENTRAIDE', 'rare', 'help_count', 10, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('guardian-angel', 'Ange Gardien', 'Aider 25 membres de la communauté', 'medical-outline', 'ENTRAIDE', 'epic', 'help_count', 25, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('mentor', 'Mentor', 'Commenter constructivement 100 fails', 'chatbox-outline', 'ENTRAIDE', 'rare', 'helpful_comments', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('wise-counselor', 'Conseiller Sage', 'Commenter constructivement 250 fails', 'library-outline', 'ENTRAIDE', 'epic', 'helpful_comments', 250, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('community-pillar', 'Pilier de la Communauté', 'Être actif pendant 6 mois consécutifs', 'home-outline', 'ENTRAIDE', 'legendary', 'active_months', 6, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('good-vibes', 'Bonnes Vibrations', 'Donner 1000 réactions positives au total', 'thumbs-up-outline', 'ENTRAIDE', 'epic', 'positive_reactions', 1000, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('life-coach', 'Coach de Vie', 'Aider 100 personnes avec des conseils', 'fitness-outline', 'ENTRAIDE', 'legendary', 'advice_given', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('bounce-back', 'Rebond', 'Se relever après un fail difficile', 'arrow-up-outline', 'RESILIENCE', 'common', 'bounce_back_count', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('resilience-rookie', 'Apprenti Résilient', 'Partager 5 fails de résilience', 'leaf-outline', 'RESILIENCE', 'common', 'resilience_fails', 5, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('resilience-champion', 'Champion de Résilience', 'Partager 20 fails de résilience', 'refresh-outline', 'RESILIENCE', 'rare', 'resilience_fails', 20, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('phoenix', 'Phénix', 'Renaître de 10 échecs majeurs', 'flame-outline', 'RESILIENCE', 'epic', 'major_comebacks', 10, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('unbreakable', 'Incassable', 'Maintenir un état d''esprit positif 100 jours', 'diamond-outline', 'RESILIENCE', 'epic', 'positive_days', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('survivor', 'Survivant', 'Surmonter 50 défis personnels', 'shield-checkmark-outline', 'RESILIENCE', 'legendary', 'challenges_overcome', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('inspiration', 'Source d''Inspiration', 'Inspirer 100 autres utilisateurs', 'bulb-outline', 'RESILIENCE', 'legendary', 'inspired_users', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('early-adopter', 'Pionnier', 'Membre des 1000 premiers utilisateurs', 'flag-outline', 'SPECIAL', 'legendary', 'user_rank', 1000, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('beta-tester', 'Testeur Bêta', 'Participer à la phase de test', 'construct-outline', 'SPECIAL', 'epic', 'beta_participation', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('birthday-badge', 'Anniversaire FailDaily', 'Être présent lors de l''anniversaire de l''app', 'gift-outline', 'SPECIAL', 'rare', 'anniversary_participation', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('new-year-resolution', 'Résolution du Nouvel An', 'Partager un fail le 1er janvier', 'calendar-outline', 'SPECIAL', 'rare', 'new_year_fail', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('midnight-warrior', 'Guerrier de Minuit', 'Partager un fail après minuit', 'moon-outline', 'SPECIAL', 'common', 'midnight_fail', 1, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('weekend-warrior', 'Guerrier du Weekend', 'Partager 50 fails le weekend', 'bicycle-outline', 'SPECIAL', 'rare', 'weekend_fails', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('holiday-spirit', 'Esprit des Fêtes', 'Partager pendant les vacances', 'snow-outline', 'SPECIAL', 'rare', 'holiday_fails', 5, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('globetrotter', 'Globe-Trotter', 'Partager des fails de 10 pays différents', 'airplane-outline', 'SPECIAL', 'legendary', 'countries_count', 10, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('socializer', 'Sociable', 'Interagir avec 50 utilisateurs différents', 'people-circle-outline', 'ENTRAIDE', 'rare', 'unique_interactions', 50, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('discussion-starter', 'Lanceur de Débats', 'Créer 25 discussions populaires', 'chatbubbles-outline', 'ENTRAIDE', 'epic', 'popular_discussions', 25, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('trend-setter', 'Créateur de Tendances', 'Lancer 5 tendances dans la communauté', 'trending-up-outline', 'SPECIAL', 'legendary', 'trends_created', 5, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('active-member', 'Membre Actif', 'Se connecter 100 jours non-consécutifs', 'person-outline', 'PERSEVERANCE', 'rare', 'login_days', 100, '2025-08-08 16:34:14.63981+00'::timestamptz), 
('power-user', 'Utilisateur Expert', 'Utiliser toutes les fonctionnalités de l''app', 'settings-outline', 'SPECIAL', 'epic', 'features_used', 10, '2025-08-08 16:34:14.63981+00'::timestamptz),
('first-reaction', 'Première Réaction', 'Recevoir votre première réaction', 'heart-outline', 'COURAGE', 'common', 'first_reaction', 1, '2025-08-08 16:43:44.161677+00'::timestamptz),
('fails-5', 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'common', 'fail_count', 5, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('fails-10', 'Courageux', 'Poster 10 fails', 'trophy-outline', 'COURAGE', 'rare', 'fail_count', 10, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('fails-25', 'Maître du Courage', 'Poster 25 fails', 'star-outline', 'COURAGE', 'epic', 'fail_count', 25, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('fails-50', 'Vétéran du Courage', 'Poster 50 fails', 'shield-outline', 'COURAGE', 'epic', 'fail_count', 50, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('fails-100', 'Légende du Courage', 'Poster 100 fails', 'diamond-outline', 'COURAGE', 'legendary', 'fail_count', 100, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('reactions-10', 'Supporteur', 'Donner 10 réactions', 'people-outline', 'ENTRAIDE', 'common', 'reaction_given', 10, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('reactions-25', 'Supporteur Actif', 'Donner 25 réactions', 'heart-half-outline', 'ENTRAIDE', 'common', 'reaction_given', 25, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('reactions-50', 'Grand Supporteur', 'Donner 50 réactions', 'heart', 'ENTRAIDE', 'rare', 'reaction_given', 50, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('reactions-100', 'Super Supporteur', 'Donner 100 réactions', 'heart-circle-outline', 'ENTRAIDE', 'epic', 'reaction_given', 100, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('reactions-250', 'Maître du Support', 'Donner 250 réactions', 'heart-half-outline', 'ENTRAIDE', 'legendary', 'reaction_given', 250, '2025-08-10 13:58:59.391599+00'::timestamptz), 
('all-categories', 'Touche-à-tout', 'Poster un fail dans chaque catégorie', 'apps-outline', 'SPECIAL', 'epic', 'categories_used', 5, '2025-08-10 13:58:59.391599+00'::timestamptz);

-- 2. PROFILES (pas de dépendances sauf auth.users qui existe déjà)
INSERT INTO profiles (id, email, username, display_name, avatar_url, bio, email_confirmed, registration_completed, stats, preferences, legal_consent, age_verification, created_at, updated_at) VALUES 
('b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, 'test@test.fr', 'utilisateur_test', 'utilisateur_test', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-09T06:34:37.035Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "2000-02-01", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-09 06:34:38.403211'::timestamptz, '2025-08-09 06:34:39.665645+00'::timestamptz), 
('a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'bruno@taazzz.be', 'bruno_ordi', 'bruno_ordi', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-09T17:56:36.814Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "1981-08-20T22:00:00.000Z", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-09 17:56:38.659255'::timestamptz, '2025-08-09 17:56:39.918335+00'::timestamptz), 
('60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'bruno@taeee.be', 'bruno_test_samsung', 'bruno_test_samsung', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-10T06:48:00.542Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "2000-08-09T22:00:00.000Z", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-10 06:48:01.542247'::timestamptz, '2025-08-10 06:48:02.730653+00'::timestamptz), 
('ec47b667-71ae-4d54-a414-f8e7f755226b'::uuid, 'allah@hackbar.is', 'nouveau_test_user_pc_winchiot', 'nouveau_test_user_pc_winchiot', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-10T07:55:26.437Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "2000-01-31T23:00:00.000Z", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-10 07:55:27.790861'::timestamptz, '2025-08-10 07:55:29.009539+00'::timestamptz), 
('48bf8bb4-3f62-485e-a13f-7956b2ad4e61'::uuid, 'popop@popop.fr', 'marcel_sans_la_gnaule', 'marcel_sans_la_gnaule', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-10T08:03:40.274Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "1811-01-31T23:50:39.000Z", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-10 08:03:41.07404'::timestamptz, '2025-08-10 08:03:42.212117+00'::timestamptz), 
('e7b10aa5-fb69-45f9-8438-f0ead77b5f44'::uuid, 'all@all.fr', 'mobile_firdt_test', 'mobile_firdt_test', NULL, NULL, false, true, '{"badges": [], "totalFails": 0, "couragePoints": 0}'::jsonb, '{}'::jsonb, '{"consentDate": "2025-08-10T08:19:17.576Z", "consentVersion": "1.0", "marketingOptIn": true, "documentsAccepted": ["terms-of-service", "privacy-policy", "moderation-charter", "age-restrictions"]}'::jsonb, '{"isMinor": false, "birthDate": "2008-08-09T22:00:00.000Z", "parentEmail": null, "parentConsentDate": null, "needsParentalConsent": false}'::jsonb, '2025-08-10 08:19:18.080075'::timestamptz, '2025-08-10 08:19:19.264979+00'::timestamptz);

-- 3. FAILS (dépend de profiles)
INSERT INTO fails (id, user_id, title, description, category, image_url, is_public, reactions, comments_count, created_at, updated_at) VALUES 
('c722dab3-0d7c-4341-a937-6435108f5f2b'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'bruno test poste', 'je test un nouveau poste voir si ça, ça fonctionne toujours', 'cuisine', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 13:10:49.080276+00'::timestamptz, '2025-08-10 13:26:18.886377+00'::timestamptz), 
('8107cd94-1c2a-477f-ab02-471e958bf13d'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, 'test fail utilisateurs test', 'on test si ça aussi ca refonctionne car ca beuguais', 'courage', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-09 06:35:24.541571+00'::timestamptz, '2025-08-09 06:36:02.414559+00'::timestamptz), 
('593df492-bc85-4fef-a9f4-d0f3b25cd76d'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'fails numero 4ZZZZ', 'lkezfiuzefnzdiufbizodnfoiuZBDFZZZZZZZZZZZZZZZZZZZ', 'travail', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 16:09:58.547503+00'::timestamptz, '2025-08-10 17:45:26.410881+00'::timestamptz), 
('d194905e-2862-4e70-8229-045b816d3af4'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'test depuis samsung', 'on va voir si mon apli avance vraiment', 'courage', 'https://wzvhqygjkdxqfgwakyjy.supabase.co/storage/v1/object/public/fails/60232dad-d6a0-43a6-baa2-f525133e4261/1754808540086', true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 06:49:00.647233+00'::timestamptz, '2025-08-10 07:09:39.996472+00'::timestamptz), 
('68749b27-2745-44b1-a91e-e2be491f2f5a'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'test voir si badges 25 fails fonctionne', 'on verra bien si ça fonctionne ou non', 'special', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 13:27:39.059855+00'::timestamptz, '2025-08-10 13:27:48.065892+00'::timestamptz), 
('48fc523b-6898-4f97-9396-5863fa56f7d0'::uuid, 'ec47b667-71ae-4d54-a414-f8e7f755226b'::uuid, 'test fail hallahSlibard', 'je n''aime pas les arabas', 'courage', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 0}'::jsonb, 0, '2025-08-10 07:57:22.809202+00'::timestamptz, '2025-08-10 07:58:59.010373+00'::timestamptz), 
('bc755b75-b65a-484d-9f55-7893d46b324d'::uuid, '48bf8bb4-3f62-485e-a13f-7956b2ad4e61'::uuid, 'marcel sans la gnole', 'plop ljh \n jihug \njhiuguyg \njuyfuyf', 'courage', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 0, "support": 0}'::jsonb, 0, '2025-08-10 08:05:07.894857+00'::timestamptz, '2025-08-10 08:07:03.387501+00'::timestamptz), 
('356c8610-38a7-4414-8308-94dbb9b59127'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'test fail dans sport', 'si ce fail n''est pas avec la categorie sport il y a un beug', 'sport', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 13:13:48.70414+00'::timestamptz, '2025-08-10 13:14:48.875968+00'::timestamptz), 
('019d1b12-0773-451c-b211-a3dd240706ed'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'test fepuis samsung', 'jfukjgfjivih u7fg8gug9h ucugicuf', 'perseverance', 'https://wzvhqygjkdxqfgwakyjy.supabase.co/storage/v1/object/public/fails/a36deb63-dd4e-4828-adcf-0b6e457c25f2/1754847898325', true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 17:44:59.137485+00'::timestamptz, '2025-08-10 17:45:12.517694+00'::timestamptz), 
('767eab6f-0c07-4ca1-bade-658058695528'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'TEST BADGES FAILS NUMERO 5', 'ON on va voir si le badge ce debloque', 'perseverance', NULL, true, '{"laugh": 1, "courage": 1, "empathy": 1, "support": 1}'::jsonb, 0, '2025-08-10 16:10:39.352774+00'::timestamptz, '2025-08-10 17:45:21.081344+00'::timestamptz);

-- 4. USER_BADGES (dépend de profiles et badge_definitions)
INSERT INTO user_badges (id, user_id, badge_id, created_at, unlocked_at) VALUES 
('4905922f-aeb8-44c5-80f3-78e6ef6c5352'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, 'first-fail', '2025-08-09 07:08:34.693628+00'::timestamptz, '2025-08-09 07:08:34.693628+00'::timestamptz), 
('e96d2931-37c1-432c-bed8-dc8d262dfea3'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, 'first-reaction', '2025-08-09 07:08:34.693628+00'::timestamptz, '2025-08-09 07:08:34.693628+00'::timestamptz), 
('2c26f734-ea8e-469b-98b6-34da40c3dca1'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'first-fail', '2025-08-10 06:49:01.506315+00'::timestamptz, '2025-08-10 06:49:02.069+00'::timestamptz), 
('eae3a1c4-956a-49ad-adff-25a10b124da0'::uuid, 'ec47b667-71ae-4d54-a414-f8e7f755226b'::uuid, 'first-fail', '2025-08-10 07:57:23.679686+00'::timestamptz, '2025-08-10 07:57:23.606+00'::timestamptz), 
('98dafce4-cf52-465b-98ce-d923bf3d0085'::uuid, '48bf8bb4-3f62-485e-a13f-7956b2ad4e61'::uuid, 'first-fail', '2025-08-10 08:05:08.92585+00'::timestamptz, '2025-08-10 08:05:08.879+00'::timestamptz), 
('8d04e3fa-1738-4728-ba2d-be2fec9e48bc'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'first-fail', '2025-08-10 13:10:50.361444+00'::timestamptz, '2025-08-10 13:10:50.561+00'::timestamptz), 
('641f7761-da92-4e63-beb0-d073647f15b7'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'reactions-10', '2025-08-10 14:52:30.133594+00'::timestamptz, '2025-08-10 14:52:30.133594+00'::timestamptz), 
('cfb5cd63-4db7-4890-b311-c94a8d91d426'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'reactions-25', '2025-08-10 14:52:30.133594+00'::timestamptz, '2025-08-10 14:52:30.133594+00'::timestamptz), 
('d4294da8-0572-4f29-8a6d-772ed084984b'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'fails-5', '2025-08-10 16:10:40.79984+00'::timestamptz, '2025-08-10 16:10:40.993+00'::timestamptz), 
('5e2d6b52-b477-4b8c-a852-678508b5a4dc'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'fail-master-5', '2025-08-10 16:10:41.065722+00'::timestamptz, '2025-08-10 16:10:41.309+00'::timestamptz), 
('8cdc7af6-f824-445b-baca-572dab34be86'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'all-categories', '2025-08-10 16:10:41.335349+00'::timestamptz, '2025-08-10 16:10:41.576+00'::timestamptz);

-- 5. REACTIONS (dépend de profiles et fails)
INSERT INTO reactions (id, user_id, fail_id, reaction_type, created_at) VALUES 
('715151e1-b454-4a89-b99d-9b123063d916'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, '8107cd94-1c2a-477f-ab02-471e958bf13d'::uuid, 'courage', '2025-08-09 06:35:43.493568+00'::timestamptz), 
('f8968c16-8e95-45e0-999d-a94a5546d53f'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, '8107cd94-1c2a-477f-ab02-471e958bf13d'::uuid, 'laugh', '2025-08-09 06:35:49.184768+00'::timestamptz), 
('fd40a8d2-40ab-4309-bd24-b3a2d83e5a55'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, '8107cd94-1c2a-477f-ab02-471e958bf13d'::uuid, 'empathy', '2025-08-09 06:35:53.294074+00'::timestamptz), 
('4c8adaf4-73e4-4456-b7c8-cf0cde289f52'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, '8107cd94-1c2a-477f-ab02-471e958bf13d'::uuid, 'support', '2025-08-09 06:36:02.238203+00'::timestamptz), 
('537e9534-6e00-43a1-a7cb-c10c152e9d6a'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'd194905e-2862-4e70-8229-045b816d3af4'::uuid, 'courage', '2025-08-10 07:09:36.864693+00'::timestamptz), 
('94278936-04dd-4886-a4fd-d2321ddef29b'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'd194905e-2862-4e70-8229-045b816d3af4'::uuid, 'laugh', '2025-08-10 07:09:39.075906+00'::timestamptz), 
('fddbe151-705c-4416-903e-747ff2493541'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'd194905e-2862-4e70-8229-045b816d3af4'::uuid, 'empathy', '2025-08-10 07:09:39.521001+00'::timestamptz), 
('c3e5a121-4acc-4c23-b7f6-0c0c376ccdeb'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'd194905e-2862-4e70-8229-045b816d3af4'::uuid, 'support', '2025-08-10 07:09:39.891214+00'::timestamptz);

-- 6. BADGES (dépend de profiles)
INSERT INTO badges (id, user_id, name, description, icon, category, badge_type, rarity, created_at, unlocked_at) VALUES 
('0761d5ce-eb82-4c9f-a0ac-3e59f4eff26a'::uuid, 'b64524ba-9daa-4fe7-8372-a9e94402ab83'::uuid, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'first-fail', 'common', '2025-08-09 06:35:24.541571+00'::timestamptz, '2025-08-09 06:35:24.541571+00'::timestamptz), 
('d78a1068-30e0-4a3a-b608-0ea788e900bb'::uuid, '60232dad-d6a0-43a6-baa2-f525133e4261'::uuid, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'first-fail', 'common', '2025-08-10 06:49:00.647233+00'::timestamptz, '2025-08-10 06:49:00.647233+00'::timestamptz), 
('a7aaf051-1327-4813-a3fd-408f6a60149f'::uuid, 'ec47b667-71ae-4d54-a414-f8e7f755226b'::uuid, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'first-fail', 'common', '2025-08-10 07:57:22.809202+00'::timestamptz, '2025-08-10 07:57:22.809202+00'::timestamptz), 
('d7e192d2-6fba-4664-884d-0ffeca979e21'::uuid, '48bf8bb4-3f62-485e-a13f-7956b2ad4e61'::uuid, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'first-fail', 'common', '2025-08-10 08:05:07.894857+00'::timestamptz, '2025-08-10 08:05:07.894857+00'::timestamptz), 
('1c626073-337f-437b-9f21-54c5d0bec02a'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'Premier Pas', 'Félicitations pour votre premier fail partagé !', 'footsteps-outline', 'COURAGE', 'first-fail', 'common', '2025-08-10 13:10:49.080276+00'::timestamptz, '2025-08-10 13:10:49.080276+00'::timestamptz), 
('6c82c595-4bdb-4c50-8e2e-eac96f136c9d'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'Apprenti', 'Partager 5 fails', 'school-outline', 'COURAGE', 'fail-master-5', 'common', '2025-08-10 16:10:39.352774+00'::timestamptz, '2025-08-10 16:10:39.352774+00'::timestamptz), 
('9c052275-74ca-4aaa-a6c0-274afe7631f2'::uuid, 'a36deb63-dd4e-4828-adcf-0b6e457c25f2'::uuid, 'Apprenti Courage', 'Poster 5 fails', 'ribbon-outline', 'COURAGE', 'fails-5', 'common', '2025-08-10 16:10:39.352774+00'::timestamptz, '2025-08-10 16:10:39.352774+00'::timestamptz);

-- 7. COMMENTS (dépend de profiles et fails) - Vide pour le moment
-- Table vide dans votre base distante

-- =====================================================
-- IMPORT TERMINÉ - TOUTES LES DONNÉES ONT ÉTÉ INSÉRÉES DANS LE BON ORDRE !
-- =====================================================