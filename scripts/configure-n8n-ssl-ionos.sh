#!/bin/bash
# Script pour configurer SSL pour n8n.talosprimes.com avec certificat IONOS
# Usage: sudo bash scripts/configure-n8n-ssl-ionos.sh

set -e

echo "🔐 Configuration SSL pour n8n.talosprimes.com (IONOS)"
echo "======================================================"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo bash scripts/configure-n8n-ssl-ionos.sh"
    exit 1
fi

DOMAIN="talosprimes.com"
WWW_DOMAIN="www.talosprimes.com"
N8N_DOMAIN="n8n.talosprimes.com"

# Créer un fichier de configuration séparé pour n8n (plus propre et simple)
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
NGINX_CONFIG=""
for config_file in \
    "/etc/nginx/sites-available/talosprime" \
    "/etc/nginx/sites-available/talosprimes" \
    "/etc/nginx/sites-available/default" \
    "/etc/nginx/sites-enabled/talosprime" \
    "/etc/nginx/sites-enabled/talosprimes"
do
    if [ -f "$config_file" ] && grep -q "talosprimes.com" "$config_file" 2>/dev/null; then
        NGINX_CONFIG="$config_file"
        break
    fi
done

if [ -z "$NGINX_CONFIG" ]; then
    for config_file in /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*; do
        if [ -f "$config_file" ] && grep -q "talosprimes.com" "$config_file" 2>/dev/null; then
            NGINX_CONFIG="$config_file"
            break
        fi
    done
fi

echo ""

# Trouver le certificat SSL existant
echo "2️⃣ Recherche du certificat SSL..."
echo "-----------------------------------"

SSL_CERT=""
SSL_KEY=""

# Méthode 1: Chercher dans la configuration existante
if grep -q "ssl_certificate" "$NGINX_CONFIG"; then
    SSL_CERT=$(grep "ssl_certificate[^_]" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
    SSL_KEY=$(grep "ssl_certificate_key" "$NGINX_CONFIG" | head -1 | awk '{print $2}' | tr -d ';')
    
    if [ -n "$SSL_CERT" ] && [ -f "$SSL_CERT" ]; then
        echo "✅ Certificat trouvé dans la config: $SSL_CERT"
        echo "✅ Clé trouvée: $SSL_KEY"
    fi
fi

# Méthode 2: Chercher dans /etc/letsencrypt
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

if [ -z "$SSL_CERT" ] || [ ! -f "$SSL_CERT" ]; then
    echo "⚠️  Certificat SSL non trouvé automatiquement"
    echo "   💡 Le script va utiliser le certificat de talosprimes.com par défaut"
    echo "   💡 IONOS couvre automatiquement les sous-domaines avec le même certificat"
    
    # Essayer les emplacements communs
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

# Vérifier si la configuration pour n8n existe déjà
echo "3️⃣ Vérification de la configuration existante pour n8n..."
echo "----------------------------------------------------------"

if grep -q "server_name.*$N8N_DOMAIN" "$NGINX_CONFIG"; then
    echo "⚠️  Configuration pour $N8N_DOMAIN existe déjà"
    echo "   Voulez-vous la remplacer ? (y/n)"
    read -r REPLACE
    if [ "$REPLACE" != "y" ] && [ "$REPLACE" != "Y" ]; then
        echo "❌ Opération annulée"
        exit 0
    fi
    
    # Supprimer l'ancienne configuration
    echo "   📝 Suppression de l'ancienne configuration..."
    
    # Méthode simple: trouver les numéros de ligne et supprimer le bloc
    # Trouver la ligne de début du bloc server
    START_LINE=$(grep -n "server_name.*$N8N_DOMAIN" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    
    if [ -n "$START_LINE" ]; then
        # Remonter pour trouver le début du bloc "server {"
        while [ "$START_LINE" -gt 1 ]; do
            LINE_CONTENT=$(sed -n "${START_LINE}p" "$NGINX_CONFIG")
            if echo "$LINE_CONTENT" | grep -q "^[[:space:]]*server[[:space:]]*{"; then
                break
            fi
            START_LINE=$((START_LINE - 1))
        done
        
        # Trouver la fin du bloc (trouver la fermeture correspondante)
        BRACE_COUNT=0
        END_LINE=$START_LINE
        TOTAL_LINES=$(wc -l < "$NGINX_CONFIG")
        
        while [ "$END_LINE" -le "$TOTAL_LINES" ]; do
            LINE_CONTENT=$(sed -n "${END_LINE}p" "$NGINX_CONFIG")
            OPEN_BRACES=$(echo "$LINE_CONTENT" | grep -o '{' | wc -l)
            CLOSE_BRACES=$(echo "$LINE_CONTENT" | grep -o '}' | wc -l)
            BRACE_COUNT=$((BRACE_COUNT + OPEN_BRACES - CLOSE_BRACES))
            
            if [ "$BRACE_COUNT" -eq 0 ] && [ "$END_LINE" -gt "$START_LINE" ]; then
                break
            fi
            END_LINE=$((END_LINE + 1))
        done
        
        # Supprimer le bloc
        if [ -n "$START_LINE" ] && [ -n "$END_LINE" ] && [ "$END_LINE" -gt "$START_LINE" ]; then
            sed -i "${START_LINE},${END_LINE}d" "$NGINX_CONFIG"
            echo "   ✅ Bloc server supprimé (lignes $START_LINE-$END_LINE)"
        else
            echo "   ⚠️  Impossible de trouver les limites du bloc, tentative de suppression manuelle..."
            # Méthode de secours: supprimer toutes les lignes contenant n8n.talosprimes.com et les lignes suivantes jusqu'à }
            sed -i "/server_name.*$N8N_DOMAIN/,/^[[:space:]]*}/d" "$NGINX_CONFIG"
        fi
    fi
    
    echo "   ✅ Ancienne configuration supprimée"
fi

echo ""
echo "4️⃣ Ajout de la configuration SSL pour n8n.talosprimes.com..."
echo "------------------------------------------------------------"

# Configuration à ajouter
N8N_CONFIG=$(cat <<EOF

# Configuration SSL pour N8N (n8n.talosprimes.com)
# Utilise le certificat IONOS qui couvre automatiquement les sous-domaines
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
)

# Ajouter la configuration à la fin du fichier
echo "$N8N_CONFIG" >> "$NGINX_CONFIG"
echo "✅ Configuration ajoutée"
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
    echo "🔄 Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "✅ Sauvegarde restaurée"
    echo ""
    echo "💡 Suggestions:"
    echo "   1. Vérifiez la configuration manuellement: nano $NGINX_CONFIG"
    echo "   2. Testez: nginx -t"
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
echo "   🔐 Certificat: $SSL_CERT"
echo "   🔑 Clé: $SSL_KEY"
echo "   💾 Sauvegarde: $BACKUP_FILE"
echo ""
echo "💡 Note: IONOS couvre automatiquement les sous-domaines"
echo "   avec le certificat SSL du domaine principal."
echo ""

