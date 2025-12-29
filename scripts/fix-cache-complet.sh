#!/bin/bash

# Script pour vider TOUS les caches et rebuild proprement

set -e

echo "🧹 NETTOYAGE COMPLET DES CACHES"
echo ""

# 1. Arrêter PM2
echo "⏸️  Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Vider tous les caches Next.js
echo "🗑️  Suppression des caches Next.js..."
rm -rf .next
rm -rf .next/cache
rm -rf node_modules/.cache
rm -rf .turbo
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
echo "✅ Caches Next.js supprimés"
echo ""

# 3. Vider le cache npm
echo "🗑️  Suppression du cache npm..."
npm cache clean --force 2>/dev/null || true
echo "✅ Cache npm supprimé"
echo ""

# 4. Rebuild complet
echo "🔨 Rebuild complet..."
npm run build
echo "✅ Build terminé"
echo ""

# 5. Supprimer Pages Router si présent
if [ -d ".next/server/pages" ]; then
    echo "🗑️  Suppression du Pages Router..."
    rm -rf .next/server/pages
    echo "✅ Pages Router supprimé"
    echo ""
fi

# 6. Redémarrer PM2
echo "🔄 Redémarrage de PM2..."
pm2 restart talosprime --update-env 2>/dev/null || pm2 start npm --name talosprime -- start --update-env
sleep 5
pm2 save 2>/dev/null || true
echo "✅ PM2 redémarré"
echo ""

echo "✅ NETTOYAGE TERMINÉ"
echo ""
echo "📝 IMPORTANT : Videz aussi le cache de votre navigateur :"
echo "   - Chrome/Edge: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)"
echo "   - Cochez 'Images et fichiers en cache'"
echo "   - Cliquez sur 'Effacer les données'"
echo ""


