#!/bin/bash

# ============================================
# Script de mise à jour de N8N
# Usage: sudo bash scripts/update-n8n.sh [VERSION]
# Exemple: sudo bash scripts/update-n8n.sh 2.1.4
#          sudo bash scripts/update-n8n.sh (dernière version)
# ============================================

set -e  # Arrêter en cas d'erreur

# ============================================
# CONFIGURATION
# ============================================
N8N_DIR="/var/n8n"
N8N_USER="n8n"
BACKUP_DIR="/var/backups/n8n"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
        echo "Usage: sudo bash scripts/update-n8n.sh [VERSION]"
        exit 1
    fi
}

# ============================================
# VÉRIFICATIONS PRÉLIMINAIRES
# ============================================
echo ""
log_info "🔍 Vérification des prérequis..."
echo ""

check_root

# Vérifier que l'utilisateur n8n existe
if ! id "$N8N_USER" &>/dev/null; then
    log_error "L'utilisateur $N8N_USER n'existe pas"
    echo "Exécutez d'abord: sudo bash scripts/install-n8n.sh"
    exit 1
fi

# Vérifier que le répertoire N8N existe
if [ ! -d "$N8N_DIR" ]; then
    log_error "Le répertoire $N8N_DIR n'existe pas"
    echo "N8N n'est pas installé. Exécutez d'abord: sudo bash scripts/install-n8n.sh"
    exit 1
fi

# Vérifier que PM2 est installé
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 n'est pas installé"
    exit 1
fi

# Vérifier que N8N est en cours d'exécution
if ! sudo -u "$N8N_USER" pm2 describe n8n &>/dev/null; then
    log_warning "N8N n'est pas en cours d'exécution avec PM2"
    read -p "Voulez-vous continuer quand même ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

log_success "Prérequis vérifiés"

# ============================================
# DÉTERMINATION DE LA VERSION
# ============================================
echo ""
log_info "📦 Détermination de la version à installer..."
echo ""

# Récupérer la version actuelle
CURRENT_VERSION=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")

if [ -n "$1" ]; then
    TARGET_VERSION="$1"
    log_info "Version cible spécifiée: $TARGET_VERSION"
else
    log_info "Récupération de la dernière version disponible..."
    # Récupérer la dernière version depuis npm
    TARGET_VERSION=$(npm view n8n version 2>/dev/null || echo "")
    
    if [ -z "$TARGET_VERSION" ]; then
        log_error "Impossible de récupérer la dernière version"
        read -p "Entrez la version à installer (ex: 2.1.4): " TARGET_VERSION
        if [ -z "$TARGET_VERSION" ]; then
            log_error "Version non spécifiée"
            exit 1
        fi
    else
        log_info "Dernière version disponible: $TARGET_VERSION"
    fi
fi

echo ""
log_info "Version actuelle: $CURRENT_VERSION"
log_info "Version cible: $TARGET_VERSION"
echo ""

if [ "$CURRENT_VERSION" = "$TARGET_VERSION" ]; then
    log_warning "N8N est déjà à la version $TARGET_VERSION"
    read -p "Voulez-vous quand même continuer ? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# ============================================
# SAUVEGARDE
# ============================================
echo ""
log_info "💾 Création d'une sauvegarde..."
echo ""

mkdir -p "$BACKUP_DIR"

# Sauvegarder le package.json et package-lock.json
if [ -f "$N8N_DIR/package.json" ]; then
    cp "$N8N_DIR/package.json" "$BACKUP_DIR/package.json.backup.$TIMESTAMP"
    log_success "package.json sauvegardé"
fi

if [ -f "$N8N_DIR/package-lock.json" ]; then
    cp "$N8N_DIR/package-lock.json" "$BACKUP_DIR/package-lock.json.backup.$TIMESTAMP"
    log_success "package-lock.json sauvegardé"
fi

# Sauvegarder le .env
if [ -f "$N8N_DIR/.env" ]; then
    cp "$N8N_DIR/.env" "$BACKUP_DIR/.env.backup.$TIMESTAMP"
    log_success ".env sauvegardé"
fi

# Sauvegarder ecosystem.config.js
if [ -f "$N8N_DIR/ecosystem.config.js" ]; then
    cp "$N8N_DIR/ecosystem.config.js" "$BACKUP_DIR/ecosystem.config.js.backup.$TIMESTAMP"
    log_success "ecosystem.config.js sauvegardé"
fi

# Sauvegarder les données (optionnel, peut être long)
read -p "Voulez-vous sauvegarder les données N8N (workflows, credentials) ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Sauvegarde des données (cela peut prendre quelques minutes)..."
    sudo -u "$N8N_USER" tar -czf "$BACKUP_DIR/n8n-data-backup.$TIMESTAMP.tar.gz" -C "$N8N_DIR" data 2>/dev/null || {
        log_warning "Impossible de sauvegarder les données (peut être normal si le dossier data est vide)"
    }
    log_success "Données sauvegardées"
fi

log_success "Sauvegarde terminée dans $BACKUP_DIR"

# ============================================
# ARRÊT DE N8N
# ============================================
echo ""
log_info "⏸️  Arrêt de N8N..."
echo ""

if sudo -u "$N8N_USER" pm2 describe n8n &>/dev/null; then
    sudo -u "$N8N_USER" pm2 stop n8n
    sleep 2
    log_success "N8N arrêté"
else
    log_warning "N8N n'était pas en cours d'exécution"
fi

# ============================================
# MISE À JOUR DE N8N
# ============================================
echo ""
log_info "📦 Mise à jour de N8N vers la version $TARGET_VERSION..."
echo ""

