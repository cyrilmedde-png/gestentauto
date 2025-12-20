#!/bin/bash

# Script de déploiement automatique
# Usage: ./deploy.sh ou bash deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement..."

# Aller dans le répertoire du projet
cd /var/www/talosprime || {
    echo "❌ Erreur: Impossible d'accéder au répertoire /var/www/talosprime"
    exit 1
}

echo "📦 Récupération des dernières modifications depuis GitHub..."
git pull origin main || {
    echo "❌ Erreur lors du git pull"
    exit 1
}

echo "🔨 Construction de l'application..."
npm run build || {
    echo "❌ Erreur lors du build"
    exit 1
}

echo "🔄 Redémarrage de l'application PM2..."
pm2 restart talosprime || {
    echo "❌ Erreur lors du redémarrage PM2"
    exit 1
}

echo "✅ Déploiement terminé avec succès!"
echo "📊 Statut PM2:"
pm2 status
