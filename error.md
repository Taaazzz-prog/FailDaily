(Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
[0] 📊 Frontend Log: {
[0]   timestamp: '2025-08-26T11:17:38.956Z',
[0]   event_type: 'logger_initialized',
[0]   event_category: 'system',
[0]   action: 'initialize',
[0]   title: 'Service de logging initialisé',
[0]   user_id: null,
[0]   resource_type: null,
[0]   resource_id: null,
[0]   target_user_id: null,
[0]   description: 'Le service de logging ultra-complet est maintenant actif',
[0]   payload: null,
[0]   old_values: null,
[0]   new_values: null,
[0]   p_ip_address: '93.20.25.180',
[0]   p_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
[0]   p_session_id: 'session_1756207058384_nakd5s9s0',
[0]   p_success: true,
[0]   p_error_code: null,
[0]   p_error_message: null,
[0]   p_correlation_id: 'correlation_1756207058384_31mg5k5ua'
[0] }
[0] ::1 - - [26/Aug/2025:11:17:38 +0000] "POST /api/logs/comprehensive HTTP/1.1" 200 90 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
[0] ❌ Erreur SQL: La table 'faildaily.fail_moderation' n'existe pas
[0] 📝 Requête:
[0]       SELECT f.*, p.display_name, p.avatar_url
[0]       FROM fails f
[0]       JOIN users u    ON f.user_id = u.id
[0]       JOIN profiles p ON u.id = p.user_id
[0]       LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
[0]       WHERE (fm.status IS NULL OR fm.status = 'approved')
[0]       ORDER BY f.created_at DESC, f.id DESC
[0]       LIMIT ?, ?
[0] 📋 Paramètres: [ 0, 20 ]
[0] ❌ Erreur récupération fails publics: Error: La table 'faildaily.fail_moderation' n'existe pas
[0]     at PromisePool.query (D:\Web API\FailDaily\node_modules\mysql2\lib\promise\pool.js:36:22)
[0]     at executeQuery (D:\Web API\FailDaily\backend-api\src\config\database.js:69:20)
[0]     at getPublicFails (D:\Web API\FailDaily\backend-api\src\controllers\failsController.js:261:24)
[0]     at Layer.handle [as handle_request] (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\layer.js:95:5)
[0]     at next (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\route.js:149:13)
[0]     at optionalAuth (D:\Web API\FailDaily\backend-api\src\middleware\auth.js:107:3)
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
[0]   code: 'ER_NO_SUCH_TABLE',
[0]   errno: 1146,
[0]   sql: '\n' +
[0]     '      SELECT f.*, p.display_name, p.avatar_url\n' +
[0]     '      FROM fails f\n' +
[0]     '      JOIN users u    ON f.user_id = u.id\n' +
[0]     '      JOIN profiles p ON u.id = p.user_id\n' +
[0]     '      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id\n' +
[0]     "      WHERE (fm.status IS NULL OR fm.status = 'approved')\n" +
[0]     '      ORDER BY f.created_at DESC, f.id DESC\n' +
[0]     '      LIMIT 0, 20',
[0]   sqlState: '42S02',
[0]   sqlMessage: "La table 'faildaily.fail_moderation' n'existe pas"
[0] }
[0] ::1 - - [26/Aug/2025:11:17:39 +0000] "GET /api/fails/public?limit=20&offset=0 HTTP/1.1" 500 80 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"   
[0] ❌ Erreur SQL: La table 'faildaily.fail_moderation' n'existe pas
[0] 📝 Requête:
[0]       SELECT f.*, p.display_name, p.avatar_url
[0]       FROM fails f
[0]       JOIN users u    ON f.user_id = u.id
[0]       JOIN profiles p ON u.id = p.user_id
[0]       LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
[0]       WHERE (fm.status IS NULL OR fm.status = 'approved')
[0]       ORDER BY f.created_at DESC, f.id DESC
[0]       LIMIT ?, ?
[0] 📋 Paramètres: [ 0, 20 ]
[0] ❌ Erreur récupération fails publics: Error: La table 'faildaily.fail_moderation' n'existe pas
[0]     at PromisePool.query (D:\Web API\FailDaily\node_modules\mysql2\lib\promise\pool.js:36:22)
[0]     at executeQuery (D:\Web API\FailDaily\backend-api\src\config\database.js:69:20)
[0]     at getPublicFails (D:\Web API\FailDaily\backend-api\src\controllers\failsController.js:261:24)
[0]     at Layer.handle [as handle_request] (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\layer.js:95:5)
[0]     at next (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\route.js:149:13)
[0]     at optionalAuth (D:\Web API\FailDaily\backend-api\src\middleware\auth.js:107:3)
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
[0]   code: 'ER_NO_SUCH_TABLE',
[0]   errno: 1146,
[0]   sql: '\n' +
[0]     '      SELECT f.*, p.display_name, p.avatar_url\n' +
[0]     '      FROM fails f\n' +
[0]     '      JOIN users u    ON f.user_id = u.id\n' +
[0]     '      JOIN profiles p ON u.id = p.user_id\n' +
[0]     '      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id\n' +
[0]     "      WHERE (fm.status IS NULL OR fm.status = 'approved')\n" +
[0]     '      ORDER BY f.created_at DESC, f.id DESC\n' +
[0]     '      LIMIT 0, 20',
[0]   sqlState: '42S02',
[0]   sqlMessage: "La table 'faildaily.fail_moderation' n'existe pas"
[0] }
[0] ::1 - - [26/Aug/2025:11:17:39 +0000] "GET /api/fails/public?limit=20&offset=0 HTTP/1.1" 500 80 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"   
[0] ❌ Erreur SQL: La table 'faildaily.fail_moderation' n'existe pas
[0] ::1 - - [26/Aug/2025:11:17:39 +0000] "GET /api/fails/public?limit=20&offset=0 HTTP/1.1" 500 80 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"   
[0] 📝 Requête:
[0]       SELECT f.*, p.display_name, p.avatar_url
[0]       FROM fails f
[0]       JOIN users u    ON f.user_id = u.id
[0]       JOIN profiles p ON u.id = p.user_id
[0]       LEFT JOIN fail_moderation fm ON fm.fail_id = f.id
[0]       WHERE (fm.status IS NULL OR fm.status = 'approved')
[0]       ORDER BY f.created_at DESC, f.id DESC
[0]       LIMIT ?, ?
[0] 📋 Paramètres: [ 0, 20 ]
[0] ❌ Erreur récupération fails publics: Error: La table 'faildaily.fail_moderation' n'existe pas
[0]     at PromisePool.query (D:\Web API\FailDaily\node_modules\mysql2\lib\promise\pool.js:36:22)
[0]     at executeQuery (D:\Web API\FailDaily\backend-api\src\config\database.js:69:20)
[0]     at getPublicFails (D:\Web API\FailDaily\backend-api\src\controllers\failsController.js:261:24)
[0]     at Layer.handle [as handle_request] (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\layer.js:95:5)
[0]     at next (D:\Web API\FailDaily\backend-api\node_modules\express\lib\router\route.js:149:13)
[0]     at optionalAuth (D:\Web API\FailDaily\backend-api\src\middleware\auth.js:107:3)
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
[0]   code: 'ER_NO_SUCH_TABLE',
[0]   errno: 1146,
[0]   sql: '\n' +
[0]     '      SELECT f.*, p.display_name, p.avatar_url\n' +
[0]     '      FROM fails f\n' +
[0]     '      JOIN users u    ON f.user_id = u.id\n' +
[0]     '      JOIN profiles p ON u.id = p.user_id\n' +
[0]     '      LEFT JOIN fail_moderation fm ON fm.fail_id = f.id\n' +
[0]     "      WHERE (fm.status IS NULL OR fm.status = 'approved')\n" +
[0]     '      ORDER BY f.created_at DESC, f.id DESC\n' +
[0]     '      LIMIT 0, 20',
[0]   sqlState: '42S02',
[0]   sqlMessage: "La table 'faildaily.fail_moderation' n'existe pas"
[0] }