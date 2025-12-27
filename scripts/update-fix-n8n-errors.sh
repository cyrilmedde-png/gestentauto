#!/bin/bash
# Script pour mettre à jour et corriger les erreurs N8N
# Usage: cd /var/www/talosprime && sudo bash ./scripts/update-fix-n8n-errors.sh

echo "🔧 Mise à jour et correction des erreurs N8N"
echo "============================================"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Ce script doit être exécuté depuis le répertoire racine du projet"
    exit 1
fi

# 1. Mettre à jour depuis GitHub
echo "1️⃣  Mise à jour depuis GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du git pull"
    exit 1
fi
echo "✅ Code mis à jour"
echo ""

# 2. Rebuild de l'application
echo "2️⃣  Rebuild de l'application Next.js..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi
echo "✅ Build réussi"
echo ""

# 3. Redémarrer PM2
echo "3️⃣  Redémarrage de l'application PM2..."
pm2 restart talosprime
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du redémarrage PM2"
    exit 1
fi
echo "✅ Application redémarrée"
echo ""

# 4. Vérifier et corriger la configuration WebSocket Nginx
echo "4️⃣  Vérification de la configuration WebSocket Nginx..."
if [ -f "./scripts/fix-websocket-nginx.sh" ]; then
    sudo bash ./scripts/fix-websocket-nginx.sh
    if [ $? -ne 0 ]; then
        echo "⚠️  Erreur lors de la configuration WebSocket, mais on continue..."
    else
        echo "✅ Configuration WebSocket vérifiée"
    fi
else
    echo "⚠️  Script fix-websocket-nginx.sh non trouvé, vérification manuelle nécessaire"
fi
echo ""

# 5. Vérifier le statut
echo "5️⃣  Vérification du statut..."
echo ""
echo "📊 Statut PM2:"
pm2 list | grep talosprime
echo ""
echo "📊 Statut Nginx:"
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "============================================"
echo "✅ Mise à jour terminée"
echo ""
echo "💡 Testez maintenant dans le navigateur:"
echo "   https://www.talosprimes.com/platform/n8n"
echo ""
echo "🔍 Si les erreurs persistent, vérifiez:"
echo "   1. Les logs PM2: pm2 logs talosprime --lines 50"
echo "   2. Les logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   3. Que N8N est accessible: curl -k https://n8n.talosprimes.com"
echo ""




