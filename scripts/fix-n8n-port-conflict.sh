#!/bin/bash

# Script pour résoudre le conflit de port N8N
# Arrête les instances en double et redémarre proprement N8N

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
N8N_DIR="/var/n8n"
N8N_USER="n8n"
N8N_PORT=5678

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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
# 1. IDENTIFICATION DES INSTANCES
# ============================================
log_section "1. IDENTIFICATION DES INSTANCES N8N"

log_info "Processus N8N actifs:"
N8N_PROCESSES=$(ps aux | grep -i "node.*n8n" | grep -v grep || true)
if [ -n "$N8N_PROCESSES" ]; then
    echo "$N8N_PROCESSES"
    N8N_COUNT=$(echo "$N8N_PROCESSES" | wc -l)
    log_warning "Nombre d'instances N8N détectées: $N8N_COUNT"
else
    log_info "Aucune instance N8N trouvée"
fi

log_info "Vérification du port $N8N_PORT:"
if command_exists lsof; then
    PORT_USERS=$(lsof -i :$N8N_PORT 2>/dev/null | grep -v COMMAND || true)
    if [ -n "$PORT_USERS" ]; then
        log_warning "Port $N8N_PORT utilisé par:"
        echo "$PORT_USERS"
    else
        log_success "Port $N8N_PORT libre"
    fi
elif command_exists ss; then
    PORT_USERS=$(ss -tlnp | grep ":$N8N_PORT " || true)
    if [ -n "$PORT_USERS" ]; then
        log_warning "Port $N8N_PORT utilisé:"
        echo "$PORT_USERS"
    else
        log_success "Port $N8N_PORT libre"
    fi
fi

# ============================================
# 2. ARRÊT DES INSTANCES EN DOUBLE
# ============================================
log_section "2. ARRÊT DES INSTANCES EN DOUBLE"

# Arrêter l'instance PM2 (root)
log_info "Arrêt de l'instance PM2 (root)..."
if pm2 list 2>/dev/null | grep -q "n8n.*online"; then
    pm2 stop n8n 2>/dev/null || true
    pm2 delete n8n 2>/dev/null || true
    log_success "Instance PM2 (root) arrêtée"
else
    log_info "Aucune instance PM2 (root) à arrêter"
fi

# Arrêter l'instance PM2 (n8n user)
log_info "Arrêt de l'instance PM2 (utilisateur n8n)..."
if sudo -u "$N8N_USER" pm2 list 2>/dev/null | grep -q "n8n.*online"; then
    sudo -u "$N8N_USER" pm2 stop n8n 2>/dev/null || true
    sudo -u "$N8N_USER" pm2 delete n8n 2>/dev/null || true
    log_success "Instance PM2 (n8n) arrêtée"
else
    log_info "Aucune instance PM2 (n8n) à arrêter"
fi

# Arrêter l'instance cursor (plus agressif - arrêter tous les processus cursor liés à n8n)
log_info "Arrêt de l'instance cursor..."
CURSOR_PIDS=$(ps aux | grep -i "cursor.*n8n\|n8n.*cursor" | grep -v grep | awk '{print $2}' || true)
if [ -n "$CURSOR_PIDS" ]; then
    log_info "Processus cursor N8N trouvés: $CURSOR_PIDS"
    for pid in $CURSOR_PIDS; do
        log_info "Arrêt du processus cursor N8N (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null || true
    done
    sleep 3
    # Tuer les processus qui n'ont pas répondu
    for pid in $CURSOR_PIDS; do
        if ps -p "$pid" > /dev/null 2>&1; then
            log_warning "Processus $pid toujours actif, kill forcé..."
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    # Vérifier si PM2 cursor gère N8N
    if [ -d "/home/cursor/.pm2" ]; then
        log_info "Arrêt de N8N dans PM2 cursor..."
        sudo -u cursor pm2 stop n8n 2>/dev/null || true
        sudo -u cursor pm2 delete n8n 2>/dev/null || true
    fi
    
    sleep 2
    log_success "Instance cursor arrêtée"
else
    log_info "Aucune instance cursor à arrêter"
fi

# Arrêter les processus N8N orphelins
log_info "Arrêt des processus N8N orphelins..."
ORPHAN_PIDS=$(ps aux | grep -i "node.*n8n" | grep -v grep | grep -v "cursor\|pm2" | awk '{print $2}' || true)
if [ -n "$ORPHAN_PIDS" ]; then
    for pid in $ORPHAN_PIDS; do
        log_info "Arrêt du processus N8N orphelin (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null || true
    done
    sleep 2
    for pid in $ORPHAN_PIDS; do
        if ps -p "$pid" > /dev/null 2>&1; then
            log_warning "Processus $pid toujours actif, kill forcé..."
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    log_success "Processus orphelins arrêtés"
else
    log_info "Aucun processus orphelin trouvé"
fi

