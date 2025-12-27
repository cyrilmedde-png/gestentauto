#!/bin/bash

# Script pour supprimer proprement le compte cursor et ses processus
# ⚠️  ATTENTION: Cette action est irréversible

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
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

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ============================================
# 1. VÉRIFICATION PRÉALABLE
# ============================================
log_section "1. VÉRIFICATION PRÉALABLE"

log_info "Vérification de l'existence du compte cursor..."
if id "cursor" &>/dev/null; then
    log_warning "Le compte cursor existe"
    log_info "Informations du compte:"
    id cursor
    log_info "Répertoire home:"
    ls -la /home/cursor 2>/dev/null | head -10 || log_warning "Répertoire /home/cursor introuvable"
else
    log_info "Le compte cursor n'existe pas"
    exit 0
fi

# ============================================
# 2. ARRÊT DES PROCESSUS CURSOR
# ============================================
log_section "2. ARRÊT DES PROCESSUS CURSOR"

log_info "Recherche des processus cursor..."
CURSOR_PROCESSES=$(ps aux | grep "^cursor" | grep -v grep || true)
if [ -n "$CURSOR_PROCESSES" ]; then
    log_warning "Processus cursor trouvés:"
    echo "$CURSOR_PROCESSES"
    
    # Arrêter PM2 cursor
    log_info "Arrêt de PM2 cursor..."
    sudo -u cursor pm2 kill 2>/dev/null || true
    sudo -u cursor pm2 stop all 2>/dev/null || true
    sudo -u cursor pm2 delete all 2>/dev/null || true
    
    # Désactiver le démarrage automatique PM2 cursor
    log_info "Désactivation du démarrage automatique PM2 cursor..."
    sudo -u cursor pm2 unstartup 2>/dev/null || true
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 unstartup systemd -u cursor --hp /home/cursor 2>/dev/null || true
    
    # Tuer tous les processus cursor
    log_info "Arrêt de tous les processus cursor..."
    pkill -9 -u cursor 2>/dev/null || true
    sleep 2
    
    log_success "Processus cursor arrêtés"
else
    log_info "Aucun processus cursor actif"
fi

# ============================================
# 3. SUPPRESSION DU COMPTE CURSOR
# ============================================
log_section "3. SUPPRESSION DU COMPTE CURSOR"

log_warning "⚠️  ATTENTION: Cette action va supprimer définitivement le compte cursor"
log_warning "Les fichiers dans /home/cursor seront supprimés"
read -p "Confirmer la suppression du compte cursor ? (tapez 'SUPPRIMER' pour confirmer): " -r
echo

if [ "$REPLY" != "SUPPRIMER" ]; then
    log_info "Suppression annulée"
    exit 0
fi

log_info "Suppression du compte cursor..."

# Supprimer le compte et son répertoire home
if userdel -r cursor 2>/dev/null; then
    log_success "Compte cursor supprimé avec succès"
else
    log_error "Erreur lors de la suppression du compte cursor"
    log_info "Tentative de suppression manuelle..."
    
    # Supprimer manuellement si userdel échoue
    if [ -d "/home/cursor" ]; then
        log_info "Suppression du répertoire /home/cursor..."
        rm -rf /home/cursor
        log_success "Répertoire /home/cursor supprimé"
    fi
    
    # Supprimer les entrées dans /etc/passwd et /etc/shadow
    if grep -q "^cursor:" /etc/passwd; then
        log_info "Suppression de l'entrée dans /etc/passwd..."
        sed -i '/^cursor:/d' /etc/passwd
        log_success "Entrée supprimée de /etc/passwd"
    fi
    
    if grep -q "^cursor:" /etc/shadow; then
        log_info "Suppression de l'entrée dans /etc/shadow..."
        sed -i '/^cursor:/d' /etc/shadow
        log_success "Entrée supprimée de /etc/shadow"
    fi
    
    if grep -q "^cursor:" /etc/group; then
        log_info "Suppression de l'entrée dans /etc/group..."
        sed -i '/^cursor:/d' /etc/group
        log_success "Entrée supprimée de /etc/group"
    fi
fi

# Vérifier que le compte est bien supprimé
if id "cursor" &>/dev/null; then
    log_error "Le compte cursor existe toujours"
    exit 1
else
    log_success "Compte cursor supprimé avec succès"
fi

# ============================================
# 4. NETTOYAGE FINAL
# ============================================
log_section "4. NETTOYAGE FINAL"

log_info "Vérification des processus cursor restants..."
REMAINING=$(ps aux | grep "^cursor" | grep -v grep || true)
if [ -n "$REMAINING" ]; then
    log_warning "Processus cursor encore actifs (devraient se terminer automatiquement):"
    echo "$REMAINING"
else
    log_success "Aucun processus cursor restant"
fi

log_info "Vérification des fichiers cursor restants..."
if [ -d "/home/cursor" ]; then
    log_warning "Le répertoire /home/cursor existe toujours"
    read -p "Supprimer manuellement /home/cursor ? (o/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        rm -rf /home/cursor
        log_success "Répertoire /home/cursor supprimé"
    fi
else
    log_success "Répertoire /home/cursor supprimé"
fi

log_success "Nettoyage terminé"
echo ""




