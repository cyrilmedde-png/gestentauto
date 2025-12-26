#!/bin/bash

# Script pour ajouter manuellement la configuration WebSocket
# Affiche la configuration à ajouter et guide l'utilisateur

set -e

echo "=========================================="
echo "Ajout Configuration WebSocket N8N"
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

# Lire les credentials N8N
ENV_FILE="/var/www/talosprime/.env.production"
N8N_URL="https://n8n.talosprimes.com"
BASIC_AUTH_LINE=""

if [ -f "$ENV_FILE" ]; then
    source "$ENV_FILE"
    if [ -n "$N8N_URL" ]; then
        N8N_URL="$N8N_URL"
    fi
    if [ -n "$N8N_BASIC_AUTH_USER" ] && [ -n "$N8N_BASIC_AUTH_PASSWORD" ]; then
        BASIC_AUTH=$(echo -n "${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}" | base64 -w 0)
        BASIC_AUTH_LINE="        proxy_set_header Authorization \"Basic ${BASIC_AUTH}\";"
    fi
fi

echo ""
info "Configuration à ajouter dans: $NGINX_CONFIG"
echo ""
echo "Ajoutez ce bloc dans le bloc 'server' pour 'www.talosprimes.com',"
echo "après une autre 'location' ou avant la fermeture du bloc 'server':"
echo ""
echo "----------------------------------------"
cat << EOF
    # Proxy WebSocket pour N8N
    location /rest/push {
        proxy_pass ${N8N_URL}/rest/push;
        proxy_http_version 1.1;
        
        # Headers WebSocket (CRITIQUE)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts pour WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
${BASIC_AUTH_LINE}
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }
EOF
echo "----------------------------------------"
echo ""

# Proposer d'ajouter automatiquement
read -p "Voulez-vous que je l'ajoute automatiquement? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Créer un fichier temporaire avec la config
    TEMP_CONFIG=$(mktemp)
    cat > "$TEMP_CONFIG" << EOF
    # Proxy WebSocket pour N8N
    location /rest/push {
        proxy_pass ${N8N_URL}/rest/push;
        proxy_http_version 1.1;
        
        # Headers WebSocket (CRITIQUE)
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts pour WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60;
${BASIC_AUTH_LINE}
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }
EOF
    
    # Chercher location / et insérer après
    if grep -q "location / {" "$NGINX_CONFIG"; then
        info "Insertion après 'location / {'"
        sed -i "/location \/ {/r $TEMP_CONFIG" "$NGINX_CONFIG"
    else
        # Chercher la fermeture du bloc server pour www.talosprimes.com
        if grep -q "server_name.*www.talosprimes.com" "$NGINX_CONFIG"; then
            info "Insertion avant la fermeture du bloc server"
            # Trouver la dernière } du bloc server
            SERVER_LINE=$(grep -n "server_name.*www.talosprimes.com" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
            # Compter les accolades pour trouver la fermeture
            awk -v start="$SERVER_LINE" -v config_file="$TEMP_CONFIG" '
                NR >= start {
                    if (/{/) brace++
                    if (/}/) {
                        brace--
                        if (brace == 0 && NR > start) {
                            # Insérer avant cette ligne
                            while ((getline line < config_file) > 0) {
                                print line
                            }
                            close(config_file)
                            print
                            exit
                        }
                    }
                    print
                }
                NR < start { print }
            ' "$NGINX_CONFIG" > "${NGINX_CONFIG}.new" && mv "${NGINX_CONFIG}.new" "$NGINX_CONFIG"
        else
            warn "Bloc server pour www.talosprimes.com non trouvé"
            warn "Ajout à la fin du fichier"
            cat "$TEMP_CONFIG" >> "$NGINX_CONFIG"
        fi
    fi
    
    rm -f "$TEMP_CONFIG"
    
    # Tester la configuration
    info "Test de la configuration Nginx..."
    if nginx -t 2>&1 | grep -q "successful"; then
        info "✓ Configuration Nginx valide"
        
        read -p "Voulez-vous recharger Nginx maintenant? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if systemctl reload nginx; then
                info "✓ Nginx rechargé avec succès"
            else
                error "✗ Erreur lors du rechargement de Nginx"
                exit 1
            fi
        else
            warn "N'oubliez pas de recharger Nginx: sudo systemctl reload nginx"
        fi
    else
        error "✗ Erreur dans la configuration Nginx"
        nginx -t
        exit 1
    fi
else
    info "Ajoutez la configuration manuellement dans: $NGINX_CONFIG"
    info "Puis testez avec: sudo nginx -t"
    info "Et rechargez avec: sudo systemctl reload nginx"
fi

echo ""
info "Vérifiez avec: sudo ./scripts/verifier-websocket-nginx.sh"
echo ""


