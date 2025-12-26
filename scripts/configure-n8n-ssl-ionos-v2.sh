#!/bin/bash
# Script pour configurer SSL pour n8n.talosprimes.com avec certificat IONOS
# Version améliorée : utilise un fichier de configuration séparé
# Usage: sudo bash scripts/configure-n8n-ssl-ionos-v2.sh

set -e

echo "🔐 Configuration SSL pour n8n.talosprimes.com (IONOS)"
echo "======================================================"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo bash scripts/configure-n8n-ssl-ionos-v2.sh"
    exit 1
fi

DOMAIN="talosprimes.com"
WWW_DOMAIN="www.talosprimes.com"
N8N_DOMAIN="n8n.talosprimes.com"

# Créer un fichier de configuration séparé pour n8n (plus propre)
echo "1️⃣ Création d'un fichier de configuration séparé pour N8N..."
echo "------------------------------------------------------------"

NGINX_N8N_CONFIG="/etc/nginx/sites-available/n8n.talosprimes.com"
NGINX_N8N_ENABLED="/etc/nginx/sites-enabled/n8n.talosprimes.com"

# Si le fichier existe, créer une sauvegarde
if [ -f "$NGINX_N8N_CONFIG" ]; then
    BACKUP_FILE="${NGINX_N8N_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_N8N_CONFIG" "$BACKUP_FILE"
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
fi

# Trouver le certificat SSL en cherchant dans les configs existantes
echo ""
echo "2️⃣ Recherche du certificat SSL..."
echo "-----------------------------------"

SSL_CERT=""
SSL_KEY=""

# Chercher dans les fichiers de configuration existants
for config_file in /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*; do
    if [ -f "$config_file" ] && grep -q "ssl_certificate" "$config_file" 2>/dev/null; then
        TEMP_CERT=$(grep "ssl_certificate[^_]" "$config_file" | head -1 | awk '{print $2}' | tr -d ';' | tr -d ' ')
        TEMP_KEY=$(grep "ssl_certificate_key" "$config_file" | head -1 | awk '{print $2}' | tr -d ';' | tr -d ' ')
        
        if [ -n "$TEMP_CERT" ] && [ -f "$TEMP_CERT" ]; then
            SSL_CERT="$TEMP_CERT"
            SSL_KEY="$TEMP_KEY"
            echo "✅ Certificat trouvé dans: $config_file"
            break
        fi
    fi
done

# Si pas trouvé, chercher dans /etc/letsencrypt
if [ -z "$SSL_CERT" ] || [ ! -f "$SSL_CERT" ]; then
    for cert_dir in "/etc/letsencrypt/live/$DOMAIN" "/etc/letsencrypt/live/$WWW_DOMAIN"; do
        if [ -f "$cert_dir/fullchain.pem" ]; then
            SSL_CERT="$cert_dir/fullchain.pem"
            SSL_KEY="$cert_dir/privkey.pem"
            echo "✅ Certificat trouvé: $SSL_CERT"
            break
        fi
    done
fi

# Par défaut, essayer les emplacements communs
if [ -z "$SSL_CERT" ] || [ ! -f "$SSL_CERT" ]; then
    echo "⚠️  Certificat SSL non trouvé automatiquement"
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
        SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
    elif [ -f "/etc/letsencrypt/live/$WWW_DOMAIN/fullchain.pem" ]; then
        SSL_CERT="/etc/letsencrypt/live/$WWW_DOMAIN/fullchain.pem"
        SSL_KEY="/etc/letsencrypt/live/$WWW_DOMAIN/privkey.pem"
    else
        echo "❌ Certificat SSL non trouvé. Vérifiez la configuration IONOS."
        exit 1
    fi
fi

echo ""
echo "📋 Certificat SSL à utiliser:"
echo "   Certificat: $SSL_CERT"
echo "   Clé: $SSL_KEY"
echo ""

# Créer le fichier de configuration
echo "3️⃣ Création de la configuration Nginx pour N8N..."
echo "---------------------------------------------------"

