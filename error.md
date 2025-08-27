mysql.service.ts:1542 
 GET http://localhost:3000/api/admin/logs/by-type?type=all&limit=20&periodHours=24 404 (Not Found)
debug.service.ts:48 ❌ Erreur récupération logs par type: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=all&limit=20&periodHours=24', ok: false, …}
debug.service.ts:48 ❌ Erreur lors du chargement des logs complets: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=all&limit=20&periodHours=24', ok: false, …}
mysql.service.ts:1542 
 GET http://localhost:3000/api/admin/logs/by-type?type=all&limit=1000&periodHours=24 404 (Not Found)
debug.service.ts:48 ❌ Erreur récupération logs par type: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=all&limit=1000&periodHours=24', ok: false, …}
debug.service.ts:48 ❌ Erreur stats logs: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=all&limit=1000&periodHours=24', ok: false, …}
admin:1 Blocked aria-hidden on an element because its descendant retained focus. The focus must not be hidden from assistive technology users. Avoid using aria-hidden on a focused element or its ancestor. Consider using the inert attribute instead, which will also prevent focus. For more details, see the aria-hidden section of the WAI-ARIA specification at https://w3c.github.io/aria/#aria-hidden.
Element with focus: <button#ion-sel-0>
Ancestor with aria-hidden: <ion-router-outlet.hydrated> 
debug.service.ts:65 🔍 Chargement des logs avec filtres: 
{activity_type: 'auth', start_date: Tue Aug 26 2025 11:38:12 GMT+0200 (heure d’été d’Europe centrale), end_date: Wed Aug 27 2025 11:38:12 GMT+0200 (heure d’été d’Europe centrale)}
mysql.service.ts:1542 
 GET http://localhost:3000/api/admin/logs/by-type?type=auth&limit=20&periodHours=24 404 (Not Found)
debug.service.ts:48 ❌ Erreur récupération logs par type: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=auth&limit=20&periodHours=24', ok: false, …}
debug.service.ts:48 ❌ Erreur lors du chargement des logs complets: 
HttpErrorResponse {headers: _HttpHeaders, status: 404, statusText: 'Not Found', url: 'http://localhost:3000/api/admin/logs/by-type?type=auth&limit=20&periodHours=24', ok: false, …}

﻿
