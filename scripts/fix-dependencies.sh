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

echo "📦 Réinstallation complète des dépendances..."
npm install

echo "✅ Dépendances réinstallées avec succès!"

echo ""
echo "💡 Vous pouvez maintenant relancer le build avec:"
echo "   npm run build"
echo ""
echo "   Ou utiliser le script de déploiement complet:"
echo "   sudo bash scripts/deploy.sh"