cat > "$NGINX_N8N_CONFIG" << EOF
# Configuration SSL pour N8N (n8n.talosprimes.com)
# Utilise le certificat IONOS qui couvre automatiquement les sous-domaines
# Généré automatiquement par configure-n8n-ssl-ionos-v2.sh

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $N8N_DOMAIN;
    
    # Certificat SSL (IONOS couvre les sous-domaines)
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    
    # Configuration SSL recommandée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Autoriser l'iframe depuis www.talosprimes.com
    add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
    
    # Proxy vers N8N (localhost:5678)
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket pour N8N
    location /rest/push {
        proxy_pass http://localhost:5678/rest/push;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
}

# Redirection HTTP vers HTTPS pour n8n.talosprimes.com
server {
    listen 80;
    listen [::]:80;
    server_name $N8N_DOMAIN;
    
    return 301 https://\$server_name\$request_uri;
}
EOF

echo "✅ Fichier de configuration créé: $NGINX_N8N_CONFIG"
echo ""

# Activer la configuration (créer le lien symbolique)
echo "4️⃣ Activation de la configuration..."
echo "--------------------------------------"
if [ -L "$NGINX_N8N_ENABLED" ]; then
    echo "✅ Configuration déjà activée"
elif [ -f "$NGINX_N8N_ENABLED" ]; then
    echo "⚠️  Fichier existe déjà (pas un lien symbolique), suppression..."
    rm -f "$NGINX_N8N_ENABLED"
    ln -s "$NGINX_N8N_CONFIG" "$NGINX_N8N_ENABLED"
    echo "✅ Configuration activée"
else
    ln -s "$NGINX_N8N_CONFIG" "$NGINX_N8N_ENABLED"
    echo "✅ Configuration activée"
fi
echo ""

# Tester la configuration
echo "5️⃣ Test de la configuration Nginx..."
echo "--------------------------------------"
NGINX_TEST=$(nginx -t 2>&1)
if echo "$NGINX_TEST" | grep -q "syntax is ok"; then
    echo "✅ Configuration Nginx valide"
    if echo "$NGINX_TEST" | grep -q "test is successful"; then
        echo "✅ Test Nginx réussi"
    else
        echo "⚠️  Avertissements dans la configuration (mais syntaxe OK)"
        echo "$NGINX_TEST" | grep -v "syntax is ok"
    fi
else
    echo "❌ Erreur dans la configuration Nginx"
    echo ""
    echo "📋 Détails de l'erreur:"
    echo "$NGINX_TEST"
    echo ""
    echo "💡 Suggestions:"
    echo "   1. Vérifiez la configuration: nano $NGINX_N8N_CONFIG"
    echo "   2. Vérifiez que le certificat existe: ls -la $SSL_CERT"
    echo "   3. Testez: nginx -t"
    exit 1
fi

# Recharger Nginx
echo ""
echo "6️⃣ Rechargement de Nginx..."
echo "----------------------------"
systemctl reload nginx
echo "✅ Nginx rechargé"
echo ""

# Vérification finale
echo "7️⃣ Vérification finale..."
echo "--------------------------"
sleep 2

# Test HTTPS
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "https://$N8N_DOMAIN" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ N8N accessible via HTTPS (Code: $HTTP_CODE)"
else
    echo "⚠️  N8N répond avec le code: $HTTP_CODE"
    echo "   Vérifiez que N8N tourne: pm2 list | grep n8n"
fi

echo ""
echo "======================================================"
echo "✅ Configuration SSL terminée !"
echo "======================================================"
echo ""
echo "📋 Résumé:"
echo "   🌐 Domaine: https://$N8N_DOMAIN"
echo "   📁 Configuration: $NGINX_N8N_CONFIG"
echo "   🔗 Actif via: $NGINX_N8N_ENABLED"
echo "   🔐 Certificat: $SSL_CERT"
echo "   🔑 Clé: $SSL_KEY"
if [ -f "$BACKUP_FILE" ]; then
    echo "   💾 Sauvegarde: $BACKUP_FILE"
fi
echo ""
echo "💡 Note: IONOS couvre automatiquement les sous-domaines"
echo "   avec le certificat SSL du domaine principal."
echo ""

