#!/bin/bash

# Script pour vider TOUS les caches et résoudre le 404
# À exécuter sur le serveur

set -e

echo "🧹 Nettoyage COMPLET de tous les caches pour /platform/make"
echo ""

cd /var/www/talosprime

# 1. Récupérer les modifications
echo "📥 Récupération des modifications..."
git pull origin main

# 2. Nettoyer TOUS les caches
echo ""
echo "🧹 Nettoyage des caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .next/cache 2>/dev/null || true

# 3. Rebuild
echo ""
echo "🔨 Build de l'application..."
npm run build

# 4. Redémarrer PM2
echo ""
echo "🔄 Redémarrage de PM2..."
pm2 restart talosprime --update-env

# 5. Vider le cache Nginx (si configuré)
echo ""
echo "🔄 Rechargement de Nginx..."
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || echo "⚠️  Impossible de recharger Nginx"

# 6. Attendre
sleep 3

# 7. Tester avec curl en forçant le non-cache
echo ""
echo "🧪 Test de la route (sans cache)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Cache-Control: no-cache" \
  -H "Pragma: no-cache" \
  https://talosprimes.com/platform/make)

echo ""
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCÈS: La route retourne 200 OK"
    echo ""
    echo "🎉 Le problème est résolu !"
    echo ""
    echo "⚠️  IMPORTANT: Videz le cache de votre navigateur:"
    echo "   - Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
    echo "   - Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
    echo ""
    echo "   Ou ouvrez en navigation privée pour tester"
else
    echo "❌ ERREUR: La route retourne $HTTP_CODE au lieu de 200"
    echo ""
    echo "Vérifiez:"
    echo "  1. Les logs PM2: pm2 logs talosprime --lines 50"
    echo "  2. Que le fichier existe: ls -la app/platform/make/page.tsx"
    echo "  3. Le contenu du fichier: cat app/platform/make/page.tsx"
    exit 1
fi

