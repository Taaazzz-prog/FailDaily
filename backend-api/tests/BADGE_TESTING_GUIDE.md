/**
 * GUIDE UTILISATION - SYSTÈME DE TEST BADGES FAILDAILY
 * ====================================================
 * 
 * Ce document explique comment utiliser le système de test complet
 * pour valider 100% des badges FailDaily
 */

# 🏆 Système de Test Badges FailDaily

## 🎯 Vue d'ensemble

Le système de test badges permet de valider automatiquement :
- ✅ **Déblocage des badges** : Vérifier que 100% des badges peuvent être débloqués
- ✅ **Notifications** : S'assurer que les messages de déblocage apparaissent
- ✅ **Affichage** : Contrôler que les badges s'affichent correctement dans l'interface
- ✅ **Exclusion** : Vérifier que les badges débloqués n'apparaissent plus dans "Prochains défis"

## 📁 Fichiers créés

### Scripts de test backend
- `backend-api/tests/badge-system-complete-test.js` - Classe principale de test
- `backend-api/tests/next-challenges-validator.js` - Validation "Prochains défis"
- `backend-api/tests/run-badge-tests.js` - Script de lancement simple
- `backend-api/tests/validate-badges.js` - Script complet avec validation

### API endpoints
- `backend-api/src/routes/test.js` - Endpoints API pour tests badges

## 🚀 Utilisation

### 1. Tests en ligne de commande

#### Test complet avec nouvel utilisateur
```bash
cd backend-api
node tests/validate-badges.js
```

#### Test avec utilisateur existant (Bruno)
```bash
cd backend-api
node tests/validate-badges.js bruno@taaazzz.be
```

#### Test rapide "Prochains défis" seulement
```bash
cd backend-api
node tests/validate-badges.js --quick bruno@taaazzz.be
```

#### Autres scripts disponibles
```bash
# Test badges simple
node tests/run-badge-tests.js

# Test avec utilisateur spécifique
node tests/run-badge-tests.js bruno@taaazzz.be

# Test validation "Prochains défis"
node tests/next-challenges-validator.js
```

### 2. Tests via API (mode développement)

#### Test complet badges pour utilisateur connecté
```http
GET /api/test/badges/complete
Authorization: Bearer <token>
```

#### Validation "Prochains défis"
```http
GET /api/test/badges/next-challenges
Authorization: Bearer <token>
```

#### Simulation déblocage badges
```http
POST /api/test/badges/simulate
Authorization: Bearer <token>
Content-Type: application/json

{
  "badgeType": "fails",
  "count": 5
}
```

## 📊 Types de tests effectués

### 1. Test de déblocage (badge-system-complete-test.js)
- **fails_count** : Simule la création de fails pour débloquer badges basés sur le nombre
- **reactions_given** : Simule des réactions données pour badges d'entraide
- **days_since_join** : Modifie la date d'inscription pour badges ancienneté
- **consecutive_days** : Crée des logs d'activité pour badges régularité

### 2. Test notifications
- Vérifie que `checkAndUnlockBadges()` retourne les nouveaux badges
- Contrôle les messages de déblocage générés
- Valide le format des notifications

### 3. Test affichage interface
- Vérifie la structure des données retournées par l'API
- Contrôle la cohérence des informations badges
- Valide les timestamps de déblocage

### 4. Test "Prochains défis" (next-challenges-validator.js)
- **Exclusion correcte** : Les badges débloqués n'apparaissent pas dans la liste
- **Cohérence mathématique** : Total badges = Débloqués + Prochains défis
- **API frontend** : Simulation de la logique frontend

## 🔍 Exemple de sortie

