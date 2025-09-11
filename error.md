Run npx jest --runInBand
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`
      at _log (../node_modules/dotenv/lib/main.js:139:11)
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
      at _log (../node_modules/dotenv/lib/main.js:139:11)
  console.log
    🔄 Transaction démarrée
      at log (src/config/database.js:93:13)
  console.log
    ✅ Requête 1/2 exécutée
      at log (src/config/database.js:100:15)
  console.log
    ✅ Requête 2/2 exécutée
      at log (src/config/database.js:100:15)
  console.log
    ✅ Transaction validée
      at log (src/config/database.js:104:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:14 +0000] "POST /api/auth/register HTTP/1.1" 201 452 "-" "-"
  console.log
    🔐 Réponse de connexion envoyée: {
      "success": true,
      "message": "Connexion réussie",
      "user": {
        "id": "4c75d82d-4e12-421c-ae6a-cf6a5359f0da",
        "email": "e2e.1757597594392@journey.local",
        "displayName": "User 1757597594392",
        "avatarUrl": null,
        "role": "user"
      },
      "token": "***"
    }
      at log (src/controllers/authController.js:312:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/auth/login HTTP/1.1" 200 467 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/auth/verify HTTP/1.1" 200 190 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/auth/profile HTTP/1.1" 200 920 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/upload/image HTTP/1.1" 200 373 "-" "-"
  console.log
    🔍 getFailById called with: {
      failId: '48672a48-e42f-4a85-9ba8-b02e59f0420c',
      userId: '4c75d82d-4e12-421c-ae6a-cf6a5359f0da'
    }
      at Function.log [as getFailById] (src/controllers/failsController.js:325:15)
  console.log
    🔍 Query: 
            SELECT
              f.*,
              p.display_name,
              p.avatar_url,
              fm.status AS moderation_status,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count,
              (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
              (SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction
            FROM fails f
            JOIN users u ON f.user_id = u.id
            JOIN profiles p ON u.id = p.user_id
            LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
            WHERE f.id = ? AND (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected') OR f.user_id = ?)
      at Function.log [as getFailById] (src/controllers/failsController.js:348:15)
  console.log
    🔍 Params: [
      '4c75d82d-4e12-421c-ae6a-cf6a5359f0da',
      '48672a48-e42f-4a85-9ba8-b02e59f0420c',
      '4c75d82d-4e12-421c-ae6a-cf6a5359f0da'
    ]
      at Function.log [as getFailById] (src/controllers/failsController.js:349:15)
  console.log
    🏆 APPEL checkBadgeProgress pour utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da
      at log (src/controllers/failsController.js:131:15)
  console.log
    🏆 ========== VERIFICATION BADGES ==========
      at Function.log [as checkBadgeProgress] (src/controllers/failsController.js:731:15)
  console.log
    🏆 Utilisateur: 4c75d82d-4e12-421c-ae6a-cf6a5359f0da, Action: fail_created
      at Function.log [as checkBadgeProgress] (src/controllers/failsController.js:732:15)
  console.log
    🏆 Traitement action fail_created...
      at Function.log [as checkBadgeProgress] (src/controllers/failsController.js:735:17)
  console.log
    🏆 📊 Utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da a 1 fails au total
      at Function.log [as checkBadgeProgress] (src/controllers/failsController.js:744:17)
  console.log
    🎉 Badge "Premier Pas" attribué à l'utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da!
      at Function.log [as awardBadgeIfNotExists] (src/controllers/failsController.js:813:15)
  console.log
    🏆 FIN checkBadgeProgress pour utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da
      at log (src/controllers/failsController.js:133:15)
  console.log
    ✅ Fail créé: 48672a48-e42f-4a85-9ba8-b02e59f0420c par utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da
      at log (src/controllers/failsController.js:135:15)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/fails HTTP/1.1" 201 609 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/fails/public HTTP/1.1" 200 2164 "-" "-"
  console.log
    🔍 getFailById called with: {
      failId: '48672a48-e42f-4a85-9ba8-b02e59f0420c',
      userId: '4c75d82d-4e12-421c-ae6a-cf6a5359f0da'
    }
      at Function.log [as getFailById] (src/controllers/failsController.js:325:15)
  console.log
    🔍 Query: 
            SELECT
              f.*,
              p.display_name,
              p.avatar_url,
              fm.status AS moderation_status,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id) as reactions_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'courage') as courage_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'empathy') as empathy_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'laugh')   as laugh_count,
              (SELECT COUNT(*) FROM reactions fr WHERE fr.fail_id = f.id AND fr.reaction_type = 'support') as support_count,
              (SELECT COUNT(*) FROM comments fc WHERE fc.fail_id = f.id) as comments_count,
              (SELECT reaction_type FROM reactions WHERE fail_id = f.id AND user_id = ?) as user_reaction
            FROM fails f
            JOIN users u ON f.user_id = u.id
            JOIN profiles p ON u.id = p.user_id
            LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
            WHERE f.id = ? AND (fm.status IS NULL OR fm.status NOT IN ('hidden','rejected') OR f.user_id = ?)
      at Function.log [as getFailById] (src/controllers/failsController.js:348:15)
  console.log
    🔍 Params: [
      '4c75d82d-4e12-421c-ae6a-cf6a5359f0da',
      '48672a48-e42f-4a85-9ba8-b02e59f0420c',
      '4c75d82d-4e12-421c-ae6a-cf6a5359f0da'
    ]
      at Function.log [as getFailById] (src/controllers/failsController.js:349:15)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c HTTP/1.1" 200 572 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/reactions HTTP/1.1" 200 207 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/reactions HTTP/1.1" 200 309 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "DELETE /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/reactions HTTP/1.1" 200 175 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/comments HTTP/1.1" 201 379 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/comments HTTP/1.1" 200 510 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "PUT /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/comments/511a1253-7394-4935-bc19-c7d5fdc0ff7d HTTP/1.1" 200 383 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "DELETE /api/fails/48672a48-e42f-4a85-9ba8-b02e59f0420c/comments/511a1253-7394-4935-bc19-c7d5fdc0ff7d HTTP/1.1" 200 104 "-" "-"
  console.log
    📋 Récupération des badges disponibles depuis badge_definitions
      at log (src/routes/badges.js:11:13)
  console.log
    ✅ 70 badges récupérés depuis badge_definitions
      at log (src/routes/badges.js:37:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "GET /api/badges/available HTTP/1.1" 200 17701 "-" "-"
  console.log
    🔍 Vérification des badges à débloquer pour l'utilisateur: 4c75d82d-4e12-421c-ae6a-cf6a5359f0da
      at log (src/routes/badges.js:187:13)
  console.log
    🎯 Vérification des badges pour l'utilisateur 4c75d82d-4e12-421c-ae6a-cf6a5359f0da
      at log (src/routes/badges.js:210:13)
  console.log
    ⚠️ Type de critère non supporté: categories_used
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: beta_participation
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: anniversary_participation
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: bounce_back_count
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: comeback_count
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: active_months
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: popular_discussions
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: user_rank
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: empathy_given
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: first_reaction
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: countries_count
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: positive_reactions
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: holiday_fails
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: inspired_users
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: resilience_count
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: advice_given
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: midnight_fail
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: funny_fails
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: long_streaks
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: new_year_fail
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: major_comebacks
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: features_used
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: resilience_fails
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: resilience_fails
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: challenges_overcome
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: trends_created
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: positive_days
      at log (src/routes/badges.js:340:17)
  console.log
    ⚠️ Type de critère non supporté: weekend_fails
      at log (src/routes/badges.js:340:17)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/badges/check-unlock/4c75d82d-4e12-421c-ae6a-cf6a5359f0da HTTP/1.1" 200 73 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "PUT /api/auth/profile HTTP/1.1" 200 502 "-" "-"
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/upload/avatar HTTP/1.1" 200 290 "-" "-"
PASS tests/5_user_journey.test.js
  User Journey E2E
    ✓ registers a new adult user (430 ms)
    ✓ logs in the user (331 ms)
    ✓ verifies token and fetches profile (16 ms)
    ✓ uploads a fail image (12 ms)
    ✓ creates a fail with the uploaded image (43 ms)
    ✓ lists public fails and fetches by id (22 ms)
    ✓ adds and removes a reaction (47 ms)
    ✓ posts and manages comments (55 ms)
    ✓ checks and unlocks badges (58 ms)
    ✓ updates profile (displayName, bio) and uploads avatar (19 ms)
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
      at _log (../node_modules/dotenv/lib/main.js:139:11)
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: 📡 observe env with Radar: https://dotenvx.com/radar
      at _log (../node_modules/dotenv/lib/main.js:139:11)
  console.log
    🔄 Transaction démarrée
      at log (src/config/database.js:93:13)
  console.log
    ✅ Requête 1/2 exécutée
      at log (src/config/database.js:100:15)
  console.log
    ✅ Requête 2/2 exécutée
      at log (src/config/database.js:100:15)
  console.log
    ✅ Transaction validée
      at log (src/config/database.js:104:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:15 +0000] "POST /api/auth/register HTTP/1.1" 201 464 "-" "-"
  console.log
    Inscription status: 201
      at Object.log (tests/fails.anonyme.test.js:24:13)
  console.log
    🔐 Réponse de connexion envoyée: {
      "success": true,
      "message": "Connexion réussie",
      "user": {
        "id": "195450d4-4721-49e5-a4c5-e7678b4a70b6",
        "email": "temp.test.1757597595582@test.local",
        "displayName": "Test User 1757597595582",
        "avatarUrl": null,
        "role": "user"
      },
      "token": "***"
    }
      at log (src/controllers/authController.js:312:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:16 +0000] "POST /api/auth/login HTTP/1.1" 200 479 "-" "-"
  console.log
    Login status: 200
      at Object.log (tests/fails.anonyme.test.js:34:13)
  console.log
    Login body: {
      success: true,
      message: 'Connexion réussie',
      user: {
        id: '195450d4-4721-49e5-a4c5-e7678b4a70b6',
        email: 'temp.test.1757597595582@test.local',
        displayName: 'Test User 1757597595582',
        avatarUrl: null,
        role: 'user'
      },
      token: '***'
    }
      at Object.log (tests/fails.anonyme.test.js:35:13)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:16 +0000] "GET /api/fails/anonymes HTTP/1.1" 200 2255 "-" "-"
PASS tests/fails.anonyme.test.js
  GET /api/fails/anonymes
    ✓ renvoie 200 (ou 204) et un booléen is_anonyme quand des données existent (14 ms)
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
      at _log (../node_modules/dotenv/lib/main.js:139:11)
  console.log
    [dotenv@17.2.1] injecting env (0) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }
      at _log (../node_modules/dotenv/lib/main.js:139:11)
::ffff:127.0.0.1 - - [11/Sep/2025:13:33:16 +0000] "GET /health HTTP/1.1" 200 93 "-" "-"
PASS tests/0_smoke.health.test.js
  SMOKE /health
    ✓ returns 200 OK and status OK (5 ms)
Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        3.474 s
Ran all test suites.
Jest did not exit one second after the test run has completed.
'This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue.