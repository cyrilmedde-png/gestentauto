#!/bin/bash

# Script pour supprimer le dossier Pages Router qui cause des conflits
# et vérifier que tout fonctionne correctement après

set -e

echo "🔧 Correction du conflit Pages Router"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2
echo "⏸️  Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Vérifier si le dossier Pages Router existe
echo "🔍 Vérification du dossier Pages Router..."
if [ -d ".next/server/pages" ]; then
    echo "⚠️  Dossier .next/server/pages existe (Pages Router)"
    echo "   Ce dossier ne devrait pas exister avec App Router et peut causer des conflits"
    echo ""
    
    # Lister le contenu avant suppression
    echo "📋 Contenu du dossier .next/server/pages:"
    ls -lah .next/server/pages/ | head -20
    echo ""
    
    # Supprimer le dossier
    echo "🗑️  Suppression du dossier .next/server/pages..."
    rm -rf .next/server/pages
    echo "✅ Dossier supprimé"
else
    echo "✅ Dossier .next/server/pages n'existe pas (normal pour App Router)"
fi
echo ""

# 3. Vérifier qu'il n'y a pas d'autres dossiers pages
echo "🔍 Recherche d'autres dossiers pages..."
FIND_PAGES=$(find .next -type d -name "pages" 2>/dev/null || true)
if [ -z "$FIND_PAGES" ]; then
    echo "✅ Aucun autre dossier 'pages' trouvé"
else
    echo "⚠️  Autres dossiers 'pages' trouvés:"
    echo "$FIND_PAGES"
    echo "🗑️  Suppression..."
    echo "$FIND_PAGES" | xargs rm -rf 2>/dev/null || true
    echo "✅ Supprimés"
fi
echo ""

# 4. Rebuild pour régénérer proprement
echo "🔨 Rebuild de l'application..."
npm run build 2>&1 | tee /tmp/rebuild-after-pages-router.log

# Vérifier qu'il n'y a plus de dossier pages après rebuild
if [ -d ".next/server/pages" ]; then
    echo ""
    echo "⚠️  ATTENTION: Le dossier .next/server/pages a été régénéré!"
    echo "   Cela signifie que Next.js détecte une configuration Pages Router"
    echo "   Vérifiez qu'il n'y a pas de dossier 'pages' à la racine du projet"
    
    # Vérifier s'il y a un dossier pages à la racine
    if [ -d "pages" ]; then
        echo "❌ Dossier 'pages' trouvé à la racine! Ceci cause le conflit."
        echo "   Vous utilisez App Router, le dossier 'pages' ne devrait pas exister"
    else
        echo "ℹ️  Pas de dossier 'pages' à la racine (normal)"
    fi
else
    echo ""
    echo "✅ Pas de dossier .next/server/pages après rebuild (normal pour App Router)"
fi
echo ""

# 5. Redémarrer PM2
echo "🔄 Redémarrage de PM2..."
pm2 start talosprime --update-env || pm2 restart talosprime --update-env
sleep 3
echo "✅ PM2 redémarré"
echo ""

# 6. Tester la route localement
echo "🧪 Test de la route /platform/make sur localhost..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Route /platform/make répond 200 OK"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "✅ Route /platform/make répond $HTTP_CODE (redirection - normal)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Route /platform/make retourne toujours 404!"
    echo "📋 Vérifiez les logs: pm2 logs talosprime --lines 30"
else
    echo "⚠️  Code HTTP: $HTTP_CODE"
fi
echo ""

# 7. Vérification finale
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VÉRIFICATION FINALE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d ".next/server/pages" ]; then
    echo "❌ Le dossier .next/server/pages existe toujours"
    echo "   Il se peut que Next.js le régénère. Vérifiez la configuration."
    exit 1
else
    echo "✅ Dossier .next/server/pages n'existe pas (correct pour App Router)"
fi

echo ""
echo "✅ Correction terminée!"
echo ""
echo "💡 Si le 404 persiste dans le navigateur, vérifiez:"
echo "   1. La configuration Nginx: nginx -t && systemctl status nginx"
echo "   2. Les logs Nginx: tail -f /var/log/nginx/error.log"
echo "   3. Les logs PM2: pm2 logs talosprime --lines 50"
echo "   4. Le cache du navigateur (essayez en navigation privée ou videz le cache)"
echo ""


