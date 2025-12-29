#!/bin/bash

# ============================================
# Script d'installation de N8N version 2.0.3
# Version stable recommandée
# ============================================

set -e  # Arrêter en cas d'erreur

# ============================================
# CONFIGURATION
# ============================================
N8N_VERSION="2.0.3"
N8N_DIR="/var/n8n"
N8N_USER="n8n"
ENV_FILE="$N8N_DIR/.env"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# FONCTIONS UTILITAIRES
# ============================================
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

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Ce script doit être exécuté avec sudo"
        echo "Usage: sudo bash install-n8n-2.0.3.sh"
        exit 1
    fi
}

# ============================================
# VÉRIFICATION DES PRÉREQUIS
# ============================================
echo ""
log_info "🔍 Vérification des prérequis..."
echo ""

check_root

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js installé: $NODE_VERSION"
else
    log_error "Node.js n'est pas installé"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm installé: $NPM_VERSION"
else
    log_error "npm n'est pas installé"
    exit 1
fi

# Vérifier PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    log_success "PM2 installé: $PM2_VERSION"
else
    log_error "PM2 n'est pas installé"
    echo "Installez PM2 avec: sudo npm install -g pm2"
    exit 1
fi

# Vérifier que l'utilisateur n8n existe
if id "$N8N_USER" &>/dev/null; then
    log_success "Utilisateur $N8N_USER existe"
else
    log_error "Utilisateur $N8N_USER n'existe pas"
    echo "Créez l'utilisateur d'abord ou exécutez le script d'installation complet"
    exit 1
fi

# Vérifier que le répertoire N8N existe
if [ -d "$N8N_DIR" ]; then
    log_success "Répertoire $N8N_DIR existe"
else
    log_error "Répertoire $N8N_DIR n'existe pas"
    echo "Créez le répertoire d'abord: sudo mkdir -p $N8N_DIR && sudo chown $N8N_USER:$N8N_USER $N8N_DIR"
    exit 1
fi

# ============================================
# SAUVEGARDE DE LA CONFIGURATION ACTUELLE
# ============================================
log_info "💾 Sauvegarde de la configuration actuelle..."

# Sauvegarder .env si existe
if [ -f "$ENV_FILE" ]; then
    BACKUP_ENV="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$ENV_FILE" "$BACKUP_ENV"
    log_success "Fichier .env sauvegardé: $BACKUP_ENV"
fi

# Sauvegarder ecosystem.config.js si existe
PM2_CONFIG="$N8N_DIR/ecosystem.config.js"
if [ -f "$PM2_CONFIG" ]; then
    BACKUP_PM2="${PM2_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$PM2_CONFIG" "$BACKUP_PM2"
    log_success "Fichier ecosystem.config.js sauvegardé: $BACKUP_PM2"
fi

# ============================================
# ARRÊTER N8N SI IL EST EN COURS D'EXÉCUTION
# ============================================
log_info "🛑 Arrêt de N8N si en cours d'exécution..."

if sudo -u "$N8N_USER" pm2 list | grep -q "n8n"; then
    log_warning "N8N est en cours d'exécution, arrêt..."
    sudo -u "$N8N_USER" pm2 stop n8n || true
    sudo -u "$N8N_USER" pm2 delete n8n || true
    log_success "N8N arrêté"
else
    log_info "N8N n'est pas en cours d'exécution"
fi

# ============================================
# INSTALLATION DE N8N VERSION 2.0.3
# ============================================
log_info "📦 Installation de N8N version $N8N_VERSION..."

# Vérifier la version actuelle
if command -v n8n &> /dev/null; then
    CURRENT_VERSION=$(n8n --version)
    log_info "Version actuelle: $CURRENT_VERSION"
fi

# Installer la version spécifique globalement
log_info "Installation de n8n@$N8N_VERSION..."
npm install -g "n8n@$N8N_VERSION"

# Vérifier l'installation
if command -v n8n &> /dev/null; then
    INSTALLED_VERSION=$(n8n --version)
    if [ "$INSTALLED_VERSION" = "$N8N_VERSION" ]; then
        log_success "N8N version $N8N_VERSION installée avec succès"
    else
        log_warning "Version installée: $INSTALLED_VERSION (attendu: $N8N_VERSION)"
    fi
else
    log_error "Échec de l'installation de N8N"
    exit 1
fi

# ============================================
# INSTALLATION LOCALE DANS LE RÉPERTOIRE N8N
# ============================================
log_info "📦 Installation locale de N8N dans $N8N_DIR..."

# Créer package.json si n'existe pas
if [ ! -f "$N8N_DIR/package.json" ]; then
    log_info "Création du package.json..."
    sudo -u "$N8N_USER" cat > "$N8N_DIR/package.json" <<EOF
{
  "name": "n8n",
  "version": "$N8N_VERSION",
  "description": "n8n workflow automation",
  "private": true,
  "dependencies": {
    "n8n": "$N8N_VERSION"
  }
}
EOF
    log_success "package.json créé"
