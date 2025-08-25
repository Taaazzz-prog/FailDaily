 ❌ Erreur SQL: La table 'faildaily.fail_comments' n'existe pas
[0] 📝 Requête:
[0]         SELECT
[0]           fc.id,
[0]           fc.content,
[0]           fc.parent_id,
[0]           fc.created_at,
[0]           fc.updated_at,
[0]           p.display_name,
[0]           p.avatar_url,
[0]           u.id as user_id,
[0]           (SELECT COUNT(*) FROM fail_comments WHERE parent_id = fc.id) as replies_count
[0]         FROM fail_comments fc
[0]         JOIN users u ON fc.user_id = u.id
[0]         JOIN profiles p ON u.id = p.user_id
[0]         WHERE fc.fail_id = ?
[0]         ORDER BY fc.created_at ASC
[0]         LIMIT ? OFFSET ?
[0]
[0] 📋 Paramètres: [ '965883d5-c51b-4ccb-a7e4-e90aecc49016', 20, 0 ]
[0] ❌ Erreur récupération commentaires: Error: La table 'faildaily.fail_comments' n'existe pas
[0]     at PromisePool.execute (D:\Web API\FailDaily\node_modules\mysql2\lib\promise\pool.js:54:22)
[0]     at executeQuery (D:\Web API\FailDaily\backend-api\src\config\database.js:70:20)
[0]     at getComments (D:\Web API\FailDaily\backend-api\src\controllers\commentsController.js:182:30)
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
[0]   code: 'ER_NO_SUCH_TABLE',
[0]   errno: 1146,
[0]   sql: '\n' +
[0]     '        SELECT \n' +
[0]     '          fc.id,\n' +
[0]     '          fc.content,\n' +
[0]     '          fc.parent_id,\n' +
[0]     '          fc.created_at,\n' +
[0]     '          fc.updated_at,\n' +
[0]     '          p.display_name,\n' +
[0]     '          p.avatar_url,\n' +
[0]     '          u.id as user_id,\n' +
[0]     '          (SELECT COUNT(*) FROM fail_comments WHERE parent_id = fc.id) as replies_count\n' +
[0]     '        FROM fail_comments fc\n' +
[0]     '        JOIN users u ON fc.user_id = u.id\n' +
[0]     '        JOIN profiles p ON u.id = p.user_id\n' +
[0]     '        WHERE fc.fail_id = ?\n' +
[0]     '        ORDER BY fc.created_at ASC\n' +
[0]     '        LIMIT ? OFFSET ?\n' +
[0]     '      ',
[0]   sqlState: '42S02',
[0]   sqlMessage: "La table 'faildaily.fail_comments' n'existe pas"
[0] }
[0] ::1 - - [25/Aug/2025:13:31:42 +0000] "GET /api/fails/965883d5-c51b-4ccb-a7e4-e90aecc49016/comments HTTP/1.1" 500 109 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
[0] ❌ Erreur SQL: La table 'faildaily.fail_comments' n'existe pas
[0] 📝 Requête:
[0]         INSERT INTO fail_comments (
[0]           id, fail_id, user_id, content, parent_id, created_at, updated_at
[0]         ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
[0]
[0] 📋 Paramètres: [
[0]   'c6fd810d-c971-4451-a5ae-fd7960dbb6cd',
[0]   '965883d5-c51b-4ccb-a7e4-e90aecc49016',
[0]   '814b7d10-b3d4-4921-ab47-a388bec6c7fb',
[0]   'test du premier commentaire',
[0]   null
[0] ]
[0] ❌ Erreur ajout commentaire: Error: La table 'faildaily.fail_comments' n'existe pas
[0]     at PromisePool.execute (D:\Web API\FailDaily\node_modules\mysql2\lib\promise\pool.js:54:22)
[0]     at executeQuery (D:\Web API\FailDaily\backend-api\src\config\database.js:70:20)
[0]     at addComment (D:\Web API\FailDaily\backend-api\src\controllers\commentsController.js:90:13)
[0]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5) {
[0]   code: 'ER_NO_SUCH_TABLE',
[0]   errno: 1146,
[0]   sql: '\n' +
[0]     '        INSERT INTO fail_comments (\n' +
[0]     '          id, fail_id, user_id, content, parent_id, created_at, updated_at\n' +
[0]     '        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())\n' +
[0]     '      ',
[0]   sqlState: '42S02',
[0]   sqlMessage: "La table 'faildaily.fail_comments' n'existe pas"
[0] }
[0] ::1 - - [25/Aug/2025:13:31:53 +0000] "POST /api/fails/965883d5-c51b-4ccb-a7e4-e90aecc49016/comments HTTP/1.1" 500 97 "http://localhost:4200/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"