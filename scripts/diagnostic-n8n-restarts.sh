#!/bin/bash

# Script de diagnostic approfondi pour identifier pourquoi N8N redémarre constamment
# À exécuter quand N8N a beaucoup de redémarrages mais pas de logs d'erreur

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
# 1. VÉRIFICATION MÉMOIRE (OOM Killer)
# ============================================
log_section "1. VÉRIFICATION MÉMOIRE (OOM Killer)"

log_info "Mémoire disponible:"
free -h

log_info "Vérification des messages OOM dans dmesg:"
if dmesg 2>/dev/null | grep -i "out of memory\|oom" | tail -20 | grep -q .; then
    log_error "⚠️  Messages OOM trouvés - N8N peut être tué par le OOM killer"
    dmesg 2>/dev/null | grep -i "out of memory\|oom" | tail -20
else
    log_success "Aucun message OOM trouvé"
fi

log_info "Utilisation mémoire par processus:"
ps aux --sort=-%mem | head -10

# ============================================
# 2. LOGS PM2 STDOUT (peut contenir les erreurs)
# ============================================
log_section "2. LOGS PM2 STDOUT (dernières 100 lignes)"

log_info "Récupération des logs stdout..."
if pm2 logs n8n --out --lines 100 --nostream 2>/dev/null | grep -q .; then
    pm2 logs n8n --out --lines 100 --nostream 2>/dev/null | tail -50
else
    log_warning "Aucun log stdout disponible"
fi

# ============================================
# 3. FICHIERS DE LOGS DIRECTS
# ============================================
log_section "3. FICHIERS DE LOGS DIRECTS"

if [ -d "$N8N_DIR/logs" ]; then
    log_info "Fichiers de logs disponibles:"
    ls -lah "$N8N_DIR/logs/" || true
    
    if [ -f "$N8N_DIR/logs/pm2-out.log" ]; then
        log_info "Contenu de pm2-out.log (dernières 100 lignes):"
        if [ -s "$N8N_DIR/logs/pm2-out.log" ]; then
            tail -100 "$N8N_DIR/logs/pm2-out.log" | grep -i "error\|fail\|exception\|crash\|fatal\|warning" || tail -50 "$N8N_DIR/logs/pm2-out.log"
        else
            log_warning "Fichier pm2-out.log existe mais est vide"
        fi
    fi
    
    if [ -f "$N8N_DIR/logs/pm2-error.log" ]; then
        log_info "Contenu de pm2-error.log (dernières 100 lignes):"
        if [ -s "$N8N_DIR/logs/pm2-error.log" ]; then
            tail -100 "$N8N_DIR/logs/pm2-error.log"
        else
            log_warning "Fichier pm2-error.log existe mais est vide"
        fi
    fi
    
    # IMPORTANT: Analyser le fichier n8n.log (logs N8N natifs)
    if [ -f "$N8N_DIR/logs/n8n.log" ]; then
        log_info "Analyse du fichier n8n.log (logs N8N natifs - $(du -h "$N8N_DIR/logs/n8n.log" | cut -f1)):"
        if [ -s "$N8N_DIR/logs/n8n.log" ]; then
            log_info "Dernières erreurs dans n8n.log:"
            tail -200 "$N8N_DIR/logs/n8n.log" | grep -i "error\|fail\|exception\|crash\|fatal\|uncaught" | tail -30 || log_info "Aucune erreur trouvée dans les dernières lignes"
            
            log_info "Dernières lignes de n8n.log (pour contexte):"
            tail -50 "$N8N_DIR/logs/n8n.log" || true
        else
            log_warning "Fichier n8n.log existe mais est vide"
        fi
    fi
    
    # Chercher d'autres fichiers de logs
    log_info "Autres fichiers de logs N8N:"
    find "$N8N_DIR/logs" -type f -name "*.log" 2>/dev/null | head -10 || true
else
    log_error "Répertoire de logs introuvable: $N8N_DIR/logs"
fi

# ============================================
# 4. CONFIGURATION PM2
# ============================================
log_section "4. CONFIGURATION PM2"

log_info "Informations détaillées PM2 pour N8N:"
pm2 show n8n 2>/dev/null || sudo -u "$N8N_USER" pm2 show n8n 2>/dev/null || log_error "Impossible d'obtenir les infos PM2"

log_info "Statut PM2:"
pm2 list | grep n8n || sudo -u "$N8N_USER" pm2 list | grep n8n || true

# ============================================
# 5. VARIABLES D'ENVIRONNEMENT N8N
# ============================================
log_section "5. VARIABLES D'ENVIRONNEMENT N8N"

if [ -f "$N8N_DIR/.env" ]; then
    log_info "Variables d'environnement (masquage des secrets):"
    grep -v "PASSWORD\|SECRET\|KEY\|TOKEN" "$N8N_DIR/.env" | head -30 || true
    log_info "Nombre total de variables: $(wc -l < "$N8N_DIR/.env")"
