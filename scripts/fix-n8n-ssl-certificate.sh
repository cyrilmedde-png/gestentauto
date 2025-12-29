#!/bin/bash

###############################################################################
# Script pour corriger le certificat SSL de N8N
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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

###############################################################################
# ÉTAPE 1 : Vérifier l'état actuel
###############################################################################

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "     Correction du certificat SSL pour n8n.talosprimes.com"
echo "════════════════════════════════════════════════════════════════"
echo ""

print_step "Vérification de l'état actuel des certificats..."

# Vérifier si certbot est installé
if ! command -v certbot &> /dev/null; then
    print_error "Certbot n'est pas installé"
    print_step "Installation de Certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    print_success "Certbot installé"
fi

# Lister les certificats existants
echo ""
print_step "Certificats SSL actuels :"
sudo certbot certificates

###############################################################################
# ÉTAPE 2 : Vérifier la configuration nginx
###############################################################################

echo ""
print_step "Vérification de la configuration nginx pour N8N..."

NGINX_N8N_CONFIG="/etc/nginx/sites-available/n8n"

if [ ! -f "$NGINX_N8N_CONFIG" ]; then
    print_warning "Configuration nginx pour N8N non trouvée"
    print_step "Recherche d'autres configurations possibles..."
    
    # Chercher dans les configs
    N8N_CONFIGS=$(sudo grep -r "n8n.talosprimes.com" /etc/nginx/sites-available/ 2>/dev/null || echo "")
    
    if [ -z "$N8N_CONFIGS" ]; then
        print_error "Aucune configuration N8N trouvée dans nginx"
        print_step "Création d'une nouvelle configuration N8N..."
        
        # Créer la configuration
        sudo tee /etc/nginx/sites-available/n8n > /dev/null <<'EOFNGINX'
server {
    server_name n8n.talosprimes.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts plus longs pour éviter les déconnexions
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        
        # Buffers
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Autoriser l'iframe depuis www.talosprimes.com
    add_header Content-Security-Policy "frame-ancestors 'self' https://www.talosprimes.com" always;
    
    listen 80;
}
EOFNGINX
        
        # Activer la configuration
        sudo ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/n8n
        
        print_success "Configuration N8N créée"
    else
        echo "$N8N_CONFIGS"
        NGINX_N8N_CONFIG=$(echo "$N8N_CONFIGS" | head -n 1 | cut -d: -f1)
        print_success "Configuration trouvée : $NGINX_N8N_CONFIG"
    fi
fi

# Tester la configuration nginx
print_step "Test de la configuration nginx..."
if sudo nginx -t; then
    print_success "Configuration nginx valide"
else
    print_error "Configuration nginx invalide"
    echo ""
    print_step "Affichage des erreurs :"
    sudo nginx -t 2>&1
    exit 1
fi

###############################################################################
# ÉTAPE 3 : Obtenir/Renouveler le certificat SSL
###############################################################################

echo ""
print_step "Obtention du certificat SSL pour n8n.talosprimes.com..."

# Vérifier si N8N est accessible sur le port 80
print_step "Vérification que N8N est accessible sur le port 80..."
if curl -s -o /dev/null -w "%{http_code}" http://n8n.talosprimes.com | grep -q "200\|301\|302\|502"; then
    print_success "N8N est accessible"
else
    print_warning "N8N n'est pas accessible, rechargement de nginx..."
    sudo systemctl reload nginx
    sleep 2
fi

# Obtenir le certificat
echo ""
print_step "Demande du certificat SSL via Certbot..."
echo ""

# Demander le certificat (mode non-interactif)
sudo certbot --nginx \
    -d n8n.talosprimes.com \
    --non-interactive \
    --agree-tos \
    --redirect \
    --email cyrilmedde@gmail.com \
    --keep-until-expiring

if [ $? -eq 0 ]; then
    print_success "Certificat SSL obtenu avec succès"
