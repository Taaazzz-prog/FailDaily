#!/bin/bash
# Script de test des endpoints admin FailDaily
# Pour vérifier que toutes les données s'affichent correctement

API_BASE="https://faildaily.com/api"
EMAIL="bruno@taaazzz.be"
PASSWORD="motdepasse"

echo "=== TEST ENDPOINTS ADMIN FAILDAILY ==="
echo "Serveur: $API_BASE"
echo "Utilisateur: $EMAIL"
echo ""

# 1. Connexion et récupération du token
echo "1. Connexion admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Réponse login: $LOGIN_RESPONSE" | jq .

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ ERREUR: Impossible de récupérer le token d'authentification"
  echo "Réponse: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token récupéré: ${TOKEN:0:20}..."
echo ""

# Headers avec authentification
AUTH_HEADER="Authorization: Bearer $TOKEN"

# 2. Test endpoint dashboard/stats
echo "2. Test /admin/dashboard/stats..."
DASHBOARD_RESPONSE=$(curl -s "$API_BASE/admin/dashboard/stats" -H "$AUTH_HEADER")
echo "$DASHBOARD_RESPONSE" | jq .
echo ""

# 3. Test endpoint users (liste)
echo "3. Test /admin/users..."
USERS_RESPONSE=$(curl -s "$API_BASE/admin/users" -H "$AUTH_HEADER")
echo "$USERS_RESPONSE" | jq .
echo ""

# 4. Test endpoint fails by status
echo "4. Test /admin/fails/by-status..."
FAILS_RESPONSE=$(curl -s "$API_BASE/admin/fails/by-status" -H "$AUTH_HEADER")
echo "$FAILS_RESPONSE" | jq .
echo ""

# 5. Test endpoint config
echo "5. Test /admin/config..."
CONFIG_RESPONSE=$(curl -s "$API_BASE/admin/config" -H "$AUTH_HEADER")
echo "$CONFIG_RESPONSE" | jq .
echo ""

# 6. Test logs (corrigé)
echo "6. Test /admin/logs/by-type..."
LOGS_RESPONSE=$(curl -s "$API_BASE/admin/logs/by-type?type=all&limit=10&periodHours=24" -H "$AUTH_HEADER")
echo "$LOGS_RESPONSE" | jq .
echo ""

# 7. Test bases de données counts
echo "7. Test /admin/db/counts..."
DB_RESPONSE=$(curl -s "$API_BASE/admin/db/counts" -H "$AUTH_HEADER")
echo "$DB_RESPONSE" | jq .
echo ""

echo "=== FIN DES TESTS ==="