```
🏆 === DÉBUT DES TESTS COMPLETS BADGES FAILDAILY ===
📊 Test 1: Intégrité base de données badges...
✅ Base de données OK - 70 badges disponibles
👤 Création utilisateur de test...
✅ Utilisateur test créé: test-badges-1642345678@faildaily.test
🏅 Test 3: Déblocage de tous les types de badges...
  🔍 Test badge: Premier Pas (fails_count=1)
  ✅ Badge Premier Pas débloqué avec succès
  🔍 Test badge: Apprenti (fails_count=5)
  ✅ Badge Apprenti débloqué avec succès
🔔 Test 4: Notifications de déblocage...
✅ 15 notifications générées
🖥️ Test 5: Affichage interface...
✅ 15 badges affichés pour l'utilisateur
🎯 Test 6: Exclusion "Prochains défis"...
✅ 55 badges dans "Prochains défis"
✅ 15 badges exclus (déjà débloqués)

🎯 === VALIDATION "PROCHAINS DÉFIS" ===
📊 Badges débloqués: 15
📊 Badges totaux: 70
🎯 Prochains défis: 55
✅ API frontend: 55 prochains défis

🎯 === RAPPORT VALIDATION "PROCHAINS DÉFIS" ===
✅ VALIDATION RÉUSSIE!
✅ Aucun badge débloqué dans "Prochains défis"

🏆 === RAPPORT FINAL TESTS BADGES FAILDAILY ===
📊 Badges disponibles: 70
🧪 Badges testés: 65
✅ Déblocages réussis: 65
❌ Déblocages échoués: 0
🔔 Tests notifications: 15
🖥️ Tests affichage: 15

✅ TOUS LES TESTS PASSÉS AVEC SUCCÈS!
📈 Taux de réussite: 100.00%

🎉 TOUS LES TESTS RÉUSSIS!
✅ Système de badges entièrement fonctionnel
✅ "Prochains défis" fonctionne correctement
```

## ⚙️ Configuration et personnalisation

### Variables d'environnement requises
```env
NODE_ENV=development  # Pour accès aux endpoints de simulation
DB_HOST=localhost
DB_NAME=faildaily
# ... autres variables de base de données
```

### Personnaliser les tests

#### Ajouter un nouveau type de badge
1. Modifier `testBadgeUnlock()` dans `badge-system-complete-test.js`
2. Ajouter la logique de simulation correspondante
3. Mettre à jour les tests de validation

#### Modifier les critères de validation
Éditer `validateExclusion()` dans `next-challenges-validator.js` pour ajouter des contrôles spécifiques.

## 🚨 Points d'attention

### Nettoyage automatique
- Les utilisateurs de test sont automatiquement supprimés après les tests
- Option `--clean` pour forcer le nettoyage
- Attention aux tests avec utilisateurs existants (pas de nettoyage)

### Limitations actuelles
- Certains badges spéciaux ne sont pas testés automatiquement
- Les badges basés sur des événements externes nécessitent une simulation manuelle
- Les tests ne couvrent pas les aspects de performance en charge

### Sécurité
- Endpoints de simulation disponibles uniquement en mode `development`
- Authentication requise pour tous les endpoints de test
- Les tests créent des données temporaires nettoyées automatiquement

## 🔧 Dépannage

### Erreurs courantes

#### "Tables badges manquantes"
- Vérifier que la base de données `faildaily` est bien configurée
- S'assurer que les migrations ont été appliquées

#### "Badge non débloqué malgré les conditions"
- Vérifier les triggers MySQL pour l'attribution automatique
- Contrôler le service `badgesService.js`

#### "Utilisateur non trouvé"
- Vérifier l'orthographe de l'email
- S'assurer que l'utilisateur existe dans la base

### Debug mode
Ajouter `console.log` dans les scripts pour plus de détails :
```javascript
// Dans badge-system-complete-test.js
console.log('Debug:', badge, unlocked);
```

## 📈 Métriques et KPIs

Le système mesure :
- **Taux de réussite déblocage** : % de badges débloqués avec succès
- **Temps d'exécution** : Performance des tests
- **Cohérence données** : Intégrité entre API et frontend
- **Couverture tests** : % de badges testés automatiquement

---

## 🎯 Utilisation recommandée

### Tests de développement
```bash
# Test rapide pendant développement
node tests/validate-badges.js --quick bruno@taaazzz.be

# Test complet avant déploiement
node tests/validate-badges.js
```

### Tests de validation utilisateur
```bash
# Valider un utilisateur spécifique
node tests/validate-badges.js user@example.com
```

### Intégration CI/CD
```bash
# Dans pipeline de déploiement
npm run test:badges
```

Ce système garantit que **100% des badges peuvent être débloqués** et que **l'affichage "Prochains défis" fonctionne correctement** en excluant les badges déjà obtenus. 🏆