else
    log_info "package.json existe déjà, mise à jour de la version..."
    # Mettre à jour la version dans package.json
    sudo -u "$N8N_USER" sed -i "s/\"n8n\": \".*\"/\"n8n\": \"$N8N_VERSION\"/" "$N8N_DIR/package.json"
fi

# Installer N8N localement dans le répertoire
log_info "Installation de n8n@$N8N_VERSION localement..."
cd "$N8N_DIR"
sudo -u "$N8N_USER" npm install "n8n@$N8N_VERSION" --save --save-exact
log_success "N8N installé localement"

# Vérifier la version locale
if [ -f "$N8N_DIR/node_modules/.bin/n8n" ]; then
    LOCAL_VERSION=$(sudo -u "$N8N_USER" "$N8N_DIR/node_modules/.bin/n8n" --version)
    log_success "Version locale installée: $LOCAL_VERSION"
fi

# ============================================
# CONFIGURATION PM2 (si ecosystem.config.js existe)
# ============================================
if [ -f "$PM2_CONFIG" ]; then
    log_info "⚙️  Configuration PM2..."
    
    # Vérifier si le script pointe vers le n8n local ou global
    if grep -q "node_modules/.bin/n8n" "$PM2_CONFIG"; then
        log_success "PM2 configuré pour utiliser la version locale"
    else
        log_info "Mise à jour de ecosystem.config.js pour utiliser la version locale..."
        
        # Créer une sauvegarde
        cp "$PM2_CONFIG" "${PM2_CONFIG}.pre-update"
        
        # Mettre à jour le script pour pointer vers la version locale
        sudo -u "$N8N_USER" sed -i "s|script: 'n8n'|script: '$N8N_DIR/node_modules/.bin/n8n'|" "$PM2_CONFIG"
        sudo -u "$N8N_USER" sed -i "s|script: \"n8n\"|script: \"$N8N_DIR/node_modules/.bin/n8n\"|" "$PM2_CONFIG"
        
        log_success "ecosystem.config.js mis à jour"
    fi
else
    log_warning "ecosystem.config.js n'existe pas, création..."
    
    # Créer ecosystem.config.js basique
    sudo -u "$N8N_USER" cat > "$PM2_CONFIG" <<EOF
module.exports = {
  apps: [{
    name: 'n8n',
    script: '$N8N_DIR/node_modules/.bin/n8n',
    cwd: '$N8N_DIR',
    env_file: '$ENV_FILE',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '$N8N_DIR/logs/pm2-error.log',
    out_file: '$N8N_DIR/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
}
EOF
    log_success "ecosystem.config.js créé"
fi

# ============================================
# DÉMARRAGE DE N8N AVEC PM2
# ============================================
log_info "🚀 Démarrage de N8N avec PM2..."

cd "$N8N_DIR"
sudo -u "$N8N_USER" pm2 start ecosystem.config.js
sudo -u "$N8N_USER" pm2 save

log_success "N8N démarré avec PM2"

# Afficher le statut
sleep 2
log_info "📊 Statut PM2:"
sudo -u "$N8N_USER" pm2 status

# ============================================
# VÉRIFICATION
# ============================================
log_info "🔍 Vérification de l'installation..."

# Vérifier la version globale
if command -v n8n &> /dev/null; then
    GLOBAL_VERSION=$(n8n --version)
    log_info "Version globale (CLI): $GLOBAL_VERSION"
fi

# Vérifier la version locale (via PM2)
if sudo -u "$N8N_USER" pm2 list | grep -q "n8n"; then
    log_success "N8N est en cours d'exécution avec PM2"
    
    # Essayer de récupérer la version depuis l'API N8N après quelques secondes
    sleep 3
    if curl -s -k https://n8n.talosprimes.com/rest/login > /dev/null 2>&1; then
        log_success "N8N répond correctement"
    else
        log_warning "N8N ne répond pas encore (peut prendre quelques secondes)"
    fi
else
    log_error "N8N n'est pas en cours d'exécution"
    log_info "Vérifiez les logs avec: sudo -u $N8N_USER pm2 logs n8n"
fi

# ============================================
# RÉSUMÉ
# ============================================
echo ""
echo "=========================================="
log_success "Installation de N8N version $N8N_VERSION terminée"
echo "=========================================="
echo ""
echo "📋 Informations:"
echo "  - Version globale (CLI): $(n8n --version 2>/dev/null || echo 'N/A')"
echo "  - Répertoire: $N8N_DIR"
echo "  - Utilisateur: $N8N_USER"
echo "  - Fichier .env: $ENV_FILE"
echo ""
echo "📝 Commandes utiles:"
echo "  - Vérifier le statut: sudo -u $N8N_USER pm2 status"
echo "  - Voir les logs: sudo -u $N8N_USER pm2 logs n8n"
echo "  - Redémarrer: sudo -u $N8N_USER pm2 restart n8n"
echo "  - Arrêter: sudo -u $N8N_USER pm2 stop n8n"
echo ""
echo "⚠️  Note: La version dans le panel N8N peut différer légèrement de la version CLI"
echo "    Vérifiez dans le panel: Settings > Version"
echo ""





