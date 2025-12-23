#!/bin/bash

# Script pour configurer le proxy WebSocket N8N dans Nginx
# Usage: sudo ./scripts/setup-websocket-proxy.sh

set -e

echo "=========================================="
echo "Configuration WebSocket Proxy N8N"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que le script est exécuté en root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Erreur: Ce script doit être exécuté avec sudo${NC}"
    exit 1
fi

# Variables
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE=""

# Chercher le fichier de configuration Nginx
if [ -f "${NGINX_SITES_AVAILABLE}/talosprimes.com" ]; then
    CONFIG_FILE="${NGINX_SITES_AVAILABLE}/talosprimes.com"
    echo -e "${GREEN}✓ Configuration trouvée: talosprimes.com${NC}"
elif [ -f "${NGINX_SITES_AVAILABLE}/talosprime" ]; then
    CONFIG_FILE="${NGINX_SITES_AVAILABLE}/talosprime"
    echo -e "${GREEN}✓ Configuration trouvée: talosprime${NC}"
elif [ -f "${NGINX_SITES_AVAILABLE}/www.talosprimes.com" ]; then
    CONFIG_FILE="${NGINX_SITES_AVAILABLE}/www.talosprimes.com"
    echo -e "${GREEN}✓ Configuration trouvée: www.talosprimes.com${NC}"
else
    echo -e "${RED}✗ Aucun fichier de configuration Nginx trouvé${NC}"
    echo "Fichiers disponibles dans ${NGINX_SITES_AVAILABLE}:"
    ls -la "${NGINX_SITES_AVAILABLE}/" | grep -E "talos|\.conf"
    exit 1
fi

# Vérifier si la configuration WebSocket existe déjà
if grep -q "location /rest/push" "$CONFIG_FILE"; then
    echo -e "${YELLOW}⚠ Configuration WebSocket existe déjà${NC}"
    read -p "Voulez-vous la remplacer ? (o/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        echo "Configuration annulée"
        exit 0
    fi
    # Supprimer l'ancienne configuration
    sed -i '/# Proxy WebSocket pour N8N/,/^}$/d' "$CONFIG_FILE"
    echo -e "${GREEN}✓ Ancienne configuration supprimée${NC}"
fi

# Lire les credentials N8N depuis les variables d'environnement
# Chercher dans différents emplacements possibles
ENV_FILE=""
if [ -f "/var/www/talosprime/.env.production" ]; then
    ENV_FILE="/var/www/talosprime/.env.production"
elif [ -f "/var/www/talosprimes/.env.production" ]; then
    ENV_FILE="/var/www/talosprimes/.env.production"
elif [ -f "/var/www/gestion-complete-automatiser/.env.production" ]; then
    ENV_FILE="/var/www/gestion-complete-automatiser/.env.production"
else
    echo -e "${YELLOW}⚠ Fichier .env.production non trouvé${NC}"
    echo "Veuillez entrer les credentials N8N manuellement"
fi

if [ -n "$ENV_FILE" ]; then
    echo -e "${GREEN}✓ Fichier .env trouvé: ${ENV_FILE}${NC}"
    source "$ENV_FILE"
fi

# Demander les credentials si non trouvés
if [ -z "$N8N_BASIC_AUTH_USER" ] || [ -z "$N8N_BASIC_AUTH_PASSWORD" ]; then
    echo ""
    echo "Credentials N8N non trouvés dans les variables d'environnement"
    read -p "N8N Basic Auth Username: " N8N_BASIC_AUTH_USER
    read -sp "N8N Basic Auth Password: " N8N_BASIC_AUTH_PASSWORD
    echo ""
fi

if [ -z "$N8N_BASIC_AUTH_USER" ] || [ -z "$N8N_BASIC_AUTH_PASSWORD" ]; then
    echo -e "${RED}✗ Credentials N8N requis${NC}"
    exit 1
fi

# Générer les credentials Base64
BASIC_AUTH=$(echo -n "${N8N_BASIC_AUTH_USER}:${N8N_BASIC_AUTH_PASSWORD}" | base64 -w 0)
echo -e "${GREEN}✓ Credentials Base64 générés${NC}"

