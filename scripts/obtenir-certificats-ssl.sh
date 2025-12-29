#!/bin/bash
# Script pour obtenir les certificats SSL avec Certbot
# Usage: sudo ./scripts/obtenir-certificats-ssl.sh

echo "🔐 Obtention des certificats SSL"
echo "================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo ./scripts/obtenir-certificats-ssl.sh"
    exit 1
fi

# Variables
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
DOMAIN_NO_WWW="talosprimes.com"
DOMAIN="www.talosprimes.com"
N8N_DOMAIN="n8n.talosprimes.com"

echo "1️⃣  Correction de la configuration Nginx..."
echo "----------------------------------------"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Fichier de configuration Nginx non trouvé: $NGINX_CONFIG"
    exit 1
fi

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Vérifier si les certificats existent déjà
if [ -f "/etc/letsencrypt/live/$DOMAIN_NO_WWW/fullchain.pem" ]; then
    echo "✅ Certificats SSL existent déjà pour $DOMAIN_NO_WWW"
    echo "   Vérification de la configuration..."
    if nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo "✅ Configuration Nginx valide avec certificats existants"
        exit 0
    else
        echo "⚠️  Configuration Nginx invalide malgré certificats existants"
        echo "   Correction nécessaire..."
    fi
fi

# Créer une configuration temporaire en HTTP uniquement pour Certbot
echo "📝 Création d'une configuration temporaire (HTTP uniquement)..."
cat > "$NGINX_CONFIG" << EOF
# Configuration HTTP temporaire pour Certbot
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NO_WWW $DOMAIN;
    
    # Pour Certbot - ne pas rediriger vers HTTPS
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
    
    # WebSocket
    location /rest/push {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Pour Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}

# Configuration HTTP pour N8N
server {
    listen 80;
    listen [::]:80;
    server_name $N8N_DOMAIN;
    
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Pour Certbot validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
}
EOF

# Créer le répertoire pour Certbot
mkdir -p /var/www/html/.well-known/acme-challenge
chmod -R 755 /var/www/html

# Tester la configuration
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
else
    echo "❌ Erreur dans la configuration Nginx"
    nginx -t
    exit 1
fi

echo ""
echo "2️⃣  Obtention des certificats SSL..."
echo "-----------------------------------"

# Demander l'email
read -p "Entrez votre email pour les notifications Let's Encrypt: " CERTBOT_EMAIL
if [ -z "$CERTBOT_EMAIL" ]; then
    CERTBOT_EMAIL="admin@talosprimes.com"
fi

echo ""
echo "🔐 Obtention du certificat pour $DOMAIN_NO_WWW et $DOMAIN..."
certbot --nginx -d "$DOMAIN_NO_WWW" -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    --redirect || {
    echo "❌ Erreur lors de l'obtention des certificats SSL"
    echo "   Vérifiez que:"
    echo "   1. Les DNS pointent vers ce serveur"
    echo "   2. Les ports 80 et 443 sont ouverts"
    echo "   3. Le domaine est accessible depuis Internet"
    exit 1
}

echo ""
echo "🔐 Obtention du certificat pour $N8N_DOMAIN..."
certbot --nginx -d "$N8N_DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$CERTBOT_EMAIL" \
    --redirect || {
    echo "⚠️  Erreur lors de l'obtention des certificats SSL pour N8N"
    echo "   Vous pourrez réessayer plus tard"
}

echo ""
echo "3️⃣  Vérification finale..."
echo "-------------------------"
if nginx -t; then
    echo "✅ Configuration Nginx valide avec certificats SSL"
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur dans la configuration Nginx après Certbot"
    nginx -t
    exit 1
fi

echo ""
echo "4️⃣  Vérification des certificats..."
echo "----------------------------------"
if [ -f "/etc/letsencrypt/live/$DOMAIN_NO_WWW/fullchain.pem" ]; then
    echo "✅ Certificat SSL pour $DOMAIN_NO_WWW: OK"
    ls -lh "/etc/letsencrypt/live/$DOMAIN_NO_WWW/fullchain.pem"
else
    echo "❌ Certificat SSL pour $DOMAIN_NO_WWW: MANQUANT"
fi

if [ -f "/etc/letsencrypt/live/$N8N_DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificat SSL pour $N8N_DOMAIN: OK"
    ls -lh "/etc/letsencrypt/live/$N8N_DOMAIN/fullchain.pem"
else
    echo "⚠️  Certificat SSL pour $N8N_DOMAIN: MANQUANT"
fi

echo ""
echo "================================="
echo "✅ Certificats SSL configurés !"
echo "================================="
echo ""
echo "📋 URLs:"
echo "  🌐 Application: https://$DOMAIN"
echo "  🔧 N8N: https://$N8N_DOMAIN"
echo ""
echo "💡 Les certificats seront renouvelés automatiquement par Certbot"
echo ""








