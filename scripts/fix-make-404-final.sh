#!/bin/bash

# Script pour résoudre définitivement le 404 de /platform/make
# À exécuter sur le serveur

set -e

echo "🔧 Correction finale du 404 pour /platform/make"
echo ""

cd /var/www/talosprime

# 1. Récupérer les dernières modifications
echo "📥 Récupération des modifications..."
git fetch origin main
git reset --hard origin/main

# 2. Vérifier que le fichier est correct
echo ""
echo "✅ Vérification du fichier page.tsx..."
if grep -q "export const dynamic = 'force-dynamic'" app/platform/make/page.tsx; then
    echo "✅ Le fichier contient bien dynamic = 'force-dynamic'"
else
    echo "❌ ERREUR: Le fichier ne contient pas dynamic = 'force-dynamic'"
    exit 1
fi

# 3. Nettoyer complètement
echo ""
echo "🧹 Nettoyage du cache et du build..."
rm -rf .next
rm -rf node_modules/.cache

# 4. Rebuild
echo ""
echo "🔨 Build de l'application..."
npm run build

# 5. Vérifier que la route est dynamique
echo ""
echo "🔍 Vérification que /platform/make est dynamique..."
if npm run build 2>&1 | grep -q "├.*ƒ.*/platform/make"; then
    echo "✅ La route est bien marquée comme dynamique (ƒ)"
else
    echo "⚠️  ATTENTION: La route pourrait être statique"
fi

# 6. Redémarrer PM2
echo ""
echo "🔄 Redémarrage de PM2..."
pm2 restart talosprime --update-env

# 7. Attendre un peu
sleep 2

# 8. Tester la route
echo ""
echo "🧪 Test de la route /platform/make..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://talosprimes.com/platform/make)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCÈS: La route retourne 200 OK"
    echo ""
    echo "🎉 Le problème est résolu !"
    echo ""
    echo "⚠️  IMPORTANT: Videz le cache de votre navigateur (Ctrl+Shift+R ou Cmd+Shift+R)"
else
    echo "❌ ERREUR: La route retourne $HTTP_CODE au lieu de 200"
    echo ""
    echo "Vérifiez les logs:"
    echo "  pm2 logs talosprime --lines 50"
    exit 1
fi