# URL N8N (par défaut)
N8N_URL="${N8N_URL:-https://n8n.talosprimes.com}"
N8N_HOST=$(echo "$N8N_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||')
echo "URL N8N: $N8N_URL"
echo "Host N8N: $N8N_HOST"

# Créer la configuration WebSocket
WEBSOCKET_CONFIG="
    # Proxy WebSocket pour N8N
    location /rest/push {
        proxy_pass ${N8N_URL}/rest/push;
        proxy_http_version 1.1;
        
        # Headers WebSocket
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
        
        # Authentification Basic Auth pour N8N
        proxy_set_header Authorization \"Basic ${BASIC_AUTH}\";
        
        # SSL
        proxy_ssl_verify off;
        proxy_ssl_server_name on;
    }"

# Trouver où insérer la configuration dans le bloc server pour www.talosprimes.com
# Utiliser une approche plus simple avec un fichier temporaire

# Créer un fichier temporaire avec la configuration WebSocket
TEMP_CONFIG=$(mktemp)
echo "$WEBSOCKET_CONFIG" > "$TEMP_CONFIG"

# Chercher le bloc server pour www.talosprimes.com
if grep -q "server_name.*www.talosprimes.com" "$CONFIG_FILE"; then
    # Trouver la ligne de fin du bloc server (la dernière } avant le prochain server ou la fin)
    # Insérer après la dernière location dans ce bloc, ou avant la fermeture du bloc
    
    # Chercher si location / existe dans le bloc
    SERVER_START=$(grep -n "server_name.*www.talosprimes.com" "$CONFIG_FILE" | head -1 | cut -d: -f1)
    if [ -n "$SERVER_START" ]; then
        # Trouver la ligne de fermeture du bloc server (la première } après server_start qui ferme le bloc)
        # Chercher toutes les locations dans ce bloc
        SERVER_END=$(awk -v start="$SERVER_START" '
            NR >= start && /^[[:space:]]*}[[:space:]]*$/ && depth == 0 {print NR; exit}
            NR >= start && /{/ {depth++}
            NR >= start && /}/ {depth--}
        ' "$CONFIG_FILE")
        
        if [ -n "$SERVER_END" ]; then
            # Chercher la dernière location avant la fermeture
            LAST_LOCATION=$(awk -v start="$SERVER_START" -v end="$SERVER_END" '
                NR >= start && NR < end && /location / {last = NR}
                END {if (last) print last}
            ' "$CONFIG_FILE")
            
            if [ -n "$LAST_LOCATION" ]; then
                # Insérer après la dernière location
                sed -i "${LAST_LOCATION}r $TEMP_CONFIG" "$CONFIG_FILE"
            else
                # Insérer avant la fermeture du bloc
                sed -i "$((SERVER_END - 1))r $TEMP_CONFIG" "$CONFIG_FILE"
            fi
        else
            # Fallback: chercher location / dans tout le fichier
            if grep -q "location / {" "$CONFIG_FILE"; then
                sed -i "/location \/ {/r $TEMP_CONFIG" "$CONFIG_FILE"
            else
                # Insérer avant le dernier }
                sed -i '$ i\
'"$(cat $TEMP_CONFIG)"'
' "$CONFIG_FILE"
            fi
        fi
    fi
elif grep -q "location / {" "$CONFIG_FILE"; then
    # Fallback: Insérer après location / si pas de bloc spécifique
    sed -i "/location \/ {/r $TEMP_CONFIG" "$CONFIG_FILE"
else
    # Fallback: Insérer avant le dernier '}'
    sed -i '$ i\
'"$(cat $TEMP_CONFIG)"'
' "$CONFIG_FILE"
fi

# Nettoyer le fichier temporaire
rm -f "$TEMP_CONFIG"

echo -e "${GREEN}✓ Configuration WebSocket ajoutée${NC}"

# Créer une sauvegarde
BACKUP_FILE="${CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONFIG_FILE" "$BACKUP_FILE"
echo -e "${GREEN}✓ Sauvegarde créée: ${BACKUP_FILE}${NC}"

# Tester la configuration Nginx
echo ""
echo "Test de la configuration Nginx..."
if nginx -t; then
    echo -e "${GREEN}✓ Configuration Nginx valide${NC}"
else
    echo -e "${RED}✗ Erreur dans la configuration Nginx${NC}"
    echo "Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$CONFIG_FILE"
    exit 1
fi

# Recharger Nginx
echo ""
read -p "Voulez-vous recharger Nginx maintenant ? (O/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    systemctl reload nginx
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Nginx rechargé avec succès${NC}"
    else
        echo -e "${RED}✗ Erreur lors du rechargement de Nginx${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Nginx n'a pas été rechargé${NC}"
    echo "N'oubliez pas d'exécuter: sudo systemctl reload nginx"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Configuration terminée avec succès !${NC}"
echo "=========================================="
echo ""
echo "La configuration WebSocket est maintenant active."
echo "Les connexions WebSocket vers /rest/push seront proxifiées vers N8N."
echo ""
echo "Pour tester, vérifiez les logs Nginx:"
echo "  sudo tail -f /var/log/nginx/error.log"
echo "  sudo tail -f /var/log/nginx/access.log"
echo ""

