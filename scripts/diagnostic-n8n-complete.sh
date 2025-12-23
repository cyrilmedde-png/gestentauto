#!/bin/bash

# Script complet de diagnostic N8N
# Vérifie tous les aspects de la configuration N8N côté serveur

set -e

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
N8N_DOMAIN="n8n.talosprimes.com"
N8N_DIR="/var/n8n"
N8N_USER="n8n"
APP_DIR="/var/www/talosprime"
NEXTJS_DIR="$APP_DIR"

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

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour tester une URL
test_url() {
    local url=$1
    local timeout=${2:-5}
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
    echo "$status_code"
}

# ============================================
# 1. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
# ============================================
log_section "1. VARIABLES D'ENVIRONNEMENT NEXT.JS"

if [ ! -d "$NEXTJS_DIR" ]; then
    log_error "Répertoire Next.js introuvable: $NEXTJS_DIR"
    exit 1
fi

cd "$NEXTJS_DIR" || exit 1

# Vérifier .env.production
if [ -f ".env.production" ]; then
    log_success "Fichier .env.production trouvé"
    
    # Vérifier N8N_URL
    if grep -q "^N8N_URL=" .env.production; then
        N8N_URL=$(grep "^N8N_URL=" .env.production | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        log_success "N8N_URL est défini: $N8N_URL"
    else
        log_error "N8N_URL n'est pas défini dans .env.production"
    fi
    
    # Vérifier N8N_BASIC_AUTH_USER
    if grep -q "^N8N_BASIC_AUTH_USER=" .env.production; then
        N8N_USER_VAL=$(grep "^N8N_BASIC_AUTH_USER=" .env.production | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$N8N_USER_VAL" ]; then
            log_success "N8N_BASIC_AUTH_USER est défini (longueur: ${#N8N_USER_VAL})"
        else
            log_error "N8N_BASIC_AUTH_USER est vide"
        fi
    else
        log_error "N8N_BASIC_AUTH_USER n'est pas défini dans .env.production"
    fi
    
    # Vérifier N8N_BASIC_AUTH_PASSWORD
    if grep -q "^N8N_BASIC_AUTH_PASSWORD=" .env.production; then
        N8N_PASS_VAL=$(grep "^N8N_BASIC_AUTH_PASSWORD=" .env.production | cut -d'=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$N8N_PASS_VAL" ]; then
            log_success "N8N_BASIC_AUTH_PASSWORD est défini (longueur: ${#N8N_PASS_VAL})"
        else
            log_error "N8N_BASIC_AUTH_PASSWORD est vide"
        fi
    else
        log_error "N8N_BASIC_AUTH_PASSWORD n'est pas défini dans .env.production"
    fi
    
    # Vérifier Supabase
    if grep -q "^NEXT_PUBLIC_SUPABASE_URL=" .env.production; then
        log_success "NEXT_PUBLIC_SUPABASE_URL est défini"
    else
        log_warning "NEXT_PUBLIC_SUPABASE_URL n'est pas défini"
    fi
    
    if grep -q "^SUPABASE_SERVICE_ROLE_KEY=" .env.production; then
        log_success "SUPABASE_SERVICE_ROLE_KEY est défini"
    else
        log_warning "SUPABASE_SERVICE_ROLE_KEY n'est pas défini"
    fi
else
    log_error "Fichier .env.production introuvable dans $NEXTJS_DIR"
fi

# ============================================
# 2. VÉRIFICATION DU SERVICE N8N
# ============================================
log_section "2. SERVICE N8N (PM2)"

# Vérifier que PM2 est installé
if command_exists pm2; then
    log_success "PM2 est installé"
    pm2 --version
else
    log_error "PM2 n'est pas installé"
fi

# Vérifier le statut N8N dans PM2 (essayer avec root d'abord, puis avec n8n user)
N8N_IN_PM2=false
if pm2 list 2>/dev/null | grep -q "n8n"; then
    N8N_IN_PM2=true
    log_success "N8N est présent dans PM2 (utilisateur root)"
elif sudo -u "$N8N_USER" pm2 list 2>/dev/null | grep -q "n8n"; then
    N8N_IN_PM2=true
    log_success "N8N est présent dans PM2 (utilisateur $N8N_USER)"
fi

if [ "$N8N_IN_PM2" = true ]; then
    # Vérifier le statut avec pm2 describe (plus fiable que JSON)
    PM2_DESCRIBE=$(pm2 describe n8n 2>/dev/null || sudo -u "$N8N_USER" pm2 describe n8n 2>/dev/null || echo "")
    
    if echo "$PM2_DESCRIBE" | grep -q "status.*online"; then
        N8N_STATUS="online"
        log_success "N8N est en ligne"
        
        # Vérifier les redémarrages (critique)
        RESTARTS=$(echo "$PM2_DESCRIBE" | grep "restarts" | grep -oE "[0-9]+" | head -1 || echo "0")
        UPTIME=$(echo "$PM2_DESCRIBE" | grep "uptime" | grep -oE "[0-9]+[smhd]" | head -1 || echo "")
        
        if [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 100 ]; then
            log_error "⚠️  ATTENTION: N8N a redémarré $RESTARTS fois (problème critique !)"
            log_warning "Uptime actuel: $UPTIME - N8N redémarre constamment"
            log_info "Vérifiez les logs d'erreur pour identifier la cause:"
            log_info "  pm2 logs n8n --err --lines 50"
        elif [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 10 ]; then
            log_warning "N8N a redémarré $RESTARTS fois (uptime: $UPTIME)"
        else
            log_info "Redémarrages: $RESTARTS, Uptime: $UPTIME"
        fi
    else
        log_error "N8N n'est pas en ligne"
        N8N_STATUS="offline"
        RESTARTS="0"
    fi
    
    # Afficher les logs d'erreur si beaucoup de redémarrages
    if [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 10 ]; then
        log_info "Logs d'erreur N8N (dernières 30 lignes):"
        pm2 logs n8n --err --lines 30 --nostream 2>/dev/null || sudo -u "$N8N_USER" pm2 logs n8n --err --lines 30 --nostream 2>/dev/null || true
    else
        log_info "Logs N8N (dernières 20 lignes):"
        pm2 logs n8n --lines 20 --nostream 2>/dev/null || sudo -u "$N8N_USER" pm2 logs n8n --lines 20 --nostream 2>/dev/null || true
    fi
    
    # Afficher les infos PM2
    log_info "Informations PM2 N8N:"
    echo "$PM2_DESCRIBE" | head -20 || true
else
    log_error "N8N n'est pas présent dans PM2"
    N8N_STATUS="not_found"
    RESTARTS="0"
fi

# ============================================
# 3. VÉRIFICATION DES FICHIERS N8N
# ============================================
log_section "3. FICHIERS ET RÉPERTOIRES N8N"

if [ -d "$N8N_DIR" ]; then
    log_success "Répertoire N8N existe: $N8N_DIR"
    
    # Vérifier .env N8N
    if [ -f "$N8N_DIR/.env" ]; then
        log_success "Fichier .env N8N existe"
        
        # Vérifier les variables dans .env N8N
        if grep -q "^N8N_BASIC_AUTH_USER=" "$N8N_DIR/.env"; then
            N8N_ENV_USER=$(grep "^N8N_BASIC_AUTH_USER=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            log_info "N8N .env USER: ${N8N_ENV_USER:0:10}..."
        fi
        
        if grep -q "^N8N_BASIC_AUTH_PASSWORD=" "$N8N_DIR/.env"; then
            N8N_ENV_PASS=$(grep "^N8N_BASIC_AUTH_PASSWORD=" "$N8N_DIR/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            log_info "N8N .env PASSWORD: défini (longueur: ${#N8N_ENV_PASS})"
        fi
        
        # Comparer avec .env.production
        if [ -n "$N8N_USER_VAL" ] && [ -n "$N8N_ENV_USER" ]; then
            if [ "$N8N_USER_VAL" = "$N8N_ENV_USER" ]; then
                log_success "N8N_BASIC_AUTH_USER correspond entre .env N8N et .env.production"
            else
                log_warning "N8N_BASIC_AUTH_USER diffère entre .env N8N et .env.production"
                log_info "  .env N8N: ${N8N_ENV_USER:0:10}..."
                log_info "  .env.production: ${N8N_USER_VAL:0:10}..."
            fi
        fi
    else
        log_error "Fichier .env N8N introuvable: $N8N_DIR/.env"
    fi
    
    # Vérifier les répertoires
    [ -d "$N8N_DIR/data" ] && log_success "Répertoire data existe" || log_warning "Répertoire data manquant"
    [ -d "$N8N_DIR/logs" ] && log_success "Répertoire logs existe" || log_warning "Répertoire logs manquant"
else
    log_error "Répertoire N8N introuvable: $N8N_DIR"
fi

# ============================================
# 4. VÉRIFICATION DE LA CONNEXION RÉSEAU
# ============================================
log_section "4. CONNEXION RÉSEAU À N8N"

# Tester localhost
log_info "Test de connexion à localhost:5678"
LOCAL_STATUS=$(test_url "http://localhost:5678" 3)
if [ "$LOCAL_STATUS" = "200" ] || [ "$LOCAL_STATUS" = "401" ]; then
    log_success "N8N répond sur localhost:5678 (HTTP $LOCAL_STATUS)"
else
    log_error "N8N ne répond pas sur localhost:5678 (HTTP $LOCAL_STATUS)"
fi

# Tester via domaine
log_info "Test de connexion à https://$N8N_DOMAIN"
DOMAIN_STATUS=$(test_url "https://$N8N_DOMAIN" 5)
if [ "$DOMAIN_STATUS" = "200" ] || [ "$DOMAIN_STATUS" = "401" ]; then
    log_success "N8N répond via domaine (HTTP $DOMAIN_STATUS)"
else
    log_error "N8N ne répond pas via domaine (HTTP $DOMAIN_STATUS)"
    
    # Vérifier DNS
    log_info "Vérification DNS..."
    if command_exists nslookup; then
        if nslookup "$N8N_DOMAIN" >/dev/null 2>&1; then
            log_success "DNS résolu correctement"
            nslookup "$N8N_DOMAIN" | head -5
        else
            log_error "Problème de résolution DNS"
        fi
    fi
fi

# Tester avec authentification
if [ -n "$N8N_USER_VAL" ] && [ -n "$N8N_PASS_VAL" ]; then
    log_info "Test de connexion avec authentification Basic Auth..."
    AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
        -u "$N8N_USER_VAL:$N8N_PASS_VAL" \
        "https://$N8N_DOMAIN" 2>/dev/null || echo "000")
    
    if [ "$AUTH_RESPONSE" = "200" ]; then
        log_success "Authentification Basic Auth réussie (HTTP 200)"
    elif [ "$AUTH_RESPONSE" = "401" ]; then
        log_warning "Authentification Basic Auth échouée (HTTP 401) - vérifiez les credentials"
    else
        log_error "Erreur de connexion avec auth (HTTP $AUTH_RESPONSE)"
    fi
fi

# ============================================
# 5. VÉRIFICATION NGINX
# ============================================
log_section "5. CONFIGURATION NGINX"

if command_exists nginx; then
    log_success "Nginx est installé"
    
    # Tester la configuration
    if nginx -t 2>&1 | grep -q "successful"; then
        log_success "Configuration Nginx valide"
    else
        log_error "Erreur dans la configuration Nginx:"
        nginx -t 2>&1 | grep -v "^$" || true
    fi
    
    # Vérifier le statut
    if systemctl is-active --quiet nginx; then
        log_success "Nginx est actif"
    else
        log_error "Nginx n'est pas actif"
    fi
    
    # Vérifier la configuration N8N dans Nginx
    if [ -f "/etc/nginx/sites-available/$N8N_DOMAIN" ] || [ -f "/etc/nginx/sites-enabled/$N8N_DOMAIN" ]; then
        log_success "Configuration Nginx pour $N8N_DOMAIN trouvée"
        
        # Vérifier le proxy_pass
        if grep -q "proxy_pass.*5678" /etc/nginx/sites-available/$N8N_DOMAIN 2>/dev/null || \
           grep -q "proxy_pass.*5678" /etc/nginx/sites-enabled/$N8N_DOMAIN 2>/dev/null; then
            log_success "proxy_pass configuré vers le port 5678"
        else
            log_warning "proxy_pass vers 5678 non trouvé dans la config Nginx"
        fi
    else
        log_warning "Configuration Nginx pour $N8N_DOMAIN introuvable (peut être dans un autre fichier)"
    fi
    
    # Vérifier la configuration talosprimes.com (PRIORITAIRE pour Next.js)
    if [ -f "/etc/nginx/sites-available/talosprimes.com" ] || [ -f "/etc/nginx/sites-enabled/talosprimes.com" ]; then
        log_success "Configuration Nginx pour talosprimes.com trouvée (prioritaire)"
    elif [ -f "/etc/nginx/sites-available/talosprime" ] || [ -f "/etc/nginx/sites-enabled/talosprime" ]; then
        log_success "Configuration Nginx pour talosprime trouvée (fallback)"
    elif [ -f "/etc/nginx/sites-available/www.talosprimes.com" ] || [ -f "/etc/nginx/sites-enabled/www.talosprimes.com" ]; then
        log_success "Configuration Nginx pour www.talosprimes.com trouvée"
    else
        log_warning "Configuration Nginx pour talosprimes.com/talosprime introuvable"
        log_info "Fichiers Nginx disponibles:"
        ls -la /etc/nginx/sites-available/ 2>/dev/null | grep -E "talos|www" | head -10 || true
    fi
else
    log_warning "Nginx n'est pas installé"
fi

# ============================================
# 6. VÉRIFICATION SSL
# ============================================
log_section "6. CERTIFICATS SSL"

if [ -d "/etc/letsencrypt/live/$N8N_DOMAIN" ]; then
    log_success "Certificat SSL installé pour $N8N_DOMAIN"
    
    # Vérifier la date d'expiration
    if command_exists openssl; then
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$N8N_DOMAIN/cert.pem 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY" ]; then
            log_info "Certificat expire le: $EXPIRY"
        fi
    fi
else
    log_warning "Certificat SSL non trouvé pour $N8N_DOMAIN"
fi

# ============================================
# 7. VÉRIFICATION BASE DE DONNÉES
# ============================================
log_section "7. BASE DE DONNÉES (platform_n8n_access)"

# Vérifier si psql est disponible
if command_exists psql; then
    # Essayer de se connecter à Supabase (nécessite les credentials)
    log_info "Vérification de la table platform_n8n_access..."
    log_warning "Note: Cette vérification nécessite les credentials Supabase"
    log_info "Pour vérifier manuellement, exécutez:"
    log_info "  psql -h [SUPABASE_HOST] -U postgres -d postgres -c \"SELECT * FROM platform_n8n_access;\""
else
    log_warning "psql n'est pas installé - impossible de vérifier la base de données"
fi

# ============================================
# 8. VÉRIFICATION DES LOGS
# ============================================
log_section "8. LOGS D'ERREURS"

# Logs N8N - Vérifier plusieurs sources
log_info "Vérification des logs N8N (plusieurs sources)..."

# 1. Logs PM2 stderr
HAS_PM2_ERR=false
if pm2 logs n8n --err --lines 0 --nostream 2>/dev/null | grep -v "^$" | grep -q .; then
    HAS_PM2_ERR=true
    log_warning "Erreurs trouvées dans les logs PM2 stderr:"
    pm2 logs n8n --err --lines 50 --nostream 2>/dev/null | tail -20 || true
fi

# 2. Logs PM2 stdout (peut contenir les erreurs aussi)
HAS_PM2_OUT=false
if pm2 logs n8n --out --lines 0 --nostream 2>/dev/null | grep -i "error\|fail\|exception\|crash\|fatal" | tail -10 | grep -q .; then
    HAS_PM2_OUT=true
    log_warning "Erreurs trouvées dans les logs PM2 stdout:"
    pm2 logs n8n --out --lines 100 --nostream 2>/dev/null | grep -i "error\|fail\|exception\|crash\|fatal" | tail -20 || true
fi

# 3. Logs fichiers directs
if [ -f "$N8N_DIR/logs/pm2-error.log" ]; then
    if [ -s "$N8N_DIR/logs/pm2-error.log" ]; then
        log_warning "Contenu du fichier pm2-error.log:"
        tail -30 "$N8N_DIR/logs/pm2-error.log" || true
    else
        log_info "Fichier pm2-error.log existe mais est vide"
    fi
fi

if [ -f "$N8N_DIR/logs/pm2-out.log" ]; then
    if tail -100 "$N8N_DIR/logs/pm2-out.log" 2>/dev/null | grep -i "error\|fail\|exception\|crash\|fatal" | grep -q .; then
        log_warning "Erreurs trouvées dans pm2-out.log:"
        tail -100 "$N8N_DIR/logs/pm2-out.log" | grep -i "error\|fail\|exception\|crash\|fatal" | tail -20 || true
    fi
fi

# 4. Logs système (journalctl)
if command_exists journalctl; then
    if journalctl | grep -i n8n 2>/dev/null | tail -20 | grep -q .; then
        log_info "Dernières entrées système pour N8N:"
        journalctl | grep -i n8n 2>/dev/null | tail -10 || true
    fi
fi

# Résumé
if [ "$HAS_PM2_ERR" = false ] && [ "$HAS_PM2_OUT" = false ]; then
    if [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 10 ]; then
        log_error "⚠️  PROBLÈME: N8N redémarre ($RESTARTS fois) mais aucun log d'erreur trouvé"
        log_info "Causes possibles:"
        log_info "  - N8N crash avant de pouvoir écrire dans les logs"
        log_info "  - Problème de configuration (port, base de données, etc.)"
        log_info "  - Problème de permissions"
        log_info "  - Problème de mémoire (OOM killer)"
        log_info ""
        log_info "Vérifications supplémentaires:"
        log_info "  - Vérifier la mémoire: free -h"
        log_info "  - Vérifier les processus: ps aux | grep n8n"
        log_info "  - Vérifier les ports: ss -tlnp | grep 5678"
        log_info "  - Vérifier les permissions: ls -la $N8N_DIR"
    else
        log_success "Aucune erreur récente dans les logs N8N"
    fi
fi

# Logs Next.js (si PM2 - chercher talosprime aussi)
if pm2 list 2>/dev/null | grep -q "nextjs\|next\|talosprime"; then
    log_info "Vérification des logs Next.js..."
    pm2 logs talosprime --lines 0 --nostream 2>/dev/null | grep -i "n8n\|error" | tail -10 || \
    pm2 logs nextjs --lines 0 --nostream 2>/dev/null | grep -i "n8n\|error" | tail -10 || true
fi

# Logs Nginx
if [ -f "/var/log/nginx/error.log" ]; then
    log_info "Dernières erreurs Nginx (dernières 5):"
    tail -5 /var/log/nginx/error.log 2>/dev/null | grep -i "n8n\|error" || log_info "Aucune erreur Nginx récente liée à N8N"
fi

# ============================================
# 9. TEST DE L'API NEXT.JS
# ============================================
log_section "9. TEST API NEXT.JS (/api/platform/n8n/health)"

# Déterminer l'URL de l'application
if [ -f "$NEXTJS_DIR/.env.production" ] && grep -q "^NEXT_PUBLIC_APP_URL=" "$NEXTJS_DIR/.env.production"; then
    APP_URL=$(grep "^NEXT_PUBLIC_APP_URL=" "$NEXTJS_DIR/.env.production" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
else
    APP_URL="https://www.talosprimes.com"
fi

# Tester localhost d'abord (plus fiable)
log_info "Test de l'endpoint de santé N8N en local: http://localhost:3000/api/platform/n8n/health"
LOCAL_HEALTH_STATUS=$(test_url "http://localhost:3000/api/platform/n8n/health" 5)

if [ "$LOCAL_HEALTH_STATUS" = "200" ]; then
    log_success "Endpoint de santé répond (HTTP 200)"
    log_info "Réponse complète:"
    curl -s "http://localhost:3000/api/platform/n8n/health" | head -20 || true
elif [ "$LOCAL_HEALTH_STATUS" = "403" ]; then
    log_success "Endpoint de santé répond (HTTP 403 - authentification requise, c'est normal)"
    log_info "L'endpoint fonctionne mais nécessite une session d'authentification"
    log_info "Réponse:"
    curl -s "http://localhost:3000/api/platform/n8n/health" | head -5 || true
elif [ "$LOCAL_HEALTH_STATUS" = "503" ]; then
    log_error "Endpoint de santé retourne 503 (N8N non accessible depuis Next.js)"
    log_info "Réponse:"
    curl -s "http://localhost:3000/api/platform/n8n/health" | head -5 || true
else
    log_warning "Endpoint de santé ne répond pas correctement en local (HTTP $LOCAL_HEALTH_STATUS)"
    log_info "Vérifiez que Next.js est démarré sur le port 3000"
fi

# Tester via domaine public (peut échouer si pas d'auth)
log_info "Test de l'endpoint de santé N8N via domaine: $APP_URL/api/platform/n8n/health"
PUBLIC_HEALTH_STATUS=$(test_url "$APP_URL/api/platform/n8n/health" 5)

if [ "$PUBLIC_HEALTH_STATUS" = "200" ]; then
    log_success "Endpoint de santé répond via domaine (HTTP 200)"
elif [ "$PUBLIC_HEALTH_STATUS" = "403" ]; then
    log_success "Endpoint de santé répond via domaine (HTTP 403 - authentification requise, c'est normal)"
elif [ "$PUBLIC_HEALTH_STATUS" = "503" ]; then
    log_error "Endpoint de santé retourne 503 via domaine (N8N non accessible)"
else
    log_warning "Endpoint de santé ne répond pas via domaine (HTTP $PUBLIC_HEALTH_STATUS)"
    log_info "Cela peut être normal si l'endpoint nécessite une authentification et qu'il n'y a pas de session"
fi

# ============================================
# 10. RÉSUMÉ ET RECOMMANDATIONS
# ============================================
log_section "10. RÉSUMÉ"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RÉSUMÉ DU DIAGNOSTIC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Compter les erreurs
ERRORS=0
WARNINGS=0

# Vérifications critiques
if [ ! -f "$NEXTJS_DIR/.env.production" ]; then
    ((ERRORS++))
fi

# Vérifier si N8N est en ligne ET n'a pas trop de redémarrages
if [ "$N8N_STATUS" != "online" ]; then
    ((ERRORS++))
elif [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 100 ]; then
    ((ERRORS++))
    log_error "N8N redémarre constamment ($RESTARTS restarts) - problème critique"
elif [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 10 ]; then
    ((WARNINGS++))
    log_warning "N8N a redémarré $RESTARTS fois - vérifiez les logs"
fi

if [ "$DOMAIN_STATUS" != "200" ] && [ "$DOMAIN_STATUS" != "401" ]; then
    ((WARNINGS++))
fi

log_info "Erreurs critiques: $ERRORS"
log_info "Avertissements: $WARNINGS"

if [ $ERRORS -eq 0 ]; then
    log_success "Aucune erreur critique détectée"
else
    log_error "$ERRORS erreur(s) critique(s) détectée(s)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ACTIONS RECOMMANDÉES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "$NEXTJS_DIR/.env.production" ]; then
    echo "1. Créer le fichier .env.production avec les variables N8N"
fi

if [ "$N8N_STATUS" != "online" ]; then
    echo "2. Démarrer N8N: pm2 start n8n --name n8n (ou sudo -u $N8N_USER pm2 start n8n --name n8n)"
elif [ -n "$RESTARTS" ] && [ "$RESTARTS" -gt 100 ]; then
    echo "2. ⚠️  URGENT: N8N redémarre constamment ($RESTARTS restarts) - vérifiez les logs:"
    echo "   pm2 logs n8n --err --lines 50"
    echo "   Vérifiez la configuration N8N et les variables d'environnement"
fi

if [ "$DOMAIN_STATUS" != "200" ] && [ "$DOMAIN_STATUS" != "401" ]; then
    echo "3. Vérifier la configuration Nginx et le DNS"
fi

if [ -n "$N8N_USER_VAL" ] && [ -n "$N8N_ENV_USER" ] && [ "$N8N_USER_VAL" != "$N8N_ENV_USER" ]; then
    echo "4. Synchroniser les credentials N8N entre .env N8N et .env.production"
fi

echo ""
log_success "Diagnostic terminé"
echo ""