# Mettre à jour globalement
log_info "Mise à jour globale de N8N..."
npm install -g "n8n@$TARGET_VERSION" || {
    log_error "Échec de la mise à jour globale"
    exit 1
}

# Vérifier la version globale
GLOBAL_VERSION=$(n8n --version 2>/dev/null || echo "")
log_success "N8N global mis à jour: version $GLOBAL_VERSION"

# Mettre à jour localement dans /var/n8n
log_info "Mise à jour locale de N8N dans $N8N_DIR..."
sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
npm install "n8n@$TARGET_VERSION" --save --save-exact || {
    echo "Erreur lors de l'installation locale"
    exit 1
}
EOF

# Vérifier la version locale
LOCAL_VERSION=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "")
log_success "N8N local mis à jour: version $LOCAL_VERSION"

# ============================================
# REDÉMARRAGE DE N8N
# ============================================
echo ""
log_info "🔄 Redémarrage de N8N avec PM2..."
echo ""

# Vérifier que ecosystem.config.js existe
if [ ! -f "$N8N_DIR/ecosystem.config.js" ]; then
    log_warning "ecosystem.config.js n'existe pas, création d'un fichier de base..."
    cat > "$N8N_DIR/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: 'n8n',
    script: '$N8N_DIR/node_modules/.bin/n8n',
    cwd: '$N8N_DIR',
    user: '$N8N_USER',
    env_file: '$N8N_DIR/.env',
    env: {
      NODE_ENV: 'production',
      N8N_USER_FOLDER: '$N8N_DIR/data',
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
    chown "$N8N_USER:$N8N_USER" "$N8N_DIR/ecosystem.config.js"
    log_success "ecosystem.config.js créé"
fi

# S'assurer que le script pointe vers la version locale
if grep -q "script: 'n8n'" "$N8N_DIR/ecosystem.config.js"; then
    log_info "Mise à jour de ecosystem.config.js pour utiliser la version locale..."
    sed -i "s|script: 'n8n'|script: '$N8N_DIR/node_modules/.bin/n8n'|g" "$N8N_DIR/ecosystem.config.js"
    chown "$N8N_USER:$N8N_USER" "$N8N_DIR/ecosystem.config.js"
    log_success "ecosystem.config.js mis à jour"
fi

# Redémarrer avec PM2
sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
export \$(cat .env 2>/dev/null | grep -v '^#' | xargs 2>/dev/null || true)
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
pm2 save
EOF

sleep 3

# Vérifier le statut
if sudo -u "$N8N_USER" pm2 describe n8n &>/dev/null; then
    STATUS=$(sudo -u "$N8N_USER" pm2 jlist | jq -r '.[] | select(.name=="n8n") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "online" ]; then
        log_success "N8N redémarré avec succès (statut: $STATUS)"
    else
        log_warning "N8N redémarré mais statut: $STATUS"
    fi
else
    log_error "N8N n'a pas pu être redémarré"
    exit 1
fi

# ============================================
# VÉRIFICATION
# ============================================
echo ""
log_info "🔍 Vérification de l'installation..."
echo ""

# Vérifier la version CLI
CLI_VERSION=$(n8n --version 2>/dev/null || echo "inconnue")
log_info "Version CLI: $CLI_VERSION"

# Vérifier la version locale
LOCAL_VERSION_CHECK=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")
log_info "Version locale: $LOCAL_VERSION_CHECK"

# Vérifier les logs pour les erreurs
log_info "Vérification des logs (5 dernières lignes)..."
sudo -u "$N8N_USER" pm2 logs n8n --lines 5 --nostream 2>/dev/null || true

# Test de connectivité (optionnel)
log_info "Test de connectivité..."
sleep 2
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://n8n.talosprimes.com" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
        log_success "N8N est accessible (HTTP $HTTP_CODE)"
    else
        log_warning "N8N répond avec le code HTTP $HTTP_CODE (peut être normal si l'authentification est requise)"
    fi
else
    log_warning "curl n'est pas installé, impossible de tester la connectivité"
fi

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo ""
echo "============================================"
log_success "Mise à jour de N8N terminée avec succès !"
echo "============================================"
echo ""
echo "📋 Informations :"
echo ""
echo "   📦 Version CLI: $CLI_VERSION"
echo "   📦 Version locale: $LOCAL_VERSION_CHECK"
echo "   📁 Répertoire: $N8N_DIR"
echo "   💾 Sauvegardes: $BACKUP_DIR"
echo ""
echo "🔧 Commandes utiles :"
echo ""
echo "   # Voir le statut N8N"
echo "   sudo -u $N8N_USER pm2 status"
echo ""
echo "   # Voir les logs N8N"
echo "   sudo -u $N8N_USER pm2 logs n8n"
echo ""
echo "   # Redémarrer N8N"
echo "   sudo -u $N8N_USER pm2 restart n8n"
echo ""
echo "   # Vérifier la version dans le panel"
echo "   Accédez à https://n8n.talosprimes.com"
echo "   Allez dans Settings > Version"
echo ""
echo "📝 Notes :"
echo ""
echo "   - Les sauvegardes sont dans: $BACKUP_DIR"
echo "   - Si quelque chose ne va pas, vous pouvez restaurer depuis les sauvegardes"
echo "   - Les workflows existants sont préservés dans $N8N_DIR/data"
echo ""
echo "⚠️  IMPORTANT :"
echo "   Vérifiez que N8N fonctionne correctement en accédant à:"
echo "   https://n8n.talosprimes.com"
echo ""
echo ""

