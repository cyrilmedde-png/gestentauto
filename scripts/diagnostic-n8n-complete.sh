#!/bin/bash

# Script de diagnostic complet pour N8N
# Vérifie tous les aspects de la configuration N8N

set -e

echo "=========================================="
echo "Diagnostic Complet N8N"
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

# 1. Vérifier N8N dans PM2
echo "1. Vérification N8N dans PM2..."
if pm2 list | grep -q "n8n"; then
    info "N8N est présent dans PM2"
    pm2 describe n8n | grep -E "status|pid|port" || true
else
    error "N8N n'est PAS présent dans PM2"
fi
echo ""

# 2. Vérifier le port 5678
echo "2. Vérification du port 5678..."
if lsof -i :5678 2>/dev/null | grep -q LISTEN; then
    info "Port 5678 est en écoute"
    lsof -i :5678 | head -2
else
    error "Port 5678 n'est PAS en écoute"
fi
echo ""

# 3. Vérifier la configuration Nginx pour WebSocket
echo "3. Vérification configuration Nginx WebSocket..."
NGINX_CONFIGS=(
    "/etc/nginx/sites-available/talosprimes.com"
    "/etc/nginx/sites-available/talosprime"
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

if [ -n "$NGINX_CONFIG" ]; then
    if grep -q "location /rest/push" "$NGINX_CONFIG"; then
        info "Configuration WebSocket /rest/push trouvée"
        grep -A 10 "location /rest/push" "$NGINX_CONFIG" | head -15
    else
        error "Configuration WebSocket /rest/push NON trouvée"
        warn "Exécutez: sudo ./scripts/setup-websocket-proxy.sh"
    fi
    
    if grep -q "location /rest/telemetry" "$NGINX_CONFIG"; then
        info "Configuration CORS /rest/telemetry trouvée"
    else
        warn "Configuration CORS /rest/telemetry NON trouvée"
        warn "Exécutez: sudo ./scripts/fix-n8n-cors-nginx.sh"
    fi
else
    error "Aucune configuration Nginx trouvée"
fi
echo ""

# 4. Tester la connexion N8N directe
echo "4. Test connexion N8N directe..."
N8N_URL="${N8N_URL:-https://n8n.talosprimes.com}"
if curl -s -o /dev/null -w "%{http_code}" "$N8N_URL/rest/login" | grep -qE "200|401|403"; then
    info "N8N répond sur $N8N_URL"
else
    error "N8N ne répond PAS sur $N8N_URL"
fi
echo ""

# 5. Tester le proxy Next.js
echo "5. Test proxy Next.js..."
PROXY_URL="http://localhost:3000/api/platform/n8n/proxy/rest/login"
if curl -s -o /dev/null -w "%{http_code}" "$PROXY_URL" | grep -qE "200|401|403"; then
    info "Proxy Next.js répond sur $PROXY_URL"
else
    error "Proxy Next.js ne répond PAS sur $PROXY_URL"
fi
echo ""

# 6. Tester la route /rest/workflows
echo "6. Test route /rest/workflows..."
WORKFLOWS_URL="http://localhost:3000/rest/workflows"
if curl -s -o /dev/null -w "%{http_code}" "$WORKFLOWS_URL" | grep -qE "200|401|403"; then
    info "Route /rest/workflows répond"
else
    error "Route /rest/workflows ne répond PAS (code: $(curl -s -o /dev/null -w "%{http_code}" "$WORKFLOWS_URL"))"
fi
echo ""

# 7. Tester la route /platform/n8n/view
echo "7. Test route /platform/n8n/view..."
VIEW_URL="http://localhost:3000/platform/n8n/view"
VIEW_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$VIEW_URL")
if [ "$VIEW_CODE" = "200" ]; then
    info "Route /platform/n8n/view répond (200)"
elif [ "$VIEW_CODE" = "403" ]; then
    warn "Route /platform/n8n/view répond (403 - Auth requise, normal)"
else
    error "Route /platform/n8n/view ne répond PAS (code: $VIEW_CODE)"
fi
echo ""

# 8. Vérifier les variables d'environnement
echo "8. Vérification variables d'environnement..."
ENV_FILE=""
if [ -f "/var/www/talosprime/.env.production" ]; then
    ENV_FILE="/var/www/talosprime/.env.production"
elif [ -f "/var/www/talosprimes/.env.production" ]; then
    ENV_FILE="/var/www/talosprimes/.env.production"
fi

if [ -n "$ENV_FILE" ]; then
    info "Fichier .env trouvé: $ENV_FILE"
    if grep -q "N8N_URL" "$ENV_FILE"; then
        info "N8N_URL est défini"
    else
        error "N8N_URL n'est PAS défini"
    fi
    if grep -q "N8N_BASIC_AUTH_USER" "$ENV_FILE"; then
        info "N8N_BASIC_AUTH_USER est défini"
    else
        warn "N8N_BASIC_AUTH_USER n'est PAS défini"
    fi
else
    error "Fichier .env.production non trouvé"
fi
echo ""

# 9. Vérifier les logs PM2
echo "9. Dernières erreurs PM2 (Next.js)..."
PM2_NAME="talosprime"
if pm2 list | grep -q "$PM2_NAME"; then
    info "Dernières erreurs:"
    pm2 logs "$PM2_NAME" --err --lines 5 --nostream 2>/dev/null | tail -10 || true
else
    error "PM2 process $PM2_NAME non trouvé"
fi
echo ""

# 10. Résumé
echo "=========================================="
echo "Résumé du diagnostic"
echo "=========================================="
echo ""
echo "Actions recommandées:"
echo "1. Si WebSocket non configuré: sudo ./scripts/setup-websocket-proxy.sh"
echo "2. Si CORS telemetry non configuré: sudo ./scripts/fix-n8n-cors-nginx.sh"
echo "3. Si N8N ne répond pas: pm2 restart n8n"
echo "4. Si Next.js ne répond pas: pm2 restart $PM2_NAME"
echo "5. Vérifier les logs: pm2 logs $PM2_NAME --err"
echo ""
