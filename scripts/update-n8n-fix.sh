#!/bin/bash

# Script de mise à jour pour corriger les erreurs N8N
# Usage: ./scripts/update-n8n-fix.sh

set -e

echo "=========================================="
echo "Mise à jour N8N - Correction des erreurs"
echo "=========================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/talosprime"
BACKUP_DIR="/var/www/talosprime-backup-$(date +%Y%m%d-%H%M%S)"

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$PROJECT_DIR" ]; then
    error "Le répertoire $PROJECT_DIR n'existe pas!"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. Sauvegarder l'état actuel
info "Création d'une sauvegarde..."
if [ -d ".git" ]; then
    git add -A
    git commit -m "Backup avant correction N8N - $(date +%Y%m%d-%H%M%S)" || true
    info "Sauvegarde Git créée"
else
    warn "Pas de dépôt Git, création d'une sauvegarde manuelle..."
    mkdir -p "$BACKUP_DIR"
    cp -r app/api/platform/n8n "$BACKUP_DIR/" 2>/dev/null || true
    cp -r app/platform/n8n "$BACKUP_DIR/" 2>/dev/null || true
    info "Sauvegarde créée dans $BACKUP_DIR"
fi

# 2. Récupérer les dernières modifications depuis GitHub
info "Récupération des dernières modifications depuis GitHub..."
git fetch origin main || {
    error "Impossible de récupérer depuis GitHub. Vérifiez votre connexion."
    exit 1
}

# 3. Vérifier s'il y a des modifications locales non commitées
if ! git diff-index --quiet HEAD --; then
    warn "Des modifications locales non commitées ont été détectées."
    read -p "Voulez-vous les sauvegarder dans un commit? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Modifications locales avant pull - $(date +%Y%m%d-%H%M%S)" || true
    fi
fi

# 4. Faire un pull des dernières modifications
info "Mise à jour du code depuis GitHub..."
git pull origin main || {
    error "Erreur lors du pull. Vérifiez les conflits."
    exit 1
}

# 5. Installer les dépendances si nécessaire
info "Vérification des dépendances..."
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        info "Installation des dépendances..."
        npm install --production=false || {
            error "Erreur lors de l'installation des dépendances"
            exit 1
        }
    else
        info "Dépendances à jour"
    fi
else
    error "package.json introuvable!"
    exit 1
fi

# 6. Construire l'application
info "Construction de l'application..."
npm run build || {
    error "Erreur lors de la construction. Vérifiez les logs ci-dessus."
    exit 1
}

# 7. Redémarrer PM2
info "Redémarrage de l'application PM2..."
if command -v pm2 &> /dev/null; then
    # Trouver le nom de l'application PM2
    PM2_NAME=$(pm2 list | grep -E "talosprime|next" | head -1 | awk '{print $2}' || echo "talosprime")
    
    if pm2 describe "$PM2_NAME" &> /dev/null; then
        pm2 restart "$PM2_NAME" || {
            error "Erreur lors du redémarrage PM2"
            exit 1
        }
        info "Application PM2 redémarrée: $PM2_NAME"
        
        # Afficher les logs
        sleep 2
        info "Vérification des logs PM2..."
        pm2 logs "$PM2_NAME" --lines 20 --nostream
    else
        warn "Application PM2 '$PM2_NAME' non trouvée. Démarrage..."
        pm2 start npm --name "$PM2_NAME" -- start || {
            error "Erreur lors du démarrage PM2"
            exit 1
        }
        pm2 save
    fi
else
    warn "PM2 n'est pas installé. Redémarrez manuellement l'application."
fi

# 8. Vérifier que l'application fonctionne
info "Vérification de l'application..."
sleep 3

# Test de santé
HEALTH_URL="http://localhost:3000/api/platform/n8n/health"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
        info "Application accessible (HTTP $HTTP_CODE)"
    else
        warn "L'application répond avec le code HTTP $HTTP_CODE"
        warn "Cela peut être normal si l'authentification est requise"
    fi
else
    warn "curl n'est pas installé. Impossible de vérifier l'application."
fi

# 9. Vérifier la configuration WebSocket Nginx
info "Vérification de la configuration WebSocket Nginx..."
if [ -f "scripts/setup-websocket-proxy.sh" ]; then
    warn "IMPORTANT: Les WebSockets nécessitent une configuration Nginx."
    warn "Exécutez: ./scripts/setup-websocket-proxy.sh"
    warn "Ou suivez: docs/CONFIGURER_WEBSOCKETS_N8N.md"
else
    warn "Script setup-websocket-proxy.sh non trouvé. Vérifiez la configuration WebSocket manuellement."
fi

# 10. Résumé
echo ""
echo "=========================================="
info "Mise à jour terminée!"
echo "=========================================="
echo ""
echo "Prochaines étapes:"
echo "1. Videz le cache de votre navigateur (Ctrl+Shift+Delete)"
echo "2. Configurez Nginx pour WebSockets: ./scripts/setup-websocket-proxy.sh"
echo "3. Accédez à https://www.talosprimes.com/platform/n8n"
echo "4. Ouvrez la console du navigateur (F12)"
echo "5. Vérifiez les logs [N8N Proxy] pour voir quelles requêtes sont interceptées"
echo ""
echo "Pour voir les logs en temps réel:"
echo "  pm2 logs $PM2_NAME"
echo ""
echo "Pour redémarrer manuellement:"
echo "  pm2 restart $PM2_NAME"
echo ""
echo "Documentation complète:"
echo "  docs/RESOLUTION_ERREURS_N8N_FINAL.md"
echo ""

