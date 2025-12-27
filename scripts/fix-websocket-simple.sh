#!/bin/bash

# Script simple pour ajouter la configuration WebSocket N8N dans Nginx
# Usage: sudo ./scripts/fix-websocket-simple.sh

set -e

echo "=========================================="
echo "Configuration WebSocket N8N - Version Simple"
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

# Vérifier root
if [ "$EUID" -ne 0 ]; then 
    error "Ce script doit être exécuté avec sudo"
    exit 1
fi

# Trouver le fichier de configuration Nginx
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/talosprimes.com"
    "/etc/nginx/sites-available/talosprime"
    "/etc/nginx/sites-available/www.talosprimes.com"
)

NGINX_CONFIG=""
for config in "${NGINX_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        NGINX_CONFIG="$config"
        info "Configuration trouvée: $config"
        break
    fi
done

if [ -z "$NGINX_CONFIG" ]; then
    error "Aucune configuration Nginx trouvée!"
    exit 1
fi

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d-%H%M%S)"
info "Création d'une sauvegarde: $BACKUP_FILE"
cp "$NGINX_CONFIG" "$BACKUP_FILE"

# Vérifier si la configuration existe déjà
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    warn "Configuration WebSocket existe déjà"
    read -p "Voulez-vous la remplacer? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Configuration conservée"
        exit 0
    fi
    # Supprimer l'ancienne configuration
    sed -i '/# Proxy WebSocket pour N8N/,/^[[:space:]]*}[[:space:]]*$/d' "$NGINX_CONFIG"
    info "Ancienne configuration supprimée"
fi

# Lire les credentials N8N
ENV_FILE="/var/www/talosprime/.env.production"
if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    info "Fichier .env trouvé"
else
    warn "Fichier .env non trouvé, utilisation des valeurs par défaut"
fi

N8N_URL="${N8N_URL:-https://n8n.talosprimes.com}"

# Générer Basic Auth si disponible
BASIC_AUTH_HEADER=""
if [ -n "$N8N_BASIC_AUTH_USER" ] && [ -n "$N8N_BASIC_AUTH_PASSWORD" ]; then
    BASIC_AUTH=$(echo -n "${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}" | base64 -w 0)
    BASIC_AUTH_HEADER="        proxy_set_header Authorization \"Basic ${BASIC_AUTH}\";"
    info "Basic Auth configuré"
fi

# Configuration WebSocket
WEBSOCKET_CONFIG="
    # Proxy WebSocket pour N8N
    location /rest/push {
        proxy_pass ${N8N_URL}/rest/push;
        proxy_http_version 1.1;
        
        # Headers WebSocket (CRITIQUE)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts pour WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
        
${BASIC_AUTH_HEADER}
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }"

# Trouver le bloc server pour www.talosprimes.com et insérer la configuration
if grep -q "server_name.*www.talosprimes.com" "$NGINX_CONFIG"; then
    info "Bloc server pour www.talosprimes.com trouvé"
    
    # Trouver la ligne du bloc server
    SERVER_LINE=$(grep -n "server_name.*www.talosprimes.com" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    
    if [ -n "$SERVER_LINE" ]; then
        # Trouver la dernière location dans ce bloc server
        # Chercher toutes les locations après cette ligne jusqu'à la prochaine ligne server ou la fin
        LAST_LOCATION_LINE=""
        IN_SERVER_BLOCK=false
        BRACE_COUNT=0
        
        while IFS= read -r line; do
            LINE_NUM=$((LINE_NUM + 1))
            if [ "$LINE_NUM" -ge "$SERVER_LINE" ]; then
                if echo "$line" | grep -q "server_name.*www.talosprimes.com"; then
                    IN_SERVER_BLOCK=true
                    BRACE_COUNT=0
                fi
                
                if [ "$IN_SERVER_BLOCK" = true ]; then
                    # Compter les accolades pour savoir quand on sort du bloc
                    OPEN_BRACES=$(echo "$line" | grep -o '{' | wc -l)
                    CLOSE_BRACES=$(echo "$line" | grep -o '}' | wc -l)
                    BRACE_COUNT=$((BRACE_COUNT + OPEN_BRACES - CLOSE_BRACES))
                    
                    # Si on trouve une location, la mémoriser
                    if echo "$line" | grep -q "location "; then
                        LAST_LOCATION_LINE=$LINE_NUM
                    fi
                    
                    # Si on sort du bloc server, arrêter
                    if [ "$BRACE_COUNT" -le 0 ] && [ "$LINE_NUM" -gt "$SERVER_LINE" ]; then
                        break
                    fi
                fi
            fi
        done < "$NGINX_CONFIG"
        
        # Insérer après la dernière location ou avant la fermeture du bloc
        if [ -n "$LAST_LOCATION_LINE" ]; then
            info "Insertion après la dernière location (ligne $LAST_LOCATION_LINE)"
            sed -i "${LAST_LOCATION_LINE}a\\${WEBSOCKET_CONFIG}" "$NGINX_CONFIG"
        else
            # Trouver la ligne de fermeture du bloc server
            CLOSING_BRACE=$(awk -v start="$SERVER_LINE" '
                NR >= start {
                    if (/{/) brace_count++
                    if (/}/) {
                        brace_count--
                        if (brace_count == 0 && NR > start) {
                            print NR
                            exit
                        }
                    }
                }
            ' "$NGINX_CONFIG")
            
            if [ -n "$CLOSING_BRACE" ]; then
                info "Insertion avant la fermeture du bloc server (ligne $CLOSING_BRACE)"
                sed -i "$((CLOSING_BRACE - 1))a\\${WEBSOCKET_CONFIG}" "$NGINX_CONFIG"
            else
                error "Impossible de trouver la fermeture du bloc server"
                exit 1
            fi
        fi
    else
        error "Impossible de trouver le bloc server"
        exit 1
    fi
else
    warn "Bloc server pour www.talosprimes.com non trouvé"
    warn "Ajout à la fin du fichier (vérifiez manuellement)"
    echo "$WEBSOCKET_CONFIG" >> "$NGINX_CONFIG"
fi

# Tester la configuration
info "Test de la configuration Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    info "✓ Configuration Nginx valide"
else
    error "✗ Erreur dans la configuration Nginx"
    error "Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

# Recharger Nginx
info "Rechargement de Nginx..."
if systemctl reload nginx; then
    info "✓ Nginx rechargé avec succès"
else
    error "✗ Erreur lors du rechargement de Nginx"
    exit 1
fi

echo ""
info "Configuration WebSocket ajoutée avec succès!"
echo ""
info "Vérifiez avec: sudo ./scripts/verifier-websocket-nginx.sh"
echo ""




