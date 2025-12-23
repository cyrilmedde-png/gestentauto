#!/bin/bash

# Script pour corriger les dépendances manquantes
# Usage: sudo bash scripts/fix-dependencies.sh

set -e

echo "🔧 Correction des dépendances manquantes..."

# Aller dans le répertoire du projet
cd /var/www/talosprime || {
    echo "❌ Erreur: Impossible d'accéder au répertoire /var/www/talosprime"
    exit 1
}

echo "🧹 Nettoyage des dépendances existantes..."
rm -rf node_modules package-lock.json .next

echo "📦 Réinstallation complète des dépendances (y compris devDependencies)..."
# IMPORTANT: Ne pas utiliser --production car on a besoin de tailwindcss, postcss, etc. pour le build
npm install --include=dev

# Vérifier que tailwindcss est bien installé
if [ ! -d "node_modules/tailwindcss" ]; then
  echo "⚠️  tailwindcss non trouvé, réinstallation forcée..."
  npm install tailwindcss postcss autoprefixer --save-dev
fi

# Vérifier l'installation
echo ""
echo "🔍 Vérification des dépendances critiques..."
if [ -d "node_modules/tailwindcss" ]; then
  echo "✅ tailwindcss installé"
else
  echo "❌ tailwindcss manquant!"
  exit 1
fi

if [ -d "node_modules/postcss" ]; then
  echo "✅ postcss installé"
else
  echo "❌ postcss manquant!"
  exit 1
fi

if [ -d "node_modules/next" ]; then
  echo "✅ next installé"
else
  echo "❌ next manquant!"
  exit 1
fi

echo "✅ Dépendances réinstallées avec succès!"

echo ""
echo "💡 Vous pouvez maintenant relancer le build avec:"
echo "   npm run build"
echo ""
echo "   Ou utiliser le script de déploiement complet:"
echo "   sudo bash scripts/deploy.sh"