else
    log_error "Fichier .env introuvable: $N8N_DIR/.env"
fi

# ============================================
# 6. VÉRIFICATION DES PORTS
# ============================================
log_section "6. VÉRIFICATION DES PORTS"

log_info "Ports en écoute (recherche 5678):"
if command_exists ss; then
    ss -tlnp | grep 5678 || log_warning "Port 5678 non trouvé"
elif command_exists netstat; then
    netstat -tlnp | grep 5678 || log_warning "Port 5678 non trouvé"
else
    log_warning "ss et netstat non disponibles"
fi

log_info "Processus utilisant le port 5678:"
lsof -i :5678 2>/dev/null || log_info "lsof non disponible ou port non utilisé"

# ============================================
# 7. VÉRIFICATION DES PERMISSIONS
# ============================================
log_section "7. VÉRIFICATION DES PERMISSIONS"

log_info "Permissions du répertoire N8N:"
ls -la "$N8N_DIR" | head -20 || true

log_info "Permissions des fichiers de logs:"
ls -la "$N8N_DIR/logs/" 2>/dev/null | head -10 || true

log_info "Propriétaire des fichiers:"
stat -c "%U:%G %n" "$N8N_DIR" 2>/dev/null || stat -f "%Su:%Sg %N" "$N8N_DIR" 2>/dev/null || true

# ============================================
# 8. PROCESSUS N8N
# ============================================
log_section "8. PROCESSUS N8N"

log_info "Processus N8N en cours:"
N8N_PROCESSES=$(ps aux | grep -i n8n | grep -v grep || true)
if [ -n "$N8N_PROCESSES" ]; then
    echo "$N8N_PROCESSES"
    N8N_COUNT=$(echo "$N8N_PROCESSES" | wc -l)
    if [ "$N8N_COUNT" -gt 3 ]; then
        log_error "⚠️  ATTENTION: Plusieurs instances de N8N détectées ($N8N_COUNT processus)"
        log_warning "Cela peut causer des conflits de port et des redémarrages"
        log_info "Instances détectées:"
        echo "$N8N_PROCESSES" | grep -E "node.*n8n|PM2.*n8n" || true
    fi
else
    log_warning "Aucun processus N8N trouvé"
fi

log_info "Processus Node.js:"
ps aux | grep -i node | grep -v grep | head -10 || true

# ============================================
# 9. LOGS SYSTÈME (journalctl)
# ============================================
log_section "9. LOGS SYSTÈME (journalctl)"

if command_exists journalctl; then
    log_info "Dernières entrées système pour N8N:"
    journalctl | grep -i n8n 2>/dev/null | tail -30 || log_info "Aucune entrée système pour N8N"
    
    log_info "Dernières erreurs système:"
    journalctl -p err -n 50 --no-pager 2>/dev/null | grep -i n8n || log_info "Aucune erreur système liée à N8N"
else
    log_warning "journalctl non disponible"
fi

# ============================================
# 10. TEST DE DÉMARRAGE MANUEL
# ============================================
log_section "10. TEST DE DÉMARRAGE MANUEL"

log_info "⚠️  Cette section va arrêter N8N dans PM2 et essayer de le démarrer manuellement"
log_warning "N8N sera temporairement indisponible pendant ce test"
read -p "Continuer ? (o/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Oo]$ ]]; then
    log_info "Arrêt de N8N dans PM2..."
    pm2 stop n8n 2>/dev/null || sudo -u "$N8N_USER" pm2 stop n8n 2>/dev/null || true
    
    log_info "Attente de 2 secondes..."
    sleep 2
    
    log_info "Tentative de démarrage manuel de N8N..."
    log_info "Les erreurs devraient apparaître ci-dessous:"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    cd "$N8N_DIR" || exit 1
    log_info "Démarrage avec timeout de 30 secondes (N8N peut prendre du temps à démarrer)..."
    timeout 30 n8n start 2>&1 || {
        EXIT_CODE=$?
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        if [ "$EXIT_CODE" -eq 124 ]; then
            log_warning "N8N a pris plus de 30 secondes à démarrer (timeout)"
            log_info "Cela peut être normal si N8N charge beaucoup de données"
            log_info "Vérifiez les logs ci-dessus pour voir s'il y a des erreurs avant le timeout"
        else
            log_error "N8N s'est arrêté avec le code: $EXIT_CODE"
            log_info "Les messages ci-dessus devraient indiquer la cause"
        fi
    }
    
    log_info "Redémarrage de N8N dans PM2..."
    pm2 start n8n --name n8n 2>/dev/null || sudo -u "$N8N_USER" pm2 start n8n --name n8n 2>/dev/null || true
    sleep 2
    pm2 list | grep n8n || true
