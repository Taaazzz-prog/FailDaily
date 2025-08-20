#!/bin/bash

# FailDaily - Script de tests de charge
TARGET=${1:-all}
USERS=${2:-10}
DURATION=${3:-30s}

echo "🔥 FailDaily - Tests de charge"

# Navigation vers la racine du projet
ROOT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_PATH"

show_loadtest_help() {
    echo "Usage: ./load-test.sh [target] [users] [duration]"
    echo ""
    echo "Parametres:"
    echo "  target      Cible des tests (api, frontend, registration, all)"
    echo "  users       Nombre d'utilisateurs simultanees (defaut: 10)"
    echo "  duration    Duree du test (defaut: 30s)"
    echo ""
    echo "Exemples:"
    echo "  ./load-test.sh api 50 60s"
    echo "  ./load-test.sh registration 20 45s"
    echo "  ./load-test.sh all 100 120s"
}

install_loadtest_tools() {
    echo "📦 Installation des outils de test de charge..."
    
    # Vérifier si Artillery est installé
    if command -v artillery &> /dev/null; then
        echo "✅ Artillery deja installe: $(artillery --version)"
    else
        echo "📥 Installation d'Artillery..."
        npm install -g artillery
    fi
    
    # Vérifier si autocannon est installé
    if command -v autocannon &> /dev/null; then
        echo "✅ Autocannon deja installe: $(autocannon --version)"
    else
        echo "📥 Installation d'Autocannon..."
        npm install -g autocannon
    fi
}

test_api_loadtest() {
    echo "🚀 Tests de charge API Backend..."
    echo "Utilisateurs: $USERS | Duree: $DURATION"
    
    # Créer le fichier de configuration Artillery pour l'API
    cat > devops/scripts/api-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: $DURATION
      arrivalRate: $USERS
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "API Health Check"
    weight: 30
    flow:
      - get:
          url: "/health"
      - think: 1

  - name: "Get Fails"
    weight: 40
    flow:
      - get:
          url: "/api/fails"
      - think: 2

  - name: "User Registration Flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "loadtest{{ \$randomNumber(1, 10000) }}@example.com"
            password: "TestPassword123!"
            displayName: "LoadTestUser{{ \$randomNumber(1, 10000) }}"
            birthDate: "1990-01-01"
      - think: 3
EOF

    echo "🎯 Lancement du test de charge API..."
    artillery run devops/scripts/api-load-test.yml
}

test_frontend_loadtest() {
    echo "📱 Tests de charge Frontend..."
    echo "Utilisateurs: $USERS | Duree: $DURATION"
    
    echo "🎯 Lancement du test de charge Frontend..."
    autocannon -c $USERS -d $DURATION http://localhost:8100
}

test_registration_loadtest() {
    echo "👶 Tests de charge Registration & Age Validation..."
    echo "Utilisateurs: $USERS | Duree: $DURATION"
    
    # Configuration spécifique pour tester l'inscription avec validation d'âge
    cat > devops/scripts/registration-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: $DURATION
      arrivalRate: $USERS
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Adult Registration (17+)"
    weight: 40
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "adult{{ \$randomNumber(1, 10000) }}@example.com"
            password: "TestPassword123!"
            displayName: "AdultUser{{ \$randomNumber(1, 10000) }}"
            birthDate: "1990-05-15"
      - think: 2

  - name: "Minor Registration (13-16)"
    weight: 30
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "minor{{ \$randomNumber(1, 10000) }}@example.com"
            password: "TestPassword123!"
            displayName: "MinorUser{{ \$randomNumber(1, 10000) }}"
            birthDate: "2010-05-15"
      - think: 2

  - name: "Child Registration (<13) - Should Fail"
    weight: 30
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "child{{ \$randomNumber(1, 10000) }}@example.com"
            password: "TestPassword123!"
            displayName: "ChildUser{{ \$randomNumber(1, 10000) }}"
            birthDate: "2018-05-15"
          expect:
            - statusCode: 403
      - think: 1
EOF

    echo "🎯 Lancement du test de charge Registration..."
    artillery run devops/scripts/registration-load-test.yml
}

test_all_loadtest() {
    echo "🎯 Tests de charge complets..."
    
    echo -e "\n=== TEST 1: API Backend ==="
    test_api_loadtest
    
    sleep 5
    
    echo -e "\n=== TEST 2: Frontend ==="
    test_frontend_loadtest
    
    sleep 5
    
    echo -e "\n=== TEST 3: Registration & Age Validation ==="
    test_registration_loadtest
    
    echo -e "\n✅ Tests de charge complets termines!"
}

check_services() {
    echo "🔍 Verification des services..."
    
    # Vérifier le backend
    if curl -f -s http://localhost:3000/health > /dev/null; then
        echo "✅ Backend disponible"
    else
        echo "❌ Backend non disponible - Veuillez demarrer le backend"
        echo "Commande: npm run dev:backend"
        return 1
    fi
    
    # Vérifier le frontend
    if curl -f -s http://localhost:8100 > /dev/null; then
        echo "✅ Frontend disponible"
    else
        echo "⚠️ Frontend non disponible (non critique pour tests API)"
    fi
    
    return 0
}

# Installation des outils si nécessaire
install_loadtest_tools

# Vérification des services
if ! check_services; then
    echo "❌ Services non disponibles - Arret du script"
    exit 1
fi

# Exécution des tests selon la cible
case "${TARGET,,}" in
    "api")
        test_api_loadtest
        ;;
    "frontend")
        test_frontend_loadtest
        ;;
    "registration")
        test_registration_loadtest
        ;;
    "all")
        test_all_loadtest
        ;;
    "help")
        show_loadtest_help
        ;;
    *)
        echo "❌ Cible non reconnue: $TARGET"
        show_loadtest_help
        exit 1
        ;;
esac

echo -e "\n📊 Tests de charge termines!"
echo "📁 Rapports generes dans le dossier courant"
