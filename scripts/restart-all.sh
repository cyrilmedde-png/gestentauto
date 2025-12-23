#!/bin/bash

# ============================================
# Script de redémarrage complet des services
# Redémarre N8N et l'application Next.js
# Usage: ./scripts/restart-all.sh
# ============================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
N8N_DIR="/var/n8n"
N8N_USER="n8n"
APP_DIR="/var/www/talosprime"
APP_NAME="talosprime"

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

# Vérifier que le script est exécuté en root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log_error "Ce script doit être exécuté avec sudo"
        echo "Usage: sudo bash scripts/restart-all.sh"
        exit 1
    fi
}

# Vérifier que PM2 est installé
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 n'est pas installé"
        exit 1
    fi
}

# Synchroniser les identifiants N8N entre les deux fichiers
sync_n8n_credentials() {
    log_info "🔄 Synchronisation des identifiants N8N..."
    
    if [ ! -f "$N8N_DIR/.env" ]; then
        log_warning "Fichier $N8N_DIR/.env introuvable, passage à l'étape suivante"
        return
    fi
    
    if [ ! -f "$APP_DIR/.env.production" ]; then
        log_warning "Fichier $APP_DIR/.env.production introuvable, passage à l'étape suivante"
        return
    fi
    
    # Extraire les identifiants du fichier N8N
    N8N_USER_VAL=$(grep "^N8N_BASIC_AUTH_USER=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    N8N_PASS_VAL=$(grep "^N8N_BASIC_AUTH_PASSWORD=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    
    if [ -z "$N8N_USER_VAL" ] || [ -z "$N8N_PASS_VAL" ]; then
        log_warning "Impossible d'extraire les identifiants N8N, passage à l'étape suivante"
        return
    fi
    
    # Mettre à jour le fichier .env.production
    cd "$APP_DIR"
    if grep -q "^N8N_BASIC_AUTH_USER=" .env.production; then
        sed -i "s|^N8N_BASIC_AUTH_USER=.*|N8N_BASIC_AUTH_USER=$N8N_USER_VAL|" .env.production
        log_success "N8N_BASIC_AUTH_USER synchronisé"
    else
        echo "N8N_BASIC_AUTH_USER=$N8N_USER_VAL" >> .env.production
        log_success "N8N_BASIC_AUTH_USER ajouté"
    fi
    
    if grep -q "^N8N_BASIC_AUTH_PASSWORD=" .env.production; then
        sed -i "s|^N8N_BASIC_AUTH_PASSWORD=.*|N8N_BASIC_AUTH_PASSWORD=$N8N_PASS_VAL|" .env.production
        log_success "N8N_BASIC_AUTH_PASSWORD synchronisé"
    else
        echo "N8N_BASIC_AUTH_PASSWORD=$N8N_PASS_VAL" >> .env.production
        log_success "N8N_BASIC_AUTH_PASSWORD ajouté"
    fi
    
    log_success "Synchronisation des identifiants terminée"
}

# Redémarrer N8N
restart_n8n() {
    log_info "🔄 Redémarrage de N8N..."
    
    # Vérifier que le répertoire N8N existe
    if [ ! -d "$N8N_DIR" ]; then
        log_warning "Répertoire N8N ($N8N_DIR) introuvable, N8N n'est peut-être pas installé"
        return
    fi
    
    # Arrêter et supprimer le processus PM2 existant
    if sudo -u "$N8N_USER" pm2 list | grep -q "n8n"; then
        log_info "Arrêt de N8N..."
        sudo -u "$N8N_USER" pm2 stop n8n 2>/dev/null || true
        sudo -u "$N8N_USER" pm2 delete n8n 2>/dev/null || true
    fi
    
    # Aller dans le répertoire N8N
    cd "$N8N_DIR" || {
        log_error "Impossible d'accéder au répertoire $N8N_DIR"
        return
    }
    
    # Vérifier que le fichier ecosystem.config.js existe
    if [ ! -f "ecosystem.config.js" ]; then
        log_warning "Fichier ecosystem.config.js introuvable, tentative de démarrage manuel..."
        sudo -u "$N8N_USER" pm2 start n8n --name "n8n" || {
            log_error "Impossible de démarrer N8N"
            return
        }
    else
        # Charger les variables d'environnement et démarrer
        log_info "Démarrage de N8N avec PM2..."
        sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
export \$(cat .env | grep -v '^#' | xargs)
pm2 start ecosystem.config.js
pm2 save
EOF
    fi
    
    # Attendre un peu pour que N8N démarre
    sleep 2
    
    # Vérifier le statut
    if sudo -u "$N8N_USER" pm2 list | grep -q "n8n.*online"; then
        log_success "N8N redémarré avec succès"
    else
        log_warning "N8N démarré mais le statut est incertain"
    fi
}

# Redémarrer l'application Next.js
restart_app() {
    log_info "🔄 Redémarrage de l'application Next.js..."
    
    # Vérifier que le répertoire de l'application existe
    if [ ! -d "$APP_DIR" ]; then
        log_error "Répertoire de l'application ($APP_DIR) introuvable"
        exit 1
    fi
    
    # Aller dans le répertoire de l'application
    cd "$APP_DIR" || {
        log_error "Impossible d'accéder au répertoire $APP_DIR"
        exit 1
    }
    
    # Arrêter et supprimer le processus PM2 existant
    if pm2 list | grep -q "$APP_NAME"; then
        log_info "Arrêt de l'application..."
        pm2 stop "$APP_NAME" 2>/dev/null || true
        pm2 delete "$APP_NAME" 2>/dev/null || true
    fi
    
    # Charger les variables d'environnement et démarrer
    log_info "Démarrage de l'application avec PM2..."
    export $(cat .env.production | grep -v '^#' | xargs)
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
    
    # Attendre un peu pour que l'application démarre
    sleep 3
    
    # Vérifier le statut
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log_success "Application redémarrée avec succès"
    else
        log_warning "Application démarrée mais le statut est incertain"
    fi
}

# Afficher le statut de tous les services
show_status() {
    echo ""
    log_info "📊 Statut des services:"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 N8N:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    sudo -u "$N8N_USER" pm2 status 2>/dev/null || log_warning "Impossible d'obtenir le statut N8N"
    echo ""
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Application Next.js:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    pm2 status
    echo ""
}

# Fonction principale
main() {
    echo ""
    log_info "🚀 Démarrage du redémarrage complet des services..."
    echo ""
    
    # Vérifications
    check_root
    check_pm2
    
    # Synchroniser les identifiants
    sync_n8n_credentials
    
    # Redémarrer les services
    restart_n8n
    echo ""
    restart_app
    echo ""
    
    # Afficher le statut
    show_status
    
    log_success "✅ Redémarrage complet terminé!"
    echo ""
    log_info "💡 Commandes utiles:"
    echo "   - Voir les logs N8N: sudo -u $N8N_USER pm2 logs n8n"
    echo "   - Voir les logs App: pm2 logs $APP_NAME"
    echo "   - Voir le statut: pm2 status"
    echo ""
}

# Exécuter la fonction principale
main

