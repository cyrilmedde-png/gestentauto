#!/bin/bash
# Script pour mettre à jour le serveur avec les corrections N8N
# Usage: ./scripts/update-server-n8n-fix.sh

set -e

cd /var/www/talosprime

echo "🔄 Mise à jour depuis GitHub..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du git pull"
    echo "💡 Essayez: git stash puis git pull origin main"
    exit 1
fi

echo ""
echo "📦 Installation des dépendances..."
npm install

echo ""
echo "🔨 Build de l'application..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build réussi !"
    echo "🔄 Redémarrage de l'application..."
    pm2 restart talosprime
    
    echo ""
    echo "⏳ Attente de 3 secondes..."
    sleep 3
    
    echo ""
    echo "📊 Test de la route health..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/platform/n8n/health)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Route health répond avec 200 OK !"
    else
        echo "⚠️  Route health répond avec $HTTP_CODE"
    fi
    
    echo ""
    echo "🎉 Mise à jour terminée !"
else
    echo ""
    echo "❌ Erreur lors du build"
    echo "📋 Vérifiez les erreurs ci-dessus"
    exit 1
fi




