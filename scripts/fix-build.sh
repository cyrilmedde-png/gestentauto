#!/bin/bash

# Script pour corriger les erreurs de build
# À exécuter sur le serveur dans /var/www/talosprime

set -e

echo "🔧 Correction des erreurs de build..."

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Vous n'êtes pas dans le répertoire du projet"
    echo "   Exécutez: cd /var/www/talosprime"
    exit 1
fi

# Nettoyer le cache Next.js
echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next
rm -rf node_modules
rm -f package-lock.json

# Réinstaller les dépendances
echo "📦 Réinstallation des dépendances..."
npm install

# Vérifier que les fichiers existent
echo "🔍 Vérification des fichiers..."
if [ ! -f "lib/supabase/client.ts" ]; then
    echo "❌ Erreur: lib/supabase/client.ts n'existe pas"
    exit 1
fi

if [ ! -f "components/layout/MainLayout.tsx" ]; then
    echo "❌ Erreur: components/layout/MainLayout.tsx n'existe pas"
    exit 1
fi

if [ ! -f "components/auth/ProtectedRoute.tsx" ]; then
    echo "❌ Erreur: components/auth/ProtectedRoute.tsx n'existe pas"
    exit 1
fi

echo "✅ Tous les fichiers sont présents"

# Rebuild
echo "🔨 Reconstruction de l'application..."
npm run build

echo "✅ Build terminé avec succès !"




