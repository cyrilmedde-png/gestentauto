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
# Détection automatique du répertoire N8N
N8N_DIR=""
N8N_USER=""
BACKUP_DIR="/var/backups/n8n"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Détecter où N8N est installé
detect_n8n_installation() {
    log_info "🔍 Détection de l'installation N8N..."
    
    # Méthode 1: Vérifier si un utilisateur n8n existe et a un répertoire
    if id "n8n" &>/dev/null; then
        N8N_USER="n8n"
        if [ -d "/var/n8n" ]; then
            N8N_DIR="/var/n8n"
            log_success "N8N trouvé: /var/n8n (utilisateur n8n)"
            return 0
        fi
    fi
    
    # Méthode 2: Vérifier le répertoire home de l'utilisateur actuel
    CURRENT_USER_HOME=$(eval echo ~$USER)
    if [ -d "$CURRENT_USER_HOME/.n8n" ]; then
        N8N_DIR="$CURRENT_USER_HOME/.n8n"
        N8N_USER="$USER"
        log_success "N8N trouvé: $N8N_DIR (utilisateur $USER)"
        return 0
    fi
    
    # Méthode 3: Vérifier le répertoire root
    if [ -d "/root/.n8n" ]; then
        N8N_DIR="/root/.n8n"
        N8N_USER="root"
        log_success "N8N trouvé: $N8N_DIR (utilisateur root)"
        return 0
    fi
    
    # Méthode 4: Vérifier via PM2
    if command -v pm2 &> /dev/null; then
        PM2_N8N_INFO=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | {cwd: .pm2_env.cwd, user: .pm2_env.user}' 2>/dev/null || echo "")
        if [ -n "$PM2_N8N_INFO" ]; then
            PM2_CWD=$(echo "$PM2_N8N_INFO" | jq -r '.cwd' 2>/dev/null || echo "")
            PM2_USER=$(echo "$PM2_N8N_INFO" | jq -r '.user' 2>/dev/null || echo "")
            if [ -n "$PM2_CWD" ] && [ -d "$PM2_CWD" ]; then
                N8N_DIR="$PM2_CWD"
                N8N_USER="${PM2_USER:-root}"
                log_success "N8N trouvé via PM2: $N8N_DIR (utilisateur $N8N_USER)"
                return 0
            fi
        fi
    fi
    
    # Méthode 5: Vérifier où n8n est installé globalement
    if command -v n8n &> /dev/null; then
        N8N_CMD=$(which n8n)
        # Chercher le répertoire node_modules parent
        N8N_NODE_MODULES=$(dirname "$N8N_CMD" | sed 's|/\.bin||' | sed 's|/bin||')
        if [ -d "$N8N_NODE_MODULES" ]; then
            # Remonter jusqu'à trouver un répertoire .n8n ou créer un chemin par défaut
            N8N_DIR="${HOME}/.n8n"
            N8N_USER="${USER:-root}"
            log_warning "N8N trouvé globalement, utilisation du répertoire par défaut: $N8N_DIR"
            return 0
        fi
    fi
    
    log_error "N8N non trouvé"
    return 1
}

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

# Détecter l'installation N8N
if ! detect_n8n_installation; then
    log_error "N8N n'est pas installé ou n'a pas pu être détecté"
    echo ""
    echo "💡 Options:"
    echo "   1. Installer N8N avec: sudo bash scripts/install-n8n.sh"
    echo "   2. Installer N8N globalement: npm install -g n8n"
    echo "   3. Vérifier que N8N est en cours d'exécution: pm2 list | grep n8n"
    exit 1
fi

# Créer le répertoire s'il n'existe pas
if [ ! -d "$N8N_DIR" ]; then
    log_warning "Le répertoire $N8N_DIR n'existe pas, création..."
    mkdir -p "$N8N_DIR"
    if [ "$N8N_USER" != "$USER" ] && [ "$N8N_USER" != "root" ]; then
        chown -R "$N8N_USER:$N8N_USER" "$N8N_DIR" 2>/dev/null || true
    fi
    log_success "Répertoire créé: $N8N_DIR"
fi

# Vérifier que PM2 est installé
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 n'est pas installé"
    exit 1
fi

# Vérifier que N8N est en cours d'exécution
if [ "$N8N_USER" = "root" ]; then
    PM2_CHECK_CMD="pm2 describe n8n"
else
    PM2_CHECK_CMD="sudo -u $N8N_USER pm2 describe n8n"
fi

