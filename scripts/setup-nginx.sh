#!/bin/bash

# Script de configuration Nginx pour Next.js
# À exécuter après setup-server.sh

set -e

DOMAIN="talosprime.fr"  # Changez si nécessaire
DOMAIN_ALT="talosprime.com"  # Domaine alternatif

echo "🌐 Configuration de Nginx pour $DOMAIN..."

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
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/talosprime /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut si elle existe
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

echo "✅ Configuration Nginx terminée !"
echo ""
echo "📋 Configuration créée : /etc/nginx/sites-available/talosprime"
echo ""
echo "🔧 Prochaine étape : Configurer SSL avec Let's Encrypt"
echo "   Commande : sudo certbot --nginx -d $DOMAIN -d $DOMAIN_ALT"







