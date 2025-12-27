#!/bin/bash

echo "🧹 Nettoyage et rebuild pour Make.com"
echo "======================================"
echo ""

cd /var/www/talosprime

echo "1️⃣ Arrêt de PM2..."
pm2 stop talosprime

echo ""
echo "2️⃣ Nettoyage du build précédent..."
rm -rf .next
echo "✅ Dossier .next supprimé"

echo ""
echo "3️⃣ Nettoyage du cache npm (optionnel)..."
# npm cache clean --force 2>/dev/null || true

echo ""
echo "4️⃣ Rebuild complet..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build réussi"
    
    echo ""
    echo "5️⃣ Vérification que la route Make est compilée..."
    if [ -f ".next/server/app/api/platform/make/proxy/route.js" ]; then
        echo "✅ Route Make compilée trouvée"
    else
        echo "❌ Route Make NON trouvée dans le build"
        echo "   Vérifiez que app/api/platform/make/proxy/route.ts existe"
    fi
    
    echo ""
    echo "6️⃣ Redémarrage de PM2..."
    pm2 start talosprime
    pm2 save
    
    echo ""
    echo "✅ Rebuild terminé"
    echo ""
    echo "💡 Vérifiez maintenant les logs:"
    echo "   pm2 logs talosprime --lines 50 | grep -i make"
else
    echo "❌ Erreur lors du build"
    echo "   Vérifiez les erreurs ci-dessus"
    exit 1
fi



