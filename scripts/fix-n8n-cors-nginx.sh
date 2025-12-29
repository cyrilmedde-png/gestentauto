#!/bin/bash

# Script pour configurer Nginx pour ajouter les headers CORS sur n8n.talosprimes.com
# Cela résout les erreurs CORS pour les requêtes telemetry qui ne peuvent pas être interceptées par JavaScript

set -e

echo "=========================================="
echo "Configuration Nginx CORS pour N8N"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Trouver le fichier de configuration Nginx
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/talosprimes.com"
    "/etc/nginx/sites-available/talosprime"
    "/etc/nginx/sites-available/default"
)

NGINX_CONFIG=""
for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        NGINX_CONFIG="$config"
        info "Configuration Nginx trouvée: $config"
        break
    fi
done

if [ -z "$NGINX_CONFIG" ]; then
    error "Aucune configuration Nginx trouvée!"
    error "Cherché dans: ${NGINX_CONFIGS[*]}"
    exit 1
fi

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
info "Création d'une sauvegarde: $BACKUP_FILE"
cp "$NGINX_CONFIG" "$BACKUP_FILE"

# Vérifier si la configuration existe déjà
if grep -q "location /rest/telemetry" "$NGINX_CONFIG"; then
    warn "Configuration CORS pour /rest/telemetry existe déjà"
    read -p "Voulez-vous la remplacer? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Configuration conservée"
        exit 0
    fi
    # Supprimer l'ancienne configuration
    sed -i '/# CORS pour telemetry N8N/,/^[[:space:]]*}[[:space:]]*$/d' "$NGINX_CONFIG"
fi

# Ajouter la configuration CORS pour telemetry
info "Ajout de la configuration CORS pour /rest/telemetry..."

# Trouver où insérer la configuration (après le server block de n8n.talosprimes.com)
if grep -q "server_name.*n8n.talosprimes.com" "$NGINX_CONFIG"; then
    # Insérer après le bloc server pour n8n.talosprimes.com
    sed -i '/server_name.*n8n.talosprimes.com/,/^[[:space:]]*}[[:space:]]*$/{ 
        /^[[:space:]]*}[[:space:]]*$/a\
\
    # CORS pour telemetry N8N (requêtes faites avant chargement script interception)\
    location /rest/telemetry {\
        add_header Access-Control-Allow-Origin "https://www.talosprimes.com" always;\
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;\
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Supabase-Auth-Token" always;\
        add_header Access-Control-Allow-Credentials "true" always;\
        \
        if ($request_method = OPTIONS) {\
            add_header Access-Control-Allow-Origin "https://www.talosprimes.com" always;\
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;\
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Supabase-Auth-Token" always;\
            add_header Access-Control-Max-Age 86400;\
            add_header Content-Type "text/plain charset=UTF-8";\
            add_header Content-Length 0;\
            return 204;\
        }\
        \
        proxy_pass https://n8n.talosprimes.com;\
        proxy_http_version 1.1;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }
    }' "$NGINX_CONFIG"
else
    # Ajouter à la fin du fichier ou dans un nouveau bloc server
    cat >> "$NGINX_CONFIG" << 'EOF'

# CORS pour telemetry N8N (requêtes faites avant chargement script interception)
# Ajouté automatiquement par fix-n8n-cors-nginx.sh
server {
    listen 443 ssl http2;
    server_name n8n.talosprimes.com;

    # Certificats SSL (ajuster selon votre configuration)
    # ssl_certificate /etc/letsencrypt/live/n8n.talosprimes.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/n8n.talosprimes.com/privkey.pem;

    location /rest/telemetry {
        add_header Access-Control-Allow-Origin "https://www.talosprimes.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Supabase-Auth-Token" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        if ($request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin "https://www.talosprimes.com" always;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Supabase-Auth-Token" always;
            add_header Access-Control-Max-Age 86400;
            add_header Content-Type "text/plain charset=UTF-8";
            add_header Content-Length 0;
            return 204;
        }
        
        proxy_pass https://n8n.talosprimes.com;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    warn "Un nouveau bloc server a été ajouté. Vérifiez et ajustez la configuration SSL."
fi

# Tester la configuration Nginx
info "Test de la configuration Nginx..."
if nginx -t; then
    info "Configuration Nginx valide"
else
    error "Erreur dans la configuration Nginx!"
    error "Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# Recharger Nginx
info "Rechargement de Nginx..."
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || nginx -s reload 2>/dev/null; then
    info "Nginx rechargé avec succès"
else
    error "Impossible de recharger Nginx. Rechargez manuellement: sudo systemctl reload nginx"
fi

echo ""
info "Configuration terminée!"
echo ""
echo "La configuration CORS pour /rest/telemetry a été ajoutée."
echo "Les requêtes telemetry vers n8n.talosprimes.com devraient maintenant fonctionner."
echo ""
echo "Sauvegarde créée: $BACKUP_FILE"








