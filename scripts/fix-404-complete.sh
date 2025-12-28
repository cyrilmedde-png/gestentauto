#!/bin/bash

# Script complet pour corriger le 404 sur /platform/make
# Supprime le conflit Pages Router, rebuild, et vérifie Nginx

set -e

echo "🔧 Correction complète du 404 pour /platform/make"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏸️  ÉTAPE 1: Arrêt de PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Supprimer le dossier Pages Router
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  ÉTAPE 2: Suppression du conflit Pages Router"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".next/server/pages" ]; then
    echo "⚠️  Dossier .next/server/pages trouvé - suppression..."
    rm -rf .next/server/pages
    echo "✅ Dossier supprimé"
else
    echo "✅ Pas de dossier .next/server/pages (normal pour App Router)"
fi

# Vérifier qu'il n'y a pas de dossier pages à la racine
if [ -d "pages" ]; then
    echo "⚠️  Dossier 'pages' trouvé à la racine!"
    echo "   Vous utilisez App Router, ce dossier ne devrait pas exister"
    echo "   Voulez-vous le supprimer? (vous devez le faire manuellement si nécessaire)"
else
    echo "✅ Pas de dossier 'pages' à la racine (normal pour App Router)"
fi
echo ""

# 3. Nettoyer le build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 ÉTAPE 3: Nettoyage du build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
rm -rf .next
echo "✅ Build nettoyé"
echo ""

# 4. Rebuild
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 ÉTAPE 4: Rebuild de l'application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run build 2>&1 | tee /tmp/fix-404-build.log; then
    echo ""
    echo "✅ Build réussi!"
    
    # Vérifier que le dossier pages n'a pas été régénéré
    if [ -d ".next/server/pages" ]; then
        echo "⚠️  ATTENTION: .next/server/pages a été régénéré après le build"
        echo "   Cela indique qu'il y a une configuration Pages Router quelque part"
    else
        echo "✅ Pas de .next/server/pages après rebuild (normal)"
    fi
else
    echo ""
    echo "❌ ERREUR lors du build!"
    exit 1
fi
echo ""

# 5. Vérifier que la route est générée
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 ÉTAPE 5: Vérification de la route build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f ".next/server/app/platform/make/page.js" ]; then
    echo "✅ Route build générée: .next/server/app/platform/make/page.js"
    ls -lh .next/server/app/platform/make/page.js
else
    echo "❌ Route build non générée!"
    exit 1
fi
echo ""

# 6. Redémarrer PM2
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 ÉTAPE 6: Redémarrage de PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 start talosprime --update-env || pm2 restart talosprime --update-env
sleep 5
echo "✅ PM2 redémarré"
echo ""

# 7. Tester localement
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 ÉTAPE 7: Test local de la route"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Route /platform/make répond 200 OK localement"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "✅ Route /platform/make répond $HTTP_CODE localement (redirection - normal)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Route /platform/make retourne 404 localement!"
    echo "📋 Vérifiez les logs: pm2 logs talosprime --lines 30"
    exit 1
else
    echo "⚠️  Code HTTP local: $HTTP_CODE"
fi
echo ""

# 8. Vérifier la configuration Nginx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 ÉTAPE 8: Vérification de la configuration Nginx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ Configuration Nginx trouvée: $NGINX_CONFIG"
    
    # Vérifier que toutes les routes sont proxifiées
    if grep -q "location /" "$NGINX_CONFIG"; then
        echo "✅ Bloc 'location /' trouvé"
        
        if grep -A 10 "location /" "$NGINX_CONFIG" | grep -q "proxy_pass.*3000"; then
            echo "✅ Toutes les routes sont proxifiées vers Next.js (port 3000)"
        else
            echo "⚠️  Le bloc 'location /' ne contient pas de proxy_pass vers port 3000"
            echo "   Cela peut causer le 404 dans le navigateur"
        fi
    else
        echo "⚠️  Bloc 'location /' non trouvé dans la configuration"
    fi
    
    # Vérifier la syntaxe Nginx
    if nginx -t >/dev/null 2>&1; then
        echo "✅ Syntaxe Nginx valide"
    else
        echo "⚠️  Problème de syntaxe Nginx détecté"
        nginx -t
    fi
else
    echo "⚠️  Configuration Nginx non trouvée à $NGINX_CONFIG"
fi
echo ""

# 9. Instructions finales
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RÉSUMÉ ET PROCHAINES ÉTAPES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Corrections appliquées:"
echo "   - Dossier Pages Router supprimé"
echo "   - Build nettoyé et régénéré"
echo "   - PM2 redémarré"
echo ""
echo "🧪 Si le 404 persiste dans le navigateur:"
echo ""
echo "   1. Vérifiez les logs Nginx:"
echo "      tail -f /var/log/nginx/error.log"
echo "      tail -f /var/log/nginx/access.log"
echo ""
echo "   2. Vérifiez que Nginx route bien vers Next.js:"
echo "      grep -A 5 'location /' /etc/nginx/sites-available/talosprime"
echo ""
echo "   3. Testez directement Next.js (devrait fonctionner):"
echo "      curl -I http://localhost:3000/platform/make"
echo ""
echo "   4. Si Next.js répond mais Nginx non, rechargez Nginx:"
echo "      sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "   5. Videz le cache du navigateur ou testez en navigation privée"
echo ""
echo "   6. Vérifiez les logs PM2 pour des erreurs:"
echo "      pm2 logs talosprime --lines 50"
echo ""

