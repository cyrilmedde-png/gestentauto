#!/bin/bash

# Script de configuration du serveur VPS IONOS pour Next.js
# À exécuter sur le serveur : bash setup-server.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Début de la configuration du serveur..."

# Mettre à jour le système
echo "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installer les outils de base
echo "📦 Installation des outils de base..."
sudo apt install -y curl wget git build-essential

# Installer Node.js 20.x
echo "📦 Installation de Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation de Node.js
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Installer PM2 globalement
echo "📦 Installation de PM2..."
sudo npm install -g pm2

# Installer Nginx
echo "📦 Installation de Nginx..."
sudo apt install -y nginx

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Installer Certbot pour SSL
echo "📦 Installation de Certbot (Let's Encrypt)..."
sudo apt install -y certbot python3-certbot-nginx

# Configurer le firewall de base (UFW)
echo "🔒 Configuration du firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Créer le répertoire pour l'application
echo "📁 Création du répertoire de l'application..."
sudo mkdir -p /var/www/talosprime
sudo chown -R $USER:$USER /var/www/talosprime

# Créer le répertoire pour les logs PM2
mkdir -p ~/.pm2/logs

echo ""
echo "✅ Configuration terminée avec succès !"
echo ""
echo "📋 Résumé de l'installation :"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo "   - PM2: $(pm2 --version)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo ""
echo "🔧 Prochaines étapes :"
echo "   1. Configurer les variables d'environnement"
echo "   2. Déployer l'application Next.js"
echo "   3. Configurer Nginx comme reverse proxy"
echo "   4. Configurer SSL avec Let's Encrypt"
echo ""



