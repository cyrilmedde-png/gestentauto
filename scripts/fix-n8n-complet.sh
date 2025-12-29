#!/bin/bash
# Script complet pour corriger N8N (PM2 + Iframe)
# Usage: sudo bash scripts/fix-n8n-complet.sh

echo "🔧 Correction complète de N8N (PM2 + Iframe)"
echo "============================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root"
fi

# 1. Corriger PM2
echo "1️⃣ Correction de la configuration PM2..."
echo "----------------------------------------"
if [ -f "scripts/fix-n8n-pm2.sh" ]; then
    bash scripts/fix-n8n-pm2.sh
    PM2_FIXED=$?
else
    echo "❌ Script fix-n8n-pm2.sh non trouvé"
    PM2_FIXED=1
fi

echo ""

# 2. Attendre que N8N démarre
if [ $PM2_FIXED -eq 0 ]; then
    echo "2️⃣ Attente du démarrage de N8N..."
    echo "----------------------------------"
    sleep 5
    
    # Vérifier que N8N répond
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ N8N répond sur le port 5678 (Code: $HTTP_CODE)"
    else
        echo "⚠️  N8N ne répond pas encore (Code: $HTTP_CODE)"
        echo "   💡 Vérifiez les logs: pm2 logs n8n"
    fi
else
    echo "⚠️  Correction PM2 échouée, vérifiez les erreurs ci-dessus"
fi

echo ""

# 3. Configurer l'iframe
echo "3️⃣ Configuration de l'iframe..."
echo "--------------------------------"
if [ -f "scripts/configure-n8n-iframe.sh" ]; then
    bash scripts/configure-n8n-iframe.sh
    IFRAME_FIXED=$?
else
    echo "❌ Script configure-n8n-iframe.sh non trouvé"
    IFRAME_FIXED=1
fi

echo ""

# 4. Vérification finale
echo "4️⃣ Vérification finale..."
echo "--------------------------"

# Vérifier PM2
echo "📋 Statut PM2:"
pm2 list | grep -i n8n || echo "   ⚠️  N8N non trouvé dans PM2"

echo ""

# Vérifier les headers Nginx
echo "📋 Headers Nginx pour N8N:"
HEADERS=$(curl -k -s -I https://n8n.talosprimes.com 2>/dev/null | grep -i "frame\|csp" || echo "")
if [ -z "$HEADERS" ]; then
    echo "   ⚠️  Aucun header frame/csp trouvé"
else
    echo "$HEADERS" | sed 's/^/   /'
    
    # Vérifier X-Frame-Options
    if echo "$HEADERS" | grep -qi "X-Frame-Options.*SAMEORIGIN"; then
        echo ""
        echo "   ❌ PROBLÈME: X-Frame-Options: SAMEORIGIN toujours présent"
        echo "   💡 Le script configure-n8n-iframe.sh n'a peut-être pas fonctionné"
    else
        echo ""
        echo "   ✅ X-Frame-Options: SAMEORIGIN supprimé"
    fi
    
    # Vérifier Content-Security-Policy
    if echo "$HEADERS" | grep -qi "Content-Security-Policy.*frame-ancestors.*www.talosprimes.com"; then
        echo "   ✅ Content-Security-Policy configuré correctement"
    else
        echo "   ⚠️  Content-Security-Policy non configuré ou incorrect"
    fi
fi

echo ""

# Résumé
echo "============================================="
echo "📋 Résumé"
echo "============================================="

if [ $PM2_FIXED -eq 0 ] && [ $IFRAME_FIXED -eq 0 ]; then
    echo "✅ Configuration complète terminée"
    echo ""
    echo "💡 Testez maintenant:"
    echo "   1. Accédez à https://www.talosprimes.com/platform/n8n"
    echo "   2. L'iframe devrait charger N8N sans erreur"
    echo ""
    echo "📝 Si l'iframe est toujours bloquée:"
    echo "   - Vérifiez les headers: curl -I https://n8n.talosprimes.com | grep -i frame"
    echo "   - Vérifiez les logs Nginx: sudo tail -f /var/log/nginx/error.log"
    echo "   - Vérifiez que Nginx a bien été rechargé: sudo systemctl status nginx"
else
    echo "⚠️  Certaines étapes ont échoué"
    echo ""
    if [ $PM2_FIXED -ne 0 ]; then
        echo "❌ Correction PM2 échouée"
    fi
    if [ $IFRAME_FIXED -ne 0 ]; then
        echo "❌ Configuration iframe échouée"
    fi
    echo ""
    echo "💡 Vérifiez les erreurs ci-dessus et réessayez"
fi

echo ""




