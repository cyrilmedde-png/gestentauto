#!/bin/bash

# Script de déploiement de l'application Next.js
# À exécuter depuis le répertoire du projet

set -e

APP_DIR="/var/www/talosprime"
APP_NAME="talosprime"

echo "🚀 Déploiement de l'application Next.js..."

# Se placer dans le répertoire de l'application
cd $APP_DIR

# Vérifier si c'est un repo Git
if [ -d ".git" ]; then
    echo "📥 Mise à jour depuis Git..."
    git pull origin main || git pull origin master
else
    echo "⚠️  Ce n'est pas un repo Git. Assurez-vous que le code est présent dans $APP_DIR"
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production

# Build de l'application Next.js
echo "🔨 Build de l'application..."
npm run build

# Arrêter l'application si elle tourne déjà
pm2 stop $APP_NAME 2>/dev/null || true
pm2 delete $APP_NAME 2>/dev/null || true

# Démarrer l'application avec PM2
echo "▶️  Démarrage de l'application avec PM2..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup systemd -u $USER --hp $HOME | sudo bash

echo "✅ Déploiement terminé avec succès !"
echo ""
echo "📊 Statut de l'application :"
pm2 status
echo ""
echo "📋 Commandes utiles :"
echo "   - Voir les logs : pm2 logs $APP_NAME"
echo "   - Redémarrer : pm2 restart $APP_NAME"
echo "   - Arrêter : pm2 stop $APP_NAME"
echo "   - Statut : pm2 status"
echo ""

