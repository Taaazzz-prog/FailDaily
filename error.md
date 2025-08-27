 ./start.ps1 dev
FailDaily - Demarrage du projet
Demarrage en mode developpement...

> faildaily-monorepo@1.0.0 dev:full
> concurrently "npm run dev:backend" "npm run start:frontend"

(node:12340) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
[0] 
[0] > faildaily-monorepo@1.0.0 dev:backend
[0] > npm run -w backend-api dev
[0] 
[1] 
[1] > faildaily-monorepo@1.0.0 start:frontend
[1] > npm run -w frontend start
[1] 
[0] 
[0] > faildaily-backend-api@1.0.0 dev
[0] > nodemon server.js
[0] 
[1] 
[1] > faildaily@0.0.1 start
[1] > ng serve
[1]
[0] [nodemon] 3.1.10
[0] [nodemon] to restart at any time, enter `rs`
[0] [nodemon] watching path(s): *.*
[0] [nodemon] watching extensions: js,mjs,cjs,json
[0] [nodemon] starting `node server.js`
[0] [dotenv@17.2.1] injecting env (12) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[0] [dotenv@17.2.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
[0] ✅ Connexion MySQL réussie à la base FailDaily
[0] 📊 Base de données joignable (SELECT 1)
[0] 🚀 FailDaily API Server démarré !
[0] 📡 Serveur: http://localhost:3000
[0] 🌍 Environment: development
[0] 🗄️  Base de données: faildaily
[0] 📁 Uploads: D:\Web API\FailDaily\backend-api\uploads
[0] ✅ Prêt à recevoir des requêtes !
[1] ❯ Building...
[1] ✔ Building...
[1] Application bundle generation failed. [5.252 seconds]
[1]
[1] ▲ [WARNING] Duplicate member "showToast" in class body [duplicate-class-member]
[1]
[1]     src/app/pages/admin/admin.page.ts:3390:10:
[1]       3390 │     async showToast(message, color = 'primary') {
[1]            ╵           ~~~~~~~~~
[1]
[1]   The original member "showToast" is here:
[1]
[1]     src/app/pages/admin/admin.page.ts:2829:10:
[1]       2829 │     async showToast(message, color = 'primary') {
[1]            ╵           ~~~~~~~~~
[1]
[1]
[1] X [ERROR] TS2339: Property 'loadMoreLogs' does not exist on type 'AdminPage'. [plugin angular-compiler]
[1]
[1]     src/app/pages/admin/admin.page.html:781:60:
[1]       781 │ ... fill="outline" (click)="loadMoreLogs()" [disabled]="isLoading...
[1]           ╵                             ~~~~~~~~~~~~
[1]
[1]   Error occurs in the template of component AdminPage.
[1]
[1]     src/app/pages/admin/admin.page.ts:13:17:
[1]       13 │     templateUrl: './admin.page.html',
[1]          ╵                  ~~~~~~~~~~~~~~~~~~~
[1]
[1]
[1] X [ERROR] TS2393: Duplicate function implementation. [plugin angular-compiler]
[1]
[1]     src/app/pages/admin/admin.page.ts:545:10:
[1]       545 │     async showToast(message: string, color: 'success' | 'warning'...
[1]           ╵           ~~~~~~~~~
[1]
[1]
[1] X [ERROR] TS2339: Property 'startRealTimeLogs' does not exist on type 'AdminPage'. [plugin angular-compiler]
[1]
[1]     src/app/pages/admin/admin.page.ts:653:17:
[1]       653 │             this.startRealTimeLogs();
[1]           ╵                  ~~~~~~~~~~~~~~~~~
[1]
[1]
[1] X [ERROR] TS2551: Property 'stopRealTimeLogs' does not exist on type 'AdminPage'. Did you mean 'toggleRealTimeLogs'? [plugin angular-compiler]
[1]
[1]     src/app/pages/admin/admin.page.ts:655:17:
[1]       655 │             this.stopRealTimeLogs();
[1]           ╵                  ~~~~~~~~~~~~~~~~
[1]
[1]   'toggleRealTimeLogs' is declared here.
[1]
[1]     src/app/pages/admin/admin.page.ts:649:4:
[1]       649 │     toggleRealTimeLogs() {
[1]           ╵     ~~~~~~~~~~~~~~~~~~
[1]
[1]
[1] X [ERROR] TS2393: Duplicate function implementation. [plugin angular-compiler]
[1]
[1]     src/app/pages/admin/admin.page.ts:1160:18:
[1]       1160 │     private async showToast(message: string, color: string = 'pr...
[1]            ╵                   ~~~~~~~~~
[1]
[1]
[1] Watch mode enabled. Watching for file changes...