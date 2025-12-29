#!/bin/bash

# ============================================
# Script pour corriger le problème PM2 "Process not found" pour N8N
# Usage: sudo bash scripts/fix-pm2-n8n-process.sh
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
log_info "🔧 Correction du problème PM2 pour N8N"
echo "=========================================="
echo ""

# 1. Vérifier le statut PM2
log_info "1️⃣ Vérification du statut PM2..."
echo ""

pm2 list

echo ""
log_info "2️⃣ Nettoyage des processus PM2 orphelins..."
echo ""

# Supprimer tous les processus N8N orphelins
pm2 delete n8n 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# Redémarrer PM2
pm2 resurrect 2>/dev/null || true

echo ""
log_info "3️⃣ Recherche de l'installation N8N..."
echo ""

# Trouver où N8N est installé
N8N_CMD=""
if command -v n8n &> /dev/null; then
    N8N_CMD=$(which n8n)
    log_success "N8N trouvé: $N8N_CMD"
elif [ -f "/usr/local/bin/n8n" ]; then
    N8N_CMD="/usr/local/bin/n8n"
    log_success "N8N trouvé: $N8N_CMD"
elif [ -f "/usr/bin/n8n" ]; then
    N8N_CMD="/usr/bin/n8n"
    log_success "N8N trouvé: $N8N_CMD"
else
    log_error "N8N non trouvé dans le PATH"
    echo ""
    echo "💡 Installez N8N avec: npm install -g n8n"
    exit 1
fi

# Vérifier la version
N8N_VERSION=$($N8N_CMD --version 2>/dev/null || echo "inconnue")
log_info "Version N8N: $N8N_VERSION"

# Trouver le répertoire de travail N8N
N8N_DIR=""
if [ -d "/var/n8n" ]; then
    N8N_DIR="/var/n8n"
elif [ -d "/root/.n8n" ]; then
    N8N_DIR="/root/.n8n"
elif [ -d "$HOME/.n8n" ]; then
    N8N_DIR="$HOME/.n8n"
else
    N8N_DIR="/root/.n8n"
    mkdir -p "$N8N_DIR"
    log_warning "Répertoire N8N créé: $N8N_DIR"
fi

log_info "Répertoire de travail: $N8N_DIR"

echo ""
log_info "4️⃣ Vérification du port 5678..."
echo ""

# Libérer le port 5678 si nécessaire
if command -v lsof &> /dev/null; then
    PORT_PID=$(lsof -ti:5678 2>/dev/null || echo "")
    if [ -n "$PORT_PID" ]; then
        log_warning "Port 5678 utilisé par le processus $PORT_PID"
        read -p "Voulez-vous arrêter ce processus ? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 $PORT_PID 2>/dev/null || true
            sleep 1
            log_success "Port 5678 libéré"
        fi
    else
        log_success "Port 5678 libre"
    fi
else
    log_warning "lsof non disponible, impossible de vérifier le port"
fi

echo ""
log_info "5️⃣ Création de la configuration PM2..."
echo ""

# Créer ecosystem.config.js
ECOSYSTEM_FILE="$N8N_DIR/ecosystem.config.js"

cat > "$ECOSYSTEM_FILE" <<EOF
module.exports = {
  apps: [{
    name: 'n8n',
    script: '$N8N_CMD',
    args: 'start',
    cwd: '$N8N_DIR',
    env: {
      NODE_ENV: 'production',
      N8N_HOST: '0.0.0.0',
      N8N_PORT: '5678',
      N8N_PROTOCOL: 'https',
      N8N_EDITOR_BASE_URL: 'https://n8n.talosprimes.com',
      N8N_USER_FOLDER: '$N8N_DIR/data',
      N8N_LOG_LEVEL: 'info',
      N8N_LOG_OUTPUT: 'file',
      N8N_LOG_FILE_LOCATION: '$N8N_DIR/logs/n8n.log'
    },
    error_file: '$N8N_DIR/logs/pm2-error.log',
    out_file: '$N8N_DIR/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    instances: 1,
    exec_mode: 'fork'
  }]
};
EOF

# Créer les répertoires nécessaires
mkdir -p "$N8N_DIR/data"
mkdir -p "$N8N_DIR/logs"

log_success "Configuration PM2 créée: $ECOSYSTEM_FILE"

# Charger les variables d'environnement si .env existe
if [ -f "$N8N_DIR/.env" ]; then
    log_info "Variables d'environnement trouvées dans $N8N_DIR/.env"
    # Les variables seront chargées par PM2 via env_file si configuré
fi

echo ""
log_info "6️⃣ Démarrage de N8N avec PM2..."
echo ""

# Supprimer l'ancien processus s'il existe
pm2 delete n8n 2>/dev/null || true
sleep 1

# Démarrer avec ecosystem.config.js
cd "$N8N_DIR"
pm2 start ecosystem.config.js

sleep 3

# Vérifier le statut
log_info "Vérification du statut..."
pm2 list | grep -i n8n || log_warning "N8N non trouvé dans la liste PM2"

echo ""
log_info "7️⃣ Sauvegarde de la configuration PM2..."
echo ""

pm2 save

echo ""
log_info "8️⃣ Vérification finale..."
echo ""

# Vérifier que N8N répond
sleep 2
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
        log_success "N8N répond sur le port 5678 (Code: $HTTP_CODE)"
    else
        log_warning "N8N ne répond pas encore (Code: $HTTP_CODE)"
        log_info "Vérifiez les logs: pm2 logs n8n"
    fi
else
    log_warning "curl non disponible, impossible de tester"
fi

echo ""
echo "=========================================="
log_success "Correction terminée !"
echo "=========================================="
echo ""
echo "📋 Commandes utiles :"
echo ""
echo "   # Voir le statut"
echo "   pm2 status"
echo ""
echo "   # Voir les logs N8N"
echo "   pm2 logs n8n"
echo ""
echo "   # Redémarrer N8N"
echo "   pm2 restart n8n"
echo ""
echo "   # Arrêter N8N"
echo "   pm2 stop n8n"
echo ""
echo "   # Voir les logs en temps réel"
echo "   pm2 logs n8n --lines 50"
echo ""
echo ""