# Attendre que le port soit libéré
log_info "Attente de libération du port $N8N_PORT..."
for i in {1..10}; do
    if command_exists lsof; then
        if ! lsof -i :$N8N_PORT >/dev/null 2>&1; then
            log_success "Port $N8N_PORT libéré"
            break
        fi
    elif command_exists ss; then
        if ! ss -tlnp | grep -q ":$N8N_PORT "; then
            log_success "Port $N8N_PORT libéré"
            break
        fi
    fi
    sleep 1
done

# Vérifier si le port est toujours utilisé (Docker)
if command_exists lsof; then
    DOCKER_PROCESS=$(lsof -i :$N8N_PORT 2>/dev/null | grep docker || true)
    if [ -n "$DOCKER_PROCESS" ]; then
        log_warning "⚠️  Le port $N8N_PORT est toujours utilisé par Docker"
        log_info "Vérification des conteneurs Docker..."
        if command_exists docker; then
            docker ps | grep -i n8n || log_info "Aucun conteneur N8N trouvé"
            log_warning "Options:"
            log_warning "  1. Arrêter le conteneur Docker N8N: docker stop <container_id>"
            log_warning "  2. Changer le port N8N dans .env: N8N_PORT=<autre_port>"
        fi
    fi
fi

# ============================================
# 3. NETTOYAGE PM2
# ============================================
log_section "3. NETTOYAGE PM2"

log_info "Nettoyage des processus PM2 N8N..."
pm2 delete n8n 2>/dev/null || true
sudo -u "$N8N_USER" pm2 delete n8n 2>/dev/null || true
log_success "PM2 nettoyé"

# ============================================
# 4. VÉRIFICATION FINALE
# ============================================
log_section "4. VÉRIFICATION FINALE"

log_info "Processus N8N restants:"
REMAINING=$(ps aux | grep -i "node.*n8n" | grep -v grep | grep -v "pm2 logs" || true)
if [ -n "$REMAINING" ]; then
    log_warning "Processus N8N encore actifs:"
    echo "$REMAINING"
    
    # Essayer d'arrêter les processus cursor restants
    CURSOR_REMAINING=$(echo "$REMAINING" | grep cursor | awk '{print $2}' || true)
    if [ -n "$CURSOR_REMAINING" ]; then
        log_warning "Arrêt forcé des processus cursor restants..."
        for pid in $CURSOR_REMAINING; do
            kill -9 "$pid" 2>/dev/null || true
        done
        sleep 2
        log_info "Vérification après arrêt forcé..."
        REMAINING_AFTER=$(ps aux | grep -i "node.*n8n" | grep -v grep | grep -v "pm2 logs" || true)
        if [ -n "$REMAINING_AFTER" ]; then
            log_warning "Processus toujours actifs après arrêt forcé:"
            echo "$REMAINING_AFTER"
            log_warning "Ces processus doivent être arrêtés manuellement"
        else
            log_success "Tous les processus ont été arrêtés"
        fi
    else
        log_warning "Ces processus doivent être arrêtés manuellement"
    fi
else
    log_success "Aucun processus N8N restant"
fi

log_info "Port $N8N_PORT:"
if command_exists lsof; then
    PORT_STATUS=$(lsof -i :$N8N_PORT 2>/dev/null || true)
    if [ -n "$PORT_STATUS" ]; then
        log_warning "Port toujours utilisé:"
        echo "$PORT_STATUS"
    else
        log_success "Port $N8N_PORT libre"
    fi
fi

# ============================================
# 5. REDÉMARRAGE PROPRE
# ============================================
log_section "5. REDÉMARRAGE PROPRE DE N8N"

read -p "Voulez-vous redémarrer N8N maintenant ? (o/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Oo]$ ]]; then
    log_info "Redémarrage de N8N via PM2..."
    
    # Vérifier que le port est libre
    if command_exists lsof; then
        if lsof -i :$N8N_PORT >/dev/null 2>&1; then
            log_error "Le port $N8N_PORT est toujours utilisé. Impossible de démarrer N8N."
            log_info "Arrêtez d'abord le processus qui utilise le port, puis relancez ce script."
            exit 1
        fi
    fi
    
    # Démarrer N8N
    cd "$N8N_DIR" || exit 1
    pm2 start n8n --name n8n || sudo -u "$N8N_USER" pm2 start n8n --name n8n || {
        log_error "Impossible de démarrer N8N"
        exit 1
    }
    
    sleep 3
    
    # Vérifier le statut
    if pm2 list | grep -q "n8n.*online"; then
        log_success "N8N démarré avec succès"
        pm2 list | grep n8n
    else
        log_error "N8N n'a pas démarré correctement"
        log_info "Vérifiez les logs: pm2 logs n8n"
        exit 1
    fi
else
    log_info "Redémarrage annulé"
    log_info "Pour redémarrer manuellement:"
    log_info "  cd $N8N_DIR"
    log_info "  pm2 start n8n --name n8n"
fi

log_success "Script terminé"
echo ""

