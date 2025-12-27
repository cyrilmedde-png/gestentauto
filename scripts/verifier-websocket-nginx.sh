#!/bin/bash

# Script pour vérifier et corriger la configuration WebSocket Nginx pour N8N

set -e

echo "=========================================="
echo "Vérification Configuration WebSocket Nginx"
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

# Vérifier que le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
    error "Ce script doit être exécuté avec sudo"
    exit 1
fi

# Trouver le fichier de configuration Nginx
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/talosprimes.com"
    "/etc/nginx/sites-available/talosprime"
    "/etc/nginx/sites-available/www.talosprimes.com"
    "/etc/nginx/sites-available/default"
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

# Vérifier la configuration WebSocket
echo ""
echo "Vérification de la configuration WebSocket..."
echo ""

# Chercher le bloc server pour www.talosprimes.com
if grep -q "server_name.*www.talosprimes.com" "$NGINX_CONFIG"; then
    info "Bloc server pour www.talosprimes.com trouvé"
    
    # Vérifier si location /rest/push existe
    if grep -q "location /rest/push" "$NGINX_CONFIG"; then
        info "Configuration location /rest/push trouvée"
        
        # Afficher la configuration
        echo ""
        echo "Configuration actuelle:"
        grep -A 20 "location /rest/push" "$NGINX_CONFIG" | head -25
        echo ""
        
        # Vérifier les éléments critiques
        if grep -A 20 "location /rest/push" "$NGINX_CONFIG" | grep -q "proxy_set_header Upgrade"; then
            info "✓ Header Upgrade configuré"
        else
            error "✗ Header Upgrade MANQUANT"
        fi
        
        if grep -A 20 "location /rest/push" "$NGINX_CONFIG" | grep -q "proxy_set_header Connection"; then
            info "✓ Header Connection configuré"
        else
            error "✗ Header Connection MANQUANT"
        fi
        
        if grep -A 20 "location /rest/push" "$NGINX_CONFIG" | grep -q "proxy_pass.*n8n"; then
            info "✓ proxy_pass vers N8N configuré"
        else
            error "✗ proxy_pass vers N8N MANQUANT"
        fi
        
    else
        error "Configuration location /rest/push NON trouvée"
        warn "Exécutez: sudo ./scripts/setup-websocket-proxy.sh"
    fi
else
    error "Bloc server pour www.talosprimes.com NON trouvé"
    warn "La configuration doit être dans le bloc server pour www.talosprimes.com"
fi

# Vérifier si la configuration est dans le bon bloc server
echo ""
echo "Vérification du contexte de la configuration..."
if grep -B 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "server_name.*www.talosprimes.com"; then
    info "✓ Configuration est dans le bon bloc server"
else
    warn "⚠ Configuration peut être dans le mauvais bloc server"
    warn "La configuration doit être dans le bloc server pour www.talosprimes.com"
fi

# Tester la configuration Nginx
echo ""
echo "Test de la configuration Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    info "✓ Configuration Nginx valide"
else
    error "✗ Erreur dans la configuration Nginx"
    nginx -t
    exit 1
fi

# Vérifier si Nginx est rechargé
echo ""
echo "Vérification du statut Nginx..."
if systemctl is-active --quiet nginx; then
    info "✓ Nginx est actif"
    
    # Vérifier la date de rechargement
    NGINX_RELOAD_TIME=$(systemctl show nginx --property=ActiveEnterTimestamp --value 2>/dev/null || echo "unknown")
    info "Nginx actif depuis: $NGINX_RELOAD_TIME"
    
    echo ""
    warn "Si vous avez modifié la configuration, rechargez Nginx:"
    warn "  sudo systemctl reload nginx"
else
    error "✗ Nginx n'est PAS actif"
fi

# Résumé
echo ""
echo "=========================================="
echo "Résumé"
echo "=========================================="
echo ""
echo "Si la configuration WebSocket est correcte mais ne fonctionne toujours pas:"
echo "1. Vérifiez que Nginx est bien rechargé: sudo systemctl reload nginx"
echo "2. Vérifiez les logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "3. Vérifiez que N8N écoute bien sur le port 5678"
echo "4. Testez la connexion WebSocket: wscat -c wss://www.talosprimes.com/rest/push"
echo ""