else
    print_error "Échec de l'obtention du certificat"
    echo ""
    print_step "Vérifications à faire :"
    echo "  1. Le DNS de n8n.talosprimes.com pointe-t-il vers ce serveur ?"
    echo "  2. Le port 80 est-il ouvert ?"
    echo "  3. Nginx est-il en cours d'exécution ?"
    echo ""
    exit 1
fi

###############################################################################
# ÉTAPE 4 : Vérifier la configuration finale
###############################################################################

echo ""
print_step "Vérification de la configuration finale..."

# Recharger nginx
print_step "Rechargement de nginx..."
sudo systemctl reload nginx
print_success "Nginx rechargé"

# Afficher la configuration SSL
echo ""
print_step "Configuration SSL finale pour N8N :"
sudo certbot certificates | grep -A 10 "n8n.talosprimes.com" || print_warning "Certificat non trouvé dans la liste"

###############################################################################
# ÉTAPE 5 : Tests
###############################################################################

echo ""
print_step "Tests de connexion..."

# Test HTTP
echo ""
print_step "Test HTTP (devrait rediriger vers HTTPS)..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://n8n.talosprimes.com)
echo "Code HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    print_success "Redirection HTTP → HTTPS fonctionne"
else
    print_warning "Pas de redirection HTTP → HTTPS (code: $HTTP_CODE)"
fi

# Test HTTPS
echo ""
print_step "Test HTTPS..."
HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com)
echo "Code HTTPS: $HTTPS_CODE"

if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "302" ]; then
    print_success "HTTPS fonctionne"
else
    print_warning "HTTPS ne répond pas correctement (code: $HTTPS_CODE)"
fi

# Test du certificat
echo ""
print_step "Vérification du certificat SSL..."
CERT_INFO=$(echo | openssl s_client -servername n8n.talosprimes.com -connect n8n.talosprimes.com:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

if [ $? -eq 0 ]; then
    print_success "Certificat SSL valide"
    echo ""
    echo "$CERT_INFO"
else
    print_warning "Impossible de vérifier le certificat"
fi

###############################################################################
# ÉTAPE 6 : Configuration du renouvellement automatique
###############################################################################

echo ""
print_step "Configuration du renouvellement automatique..."

# Vérifier que le timer certbot est actif
if systemctl is-active --quiet certbot.timer; then
    print_success "Renouvellement automatique déjà configuré"
else
    print_step "Activation du renouvellement automatique..."
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    print_success "Renouvellement automatique activé"
fi

# Afficher le statut du timer
echo ""
print_step "Statut du renouvellement automatique :"
sudo systemctl status certbot.timer --no-pager | head -10

###############################################################################
# RÉSUMÉ FINAL
###############################################################################

echo ""
echo "════════════════════════════════════════════════════════════════"
print_success "Configuration SSL terminée !"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Certificat SSL installé pour n8n.talosprimes.com"
echo "✅ HTTPS activé et redirection HTTP → HTTPS configurée"
echo "✅ Renouvellement automatique activé"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Sur Chrome, allez sur : https://n8n.talosprimes.com"
echo "   → Vous ne devriez PLUS voir la page rouge"
echo ""
echo "2. Ensuite, testez depuis votre application :"
echo "   → https://www.talosprimes.com/platform/n8n"
echo ""
echo "3. Testez le changement d'onglet :"
echo "   → Changez d'onglet pendant 10-15 secondes"
echo "   → Revenez sur l'onglet"
echo "   → N8N ne devrait PAS recharger"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Test final depuis Chrome
echo "🧪 Pour tester depuis Chrome :"
echo ""
echo "   1. Fermez complètement Chrome (toutes les fenêtres)"
echo "   2. Rouvrez Chrome"
echo "   3. Videz le cache : Cmd+Shift+Delete (toutes les périodes)"
echo "   4. Allez sur : https://www.talosprimes.com/platform/n8n"
echo "   5. Vérifiez qu'il n'y a plus de page rouge"
echo ""

