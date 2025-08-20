#!/bin/bash

# FailDaily - Script de tests
TEST_TYPE=${1:-all}
COVERAGE=false
WATCH=false

# Parse des arguments
for arg in "$@"; do
    case $arg in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
    esac
done

echo "🧪 FailDaily - Tests $TEST_TYPE"

# Navigation vers la racine du projet
ROOT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_PATH"

test_frontend() {
    echo "📱 Tests frontend..."
    cd frontend
    
    if [ "$WATCH" = true ]; then
        npm run test -- --watch
    elif [ "$COVERAGE" = true ]; then
        npm run test -- --code-coverage
    else
        npm run test
    fi
    
    frontend_result=$?
    cd "$ROOT_PATH"
    return $frontend_result
}

test_backend() {
    echo "🚀 Tests backend..."
    cd backend-api
    
    if [ "$WATCH" = true ]; then
        npm run test -- --watch
    elif [ "$COVERAGE" = true ]; then
        npm run test -- --coverage
    else
        npm run test
    fi
    
    backend_result=$?
    cd "$ROOT_PATH"
    return $backend_result
}

test_e2e() {
    echo "🎭 Tests E2E..."
    
    # Démarrer les services si nécessaire
    echo "🚀 Démarrage des services..."
    npm run dev:backend &
    BACKEND_PID=$!
    sleep 5
    npm run dev:frontend &
    FRONTEND_PID=$!
    sleep 10
    
    # Lancer les tests E2E
    cd frontend
    npm run e2e
    e2e_result=$?
    
    # Arrêter les services
    echo "🛑 Arrêt des services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    
    cd "$ROOT_PATH"
    return $e2e_result
}

test_age_validation() {
    echo "👶 Tests validation d'âge..."
    
    # Lancer le script de test d'âge
    if [ -f "devops/scripts/test-age-validation.js" ]; then
        node "devops/scripts/test-age-validation.js"
    else
        echo "❌ Script de test d'âge non trouvé"
        return 1
    fi
    
    return $?
}

test_all() {
    echo "🎯 Tests complets..."
    
    results=()
    
    # Tests unitaires frontend
    echo -e "\n--- Tests Frontend ---"
    test_frontend
    results+=("Frontend:$?")
    
    # Tests unitaires backend
    echo -e "\n--- Tests Backend ---"
    test_backend
    results+=("Backend:$?")
    
    # Tests validation d'âge
    echo -e "\n--- Tests Validation Âge ---"
    test_age_validation
    results+=("Age Validation:$?")
    
    # Tests E2E (optionnel)
    if [ "$WATCH" != true ]; then
        echo -e "\n--- Tests E2E ---"
        test_e2e
        results+=("E2E:$?")
    fi
    
    # Résumé
    echo -e "\n📊 Résumé des tests:"
    total_failures=0
    for result in "${results[@]}"; do
        name="${result%:*}"
        code="${result#*:}"
        if [ "$code" -eq 0 ]; then
            echo "✅ $name: SUCCÈS"
        else
            echo "❌ $name: ÉCHEC"
            ((total_failures++))
        fi
    done
    
    if [ $total_failures -eq 0 ]; then
        echo -e "\n🎉 Tous les tests sont passés!"
        return 0
    else
        echo -e "\n💥 $total_failures test(s) ont échoué"
        return 1
    fi
}

case "${TEST_TYPE,,}" in
    "frontend")
        test_frontend
        ;;
    "backend")
        test_backend
        ;;
    "e2e")
        test_e2e
        ;;
    "age")
        test_age_validation
        ;;
    "all")
        test_all
        ;;
    *)
        echo "❌ Type de test non reconnu: $TEST_TYPE"
        echo "Types disponibles: frontend, backend, e2e, age, all"
        exit 1
        ;;
esac