if ! eval "$PM2_CHECK_CMD" &>/dev/null; then
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
if [ "$N8N_USER" = "root" ]; then
    CURRENT_VERSION=$(bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")
else
    CURRENT_VERSION=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")
fi

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
    if [ "$N8N_USER" = "root" ]; then
        tar -czf "$BACKUP_DIR/n8n-data-backup.$TIMESTAMP.tar.gz" -C "$N8N_DIR" data 2>/dev/null || {
            log_warning "Impossible de sauvegarder les données (peut être normal si le dossier data est vide)"
        }
    else
        sudo -u "$N8N_USER" tar -czf "$BACKUP_DIR/n8n-data-backup.$TIMESTAMP.tar.gz" -C "$N8N_DIR" data 2>/dev/null || {
            log_warning "Impossible de sauvegarder les données (peut être normal si le dossier data est vide)"
        }
    fi
    log_success "Données sauvegardées"
fi

log_success "Sauvegarde terminée dans $BACKUP_DIR"

# ============================================
# ARRÊT DE N8N
# ============================================
echo ""
log_info "⏸️  Arrêt de N8N..."
echo ""

if [ "$N8N_USER" = "root" ]; then
    if pm2 describe n8n &>/dev/null; then
        pm2 stop n8n
        sleep 2
        log_success "N8N arrêté"
    else
        log_warning "N8N n'était pas en cours d'exécution"
    fi
else
    if sudo -u "$N8N_USER" pm2 describe n8n &>/dev/null; then
        sudo -u "$N8N_USER" pm2 stop n8n
        sleep 2
        log_success "N8N arrêté"
    else
        log_warning "N8N n'était pas en cours d'exécution"
    fi
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

# Mettre à jour localement
log_info "Mise à jour locale de N8N dans $N8N_DIR..."

# Créer package.json s'il n'existe pas
if [ ! -f "$N8N_DIR/package.json" ]; then
    log_info "Création de package.json..."
    if [ "$N8N_USER" = "root" ]; then
        cat > "$N8N_DIR/package.json" <<EOF
{
  "name": "n8n-instance",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
EOF
    else
        sudo -u "$N8N_USER" bash -c "cat > $N8N_DIR/package.json <<'EOF'
{
  \"name\": \"n8n-instance\",
  \"version\": \"1.0.0\",
  \"private\": true,
  \"dependencies\": {}
}
EOF"
    fi
fi

if [ "$N8N_USER" = "root" ]; then
    bash <<EOF
cd $N8N_DIR
npm install "n8n@$TARGET_VERSION" --save --save-exact || {
    echo "Erreur lors de l'installation locale"
    exit 1
}
EOF
else
    sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
npm install "n8n@$TARGET_VERSION" --save --save-exact || {
    echo "Erreur lors de l'installation locale"
    exit 1
}
EOF
fi

# Vérifier la version locale
if [ "$N8N_USER" = "root" ]; then
    LOCAL_VERSION=$(bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "")
else
    LOCAL_VERSION=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "")
fi
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
if [ "$N8N_USER" = "root" ]; then
    bash <<EOF
cd $N8N_DIR
export \$(cat .env 2>/dev/null | grep -v '^#' | xargs 2>/dev/null || true)
pm2 restart ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null || pm2 restart n8n 2>/dev/null || pm2 start n8n 2>/dev/null
pm2 save
EOF
else
    sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
export \$(cat .env 2>/dev/null | grep -v '^#' | xargs 2>/dev/null || true)
pm2 restart ecosystem.config.js 2>/dev/null || pm2 start ecosystem.config.js 2>/dev/null || pm2 restart n8n 2>/dev/null || pm2 start n8n 2>/dev/null
pm2 save
EOF
fi

sleep 3

# Vérifier le statut
if [ "$N8N_USER" = "root" ]; then
    if pm2 describe n8n &>/dev/null; then
        STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "online" ]; then
            log_success "N8N redémarré avec succès (statut: $STATUS)"
        else
            log_warning "N8N redémarré mais statut: $STATUS"
        fi
    else
        log_error "N8N n'a pas pu être redémarré"
        exit 1
    fi
else
    if sudo -u "$N8N_USER" pm2 describe n8n &>/dev/null; then
        STATUS=$(sudo -u "$N8N_USER" pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="n8n") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "online" ]; then
            log_success "N8N redémarré avec succès (statut: $STATUS)"
        else
            log_warning "N8N redémarré mais statut: $STATUS"
        fi
    else
        log_error "N8N n'a pas pu être redémarré"
        exit 1
    fi
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
if [ "$N8N_USER" = "root" ]; then
    LOCAL_VERSION_CHECK=$(bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")
else
    LOCAL_VERSION_CHECK=$(sudo -u "$N8N_USER" bash -c "cd $N8N_DIR && npm list n8n 2>/dev/null | grep n8n@ | sed 's/.*@//' | head -1" || echo "inconnue")
fi
log_info "Version locale: $LOCAL_VERSION_CHECK"

# Vérifier les logs pour les erreurs
log_info "Vérification des logs (5 dernières lignes)..."
if [ "$N8N_USER" = "root" ]; then
    pm2 logs n8n --lines 5 --nostream 2>/dev/null || true
else
    sudo -u "$N8N_USER" pm2 logs n8n --lines 5 --nostream 2>/dev/null || true
fi

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
if [ "$N8N_USER" = "root" ]; then
    echo "   pm2 status"
else
    echo "   sudo -u $N8N_USER pm2 status"
fi
echo ""
echo "   # Voir les logs N8N"
if [ "$N8N_USER" = "root" ]; then
    echo "   pm2 logs n8n"
else
    echo "   sudo -u $N8N_USER pm2 logs n8n"
fi
echo ""
echo "   # Redémarrer N8N"
if [ "$N8N_USER" = "root" ]; then
    echo "   pm2 restart n8n"
else
    echo "   sudo -u $N8N_USER pm2 restart n8n"
fi
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

