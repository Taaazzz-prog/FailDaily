#!/bin/bash
# Script pour downgrader Angular v20 vers v18 (compatible avec Ionic v8)

echo "🔧 Downgrade Angular v20 -> v18 pour compatibilité Ionic v8..."

# Arrêter le serveur Angular s'il tourne
pkill -f "ng serve" 2>/dev/null || true

cd "$(dirname "$0")"

# Sauvegarder package.json
cp package.json package.json.backup

# Installer Angular v18
echo "📦 Installation Angular v18..."
npm install @angular/animations@^18.0.0 @angular/common@^18.0.0 @angular/compiler@^18.0.0 @angular/core@^18.0.0 @angular/forms@^18.0.0 @angular/platform-browser@^18.0.0 @angular/platform-browser-dynamic@^18.0.0 @angular/router@^18.0.0 --save

# Installer Angular DevKit v18
echo "📦 Installation Angular DevKit v18..."
npm install @angular-devkit/build-angular@^18.0.0 @angular/cli@^18.0.0 --save-dev

# Mettre à jour TypeScript (compatible Angular v18)
npm install typescript@~5.4.0 --save-dev

echo "✅ Downgrade terminé !"
echo "🔄 Redémarrage nécessaire..."

# Nettoyer le cache
npm run unlock:esbuild 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo "🚀 Vous pouvez maintenant redémarrer avec: npm start"
