#!/bin/bash

###############################################################################
# Script pour créer la configuration nginx de N8N avec SSL
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "     Création de la configuration nginx pour N8N"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Vérifier que N8N tourne
print_step "Vérification que N8N est en cours d'exécution..."
if pm2 list | grep -q "n8n.*online"; then
    print_success "N8N est en ligne"
else
    print_error "N8N n'est pas en ligne"
    echo "Démarrez N8N avec : pm2 start n8n"
    exit 1
fi

# Vérifier que le certificat SSL existe
print_step "Vérification du certificat SSL..."
if [ -f "/etc/letsencrypt/live/n8n.talosprimes.com/fullchain.pem" ]; then
    print_success "Certificat SSL trouvé"
else
    print_error "Certificat SSL non trouvé"
    echo "Obtenez un certificat avec : sudo certbot --nginx -d n8n.talosprimes.com"
    exit 1
fi

# Créer la configuration nginx
print_step "Création de la configuration nginx pour N8N..."

sudo tee /etc/nginx/sites-available/n8n > /dev/null <<'EOFNGINX'
# Configuration nginx pour N8N
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name n8n.talosprimes.com;
    
    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name n8n.talosprimes.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/n8n.talosprimes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.talosprimes.com/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Autoriser l'iframe depuis www.talosprimes.com
    add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
    
    # Headers de sécurité
    add_header X-Frame-Options "ALLOW-FROM https://www.talosprimes.com" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/n8n-access.log;
    error_log /var/log/nginx/n8n-error.log;

    # Proxy vers N8N sur le port 5678
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        
        # Headers pour WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Headers standards
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts longs pour éviter les déconnexions
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;
        
        # Pas de buffering pour les WebSockets
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;
        
        # Taille max du body
        client_max_body_size 50M;
    }
}
EOFNGINX

print_success "Configuration créée : /etc/nginx/sites-available/n8n"

# Créer le lien symbolique
print_step "Activation de la configuration..."
sudo ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/n8n
print_success "Configuration activée"

# Tester la configuration
print_step "Test de la configuration nginx..."
if sudo nginx -t; then
    print_success "Configuration nginx valide"
else
    print_error "Configuration nginx invalide"
    exit 1
fi

# Recharger nginx
print_step "Rechargement de nginx..."
sudo systemctl reload nginx
print_success "Nginx rechargé"

# Tests
echo ""
print_step "Tests de connexion..."

echo ""
echo "1. Test HTTP (devrait rediriger vers HTTPS) :"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://n8n.talosprimes.com)
echo "   Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    print_success "Redirection HTTP → HTTPS OK"
else
    echo "   ⚠️  Pas de redirection (code: $HTTP_CODE)"
fi

echo ""
echo "2. Test HTTPS :"
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com)
echo "   Code HTTPS: $HTTPS_CODE"
if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "302" ]; then
    print_success "HTTPS fonctionne"
else
    echo "   ⚠️  HTTPS ne répond pas correctement (code: $HTTPS_CODE)"
fi

echo ""
echo "3. Vérification du certificat SSL :"
CERT_CHECK=$(echo | openssl s_client -servername n8n.talosprimes.com -connect n8n.talosprimes.com:443 2>/dev/null | grep "Verify return code")
echo "   $CERT_CHECK"

echo ""
echo "════════════════════════════════════════════════════════════════"
print_success "Configuration nginx pour N8N terminée !"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ N8N est maintenant accessible en HTTPS"
echo "✅ Redirection HTTP → HTTPS activée"
echo "✅ WebSocket configuré"
echo "✅ Iframe autorisée depuis www.talosprimes.com"
echo ""
echo "🧪 Testez maintenant :"
echo ""
echo "1. Sur Chrome, allez sur : https://n8n.talosprimes.com"
echo "   → Ne devrait PLUS afficher de page rouge"
echo ""
echo "2. Depuis votre application : https://www.talosprimes.com/platform/n8n"
echo "   → Devrait charger N8N correctement"
echo ""
echo "3. Testez le changement d'onglet :"
echo "   → Changez d'onglet pendant 15 secondes"
echo "   → Revenez sur l'onglet"
echo "   → N8N ne devrait PAS recharger"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

