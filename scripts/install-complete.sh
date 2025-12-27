#!/bin/bash

# Script complet d'installation pour TalosPrime sur IONOS VPS
# À exécuter sur le serveur : bash install-complete.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 =========================================="
echo "   Installation complète TalosPrime"
echo "🚀 =========================================="
echo ""

# Variables de configuration
DOMAIN="talosprime.fr"
DOMAIN_ALT="talosprime.com"
APP_DIR="/var/www/talosprime"
APP_NAME="talosprime"
USER=$(whoami)

# 1. Mise à jour du système
echo "📦 [1/8] Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# 2. Installation des outils de base
echo "📦 [2/8] Installation des outils de base..."
sudo apt install -y curl wget git build-essential ufw

# 3. Installation de Node.js 20.x
echo "📦 [3/8] Installation de Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "   ✅ Node.js déjà installé : $(node --version)"
fi

echo "   ✅ Node.js version: $(node --version)"
echo "   ✅ npm version: $(npm --version)"

# 4. Installation de PM2
echo "📦 [4/8] Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "   ✅ PM2 déjà installé : $(pm2 --version)"
fi

# 5. Installation de Nginx
echo "📦 [5/8] Installation de Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo "   ✅ Nginx déjà installé"
    sudo systemctl start nginx || true
fi

# 6. Installation de Certbot
echo "📦 [6/8] Installation de Certbot (Let's Encrypt)..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
else
    echo "   ✅ Certbot déjà installé"
fi

# 7. Configuration du firewall
echo "🔒 [7/8] Configuration du firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
echo "   ✅ Firewall configuré"

# 8. Configuration de Nginx
echo "🌐 [8/8] Configuration de Nginx..."

# Créer la configuration Nginx
sudo tee /etc/nginx/sites-available/talosprime > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN $DOMAIN_ALT www.$DOMAIN www.$DOMAIN_ALT;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/talosprime /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut si elle existe
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Créer le répertoire de l'application
echo "📁 Création du répertoire de l'application..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Créer le fichier .env.production (vide, à remplir après)
touch $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production

echo ""
echo "✅ =========================================="
echo "   Installation terminée avec succès !"
echo "✅ =========================================="
echo ""
echo "📋 Résumé de l'installation :"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo "   - PM2: $(pm2 --version)"
echo "   - Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"
echo ""
echo "📁 Répertoire de l'application : $APP_DIR"
echo ""
echo "🔧 Prochaines étapes :"
echo ""
echo "1. Configurer les variables d'environnement :"
echo "   nano $APP_DIR/.env.production"
echo ""
echo "2. Ajouter les variables suivantes :"
echo "   NEXT_PUBLIC_SUPABASE_URL=..."
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
echo "   SUPABASE_SERVICE_ROLE_KEY=..."
echo "   RESEND_API_KEY=re_..."
echo "   RESEND_FROM_EMAIL=noreply@talosprime.fr"
echo "   RESEND_FROM_NAME=TalosPrime"
echo "   TWILIO_ACCOUNT_SID=AC..."
echo "   TWILIO_AUTH_TOKEN=..."
echo "   TWILIO_PHONE_NUMBER=+336..."
echo "   NODE_ENV=production"
echo "   PORT=3000"
echo ""
echo "3. Déployer votre code dans $APP_DIR"
echo ""
echo "4. Build et démarrer l'application :"
echo "   cd $APP_DIR"
echo "   npm install --production"
echo "   npm run build"
echo "   pm2 start npm --name \"$APP_NAME\" -- start"
echo "   pm2 save"
echo "   pm2 startup systemd -u $USER --hp $HOME | sudo bash"
echo ""
echo "5. Configurer SSL (après avoir pointé les domaines vers cette IP) :"
echo "   sudo certbot --nginx -d $DOMAIN -d $DOMAIN_ALT -d www.$DOMAIN -d www.$DOMAIN_ALT"
echo ""
echo "✅ Tout est prêt !"
echo ""






