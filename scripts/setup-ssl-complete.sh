#!/bin/bash

# Script d'installation des certificats SSL pour TalosPrime
# Configuration avec certificats séparés pour chaque domaine
# Usage: sudo bash setup-ssl-complete.sh

set -e  # Arrêter en cas d'erreur

DOMAIN1="talosprime.fr"
DOMAIN1_WWW="www.talosprime.fr"
CERT1_FILE="/etc/nginx/ssl/talosprime/talosprime.fr.certificat.cer"
KEY1_FILE="/etc/nginx/ssl/talosprime/talosprime.fr.certificat.key"

DOMAIN2="talosprimes.com"
DOMAIN2_WWW="www.talosprimes.com"
CERT2_FILE="/etc/nginx/ssl/talosprime/talosprimes.com.certificat.cer"
KEY2_FILE="/etc/nginx/ssl/talosprime/talosprimes.com.certificat.key"

SSL_DIR="/etc/nginx/ssl/talosprime"
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

echo "🔒 Installation des certificats SSL pour $DOMAIN1 et $DOMAIN2..."

# Vérifier que le script est exécuté en tant que root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Erreur: Ce script doit être exécuté avec sudo"
    echo "   Usage: sudo bash setup-ssl-complete.sh"
    exit 1
fi

# Vérifier que tous les fichiers existent
echo ""
echo "📋 Vérification des fichiers de certificat..."

if [ ! -f "$CERT1_FILE" ]; then
    echo "❌ Erreur: Certificat pour $DOMAIN1 non trouvé: $CERT1_FILE"
    exit 1
fi

if [ ! -f "$KEY1_FILE" ]; then
    echo "❌ Erreur: Clé pour $DOMAIN1 non trouvée: $KEY1_FILE"
    exit 1
fi

if [ ! -f "$CERT2_FILE" ]; then
    echo "❌ Erreur: Certificat pour $DOMAIN2 non trouvé: $CERT2_FILE"
    exit 1
fi

if [ ! -f "$KEY2_FILE" ]; then
    echo "❌ Erreur: Clé pour $DOMAIN2 non trouvée: $KEY2_FILE"
    exit 1
fi

echo "✅ Tous les fichiers trouvés:"
echo "   $DOMAIN1: $CERT1_FILE et $KEY1_FILE"
echo "   $DOMAIN2: $CERT2_FILE et $KEY2_FILE"

# Fixer les permissions de sécurité
echo ""
echo "🔐 Configuration des permissions..."
chmod 644 "$CERT1_FILE" "$CERT2_FILE"
chmod 600 "$KEY1_FILE" "$KEY2_FILE"
chown root:root "$CERT1_FILE" "$KEY1_FILE" "$CERT2_FILE" "$KEY2_FILE"
echo "✅ Permissions configurées"

# Sauvegarder l'ancienne configuration
echo ""
echo "💾 Sauvegarde de la configuration Nginx actuelle..."
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Configuration sauvegardée"
fi

# Créer la configuration Nginx
echo ""
echo "⚙️  Création de la configuration Nginx..."

cat > "$NGINX_CONFIG" <<EOF
# Redirection HTTP vers HTTPS pour talosprime.fr
server {
    listen 80;
    server_name $DOMAIN1 $DOMAIN1_WWW;
    return 301 https://\$server_name\$request_uri;
}

# Redirection HTTP vers HTTPS pour talosprimes.com
server {
    listen 80;
    server_name $DOMAIN2 $DOMAIN2_WWW;
    return 301 https://\$server_name\$request_uri;
}

# Configuration HTTPS pour talosprime.fr
server {
    listen 443 ssl http2;
    server_name $DOMAIN1 $DOMAIN1_WWW;

    # Certificats SSL pour talosprime.fr
    ssl_certificate $CERT1_FILE;
    ssl_certificate_key $KEY1_FILE;

    # Paramètres SSL recommandés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy vers l'application Next.js
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

# Configuration HTTPS pour talosprimes.com
server {
    listen 443 ssl http2;
    server_name $DOMAIN2 $DOMAIN2_WWW;

    # Certificats SSL pour talosprimes.com
    ssl_certificate $CERT2_FILE;
    ssl_certificate_key $KEY2_FILE;

    # Paramètres SSL recommandés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy vers l'application Next.js
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

echo "✅ Configuration Nginx créée"

# Activer le site
echo ""
echo "🔗 Activation du site Nginx..."
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/talosprime
rm -f /etc/nginx/sites-enabled/default
echo "✅ Site activé"

# Tester la configuration
echo ""
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "   Vérifiez le fichier: $NGINX_CONFIG"
    exit 1
fi

# Recharger Nginx
echo ""
echo "🔄 Rechargement de Nginx..."
systemctl reload nginx

# Vérifier le statut
echo ""
echo "📊 Statut de Nginx:"
systemctl status nginx --no-pager -l | head -10

# Vérifier le port 443
echo ""
echo "🔍 Vérification du port 443..."
if netstat -tlnp 2>/dev/null | grep -q ":443 " || ss -tlnp 2>/dev/null | grep -q ":443 "; then
    echo "✅ Port 443 actif"
else
    echo "⚠️  Port 443 non détecté (peut être normal si Nginx vient de démarrer)"
fi

echo ""
echo "✅ Installation des certificats SSL terminée !"
echo ""
echo "📋 Résumé:"
echo "   - Certificats installés dans: $SSL_DIR"
echo "   - Configuration Nginx: $NGINX_CONFIG"
echo "   - $DOMAIN1 utilise: talosprime.fr.certificat.cer"
echo "   - $DOMAIN2 utilise: talosprimes.com.certificat.cer"
echo ""
echo "🧪 Testez vos sites:"
echo "   https://$DOMAIN1"
echo "   https://$DOMAIN1_WWW"
echo "   https://$DOMAIN2"
echo "   https://$DOMAIN2_WWW"
echo ""
echo "📝 Note: Si vous avez des problèmes, la configuration de sauvegarde est dans:"
echo "   $NGINX_CONFIG.backup.*"