else
    log_info "Test de démarrage manuel annulé"
fi

# ============================================
# 11. VÉRIFICATION BASE DE DONNÉES
# ============================================
log_section "11. VÉRIFICATION BASE DE DONNÉES"

if [ -f "$N8N_DIR/.env" ]; then
    DB_TYPE=$(grep "^DB_TYPE=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_HOST=$(grep "^DB_HOST=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_PORT=$(grep "^DB_PORT=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    DB_DATABASE=$(grep "^DB_DATABASE=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'" || echo "")
    
    if [ -n "$DB_TYPE" ]; then
        log_info "Type de base de données: $DB_TYPE"
        log_info "Host: $DB_HOST"
        log_info "Port: $DB_PORT"
        log_info "Database: $DB_DATABASE"
        
        # Tester la connexion si PostgreSQL
        if [ "$DB_TYPE" = "postgresdb" ] && command_exists psql; then
            log_info "Test de connexion à la base de données..."
            # Note: nécessite les credentials dans .env
            log_warning "Pour tester manuellement: psql -h $DB_HOST -p ${DB_PORT:-5432} -U [USER] -d $DB_DATABASE"
        fi
    else
        log_info "N8N utilise probablement SQLite (base de données par défaut)"
        if [ -f "$N8N_DIR/data/database.sqlite" ]; then
            log_info "Fichier SQLite trouvé: $N8N_DIR/data/database.sqlite"
            ls -lah "$N8N_DIR/data/database.sqlite" || true
        fi
    fi
fi

# ============================================
# 12. RÉSUMÉ ET RECOMMANDATIONS
# ============================================
log_section "12. RÉSUMÉ ET RECOMMANDATIONS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RÉSUMÉ DU DIAGNOSTIC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Vérifier les causes probables
ISSUES_FOUND=0

# Vérifier les instances multiples
N8N_PROCESS_COUNT=$(ps aux | grep -i "node.*n8n" | grep -v grep | wc -l)
if [ "$N8N_PROCESS_COUNT" -gt 1 ]; then
    ((ISSUES_FOUND++))
    log_error "⚠️  PROBLÈME CRITIQUE: Plusieurs instances N8N détectées ($N8N_PROCESS_COUNT)"
    log_warning "Cela cause des conflits de port et des redémarrages constants"
    log_info "Arrêtez les instances en double avant de redémarrer PM2"
fi

if dmesg 2>/dev/null | grep -i "out of memory\|oom" | grep -q n8n; then
    ((ISSUES_FOUND++))
    log_error "Problème de mémoire détecté (OOM killer)"
fi

if [ -f "$N8N_DIR/.env" ] && ! grep -q "^N8N_PORT=" "$N8N_DIR/.env" 2>/dev/null; then
    log_info "Port N8N non configuré explicitement (utilise le défaut 5678)"
fi

if [ ! -d "$N8N_DIR/data" ]; then
    ((ISSUES_FOUND++))
    log_error "Répertoire data manquant"
fi

if [ ! -w "$N8N_DIR" ]; then
    ((ISSUES_FOUND++))
    log_error "Permissions d'écriture manquantes sur $N8N_DIR"
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    log_success "Aucun problème évident détecté"
    log_info "Le problème peut être lié à:"
    log_info "  - Configuration de la base de données"
    log_info "  - Variables d'environnement manquantes ou incorrectes"
    log_info "  - Problème réseau (connexion à la base de données)"
    log_info "  - Problème de dépendances Node.js"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ACTIONS RECOMMANDÉES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. Si plusieurs instances N8N détectées:"
echo "   - Arrêter toutes les instances: pkill -f 'node.*n8n'"
echo "   - Vérifier les processus: ps aux | grep n8n"
echo "   - Redémarrer uniquement via PM2: pm2 restart n8n"
echo ""

echo "2. Si problème de mémoire:"
echo "   - Augmenter la mémoire disponible"
echo "   - Réduire la consommation mémoire d'autres services"
echo "   - Configurer un swap si nécessaire"
echo ""

echo "3. Si problème de base de données:"
echo "   - Vérifier que la base de données est accessible"
echo "   - Vérifier les credentials dans $N8N_DIR/.env"
echo "   - Tester la connexion manuellement"
echo ""

echo "4. Si problème de configuration:"
echo "   - Vérifier toutes les variables d'environnement dans $N8N_DIR/.env"
echo "   - Vérifier la documentation N8N pour les variables requises"
echo ""

echo "5. Pour plus de détails:"
echo "   - Analyser le fichier n8n.log: tail -100 $N8N_DIR/logs/n8n.log"
echo "   - Exécuter: n8n start (dans $N8N_DIR) pour voir les erreurs en direct"
echo "   - Vérifier: pm2 logs n8n --lines 200"
echo ""

log_success "Diagnostic terminé"
echo ""

