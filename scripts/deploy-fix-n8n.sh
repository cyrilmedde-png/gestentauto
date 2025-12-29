#!/bin/bash

###############################################################################
# Script de déploiement du fix N8N sur le serveur VPS
# Usage: bash scripts/deploy-fix-n8n.sh
###############################################################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

###############################################################################
# ÉTAPE 1 : Vérifications préliminaires
###############################################################################

print_step "Vérification de l'environnement..."

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    print_error "package.json non trouvé. Êtes-vous dans le bon dossier ?"
    exit 1
fi

print_success "Dossier du projet trouvé"

###############################################################################
# ÉTAPE 2 : Vérifier l'état Git
###############################################################################

print_step "Vérification de l'état Git..."

# Afficher la branche actuelle
CURRENT_BRANCH=$(git branch --show-current)
print_success "Branche actuelle : $CURRENT_BRANCH"

# Vérifier s'il y a des modifications non commitées
if [[ -n $(git status -s) ]]; then
    print_warning "Modifications locales détectées. Sauvegarde avec git stash..."
    git stash save "Auto-stash avant déploiement fix N8N - $(date '+%Y-%m-%d %H:%M:%S')"
    print_success "Modifications sauvegardées dans stash"
fi

###############################################################################
# ÉTAPE 3 : Récupérer les dernières modifications
###############################################################################

print_step "Récupération des dernières modifications depuis GitHub..."

git fetch origin
print_success "Fetch réussi"

# Afficher les différences
COMMITS_BEHIND=$(git rev-list HEAD..origin/$CURRENT_BRANCH --count)
if [ "$COMMITS_BEHIND" -gt 0 ]; then
    print_warning "Vous êtes $COMMITS_BEHIND commit(s) en retard"
    echo ""
    echo "Nouveaux commits :"
    git log HEAD..origin/$CURRENT_BRANCH --oneline
    echo ""
fi

# Pull
print_step "Mise à jour de la branche $CURRENT_BRANCH..."
git pull origin $CURRENT_BRANCH
print_success "Pull réussi"

###############################################################################
# ÉTAPE 4 : Installer les dépendances
###############################################################################

print_step "Installation des dépendances..."

if [ -f "package-lock.json" ]; then
    npm install
elif [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi

print_success "Dépendances installées"

###############################################################################
# ÉTAPE 5 : Build de production
###############################################################################

print_step "Build de production en cours..."
echo "⏱️  Cela peut prendre 2-5 minutes..."

if npm run build; then
    print_success "Build réussi"
else
    print_error "Build échoué"
    print_error "Consultez les erreurs ci-dessus"
    exit 1
fi

###############################################################################
# ÉTAPE 6 : Redémarrer l'application
###############################################################################

print_step "Redémarrage de l'application..."

# Détecter le gestionnaire de processus
if command -v pm2 &> /dev/null; then
    print_success "PM2 détecté"
    
    # Trouver le nom de l'application
    APP_NAME=$(pm2 list | grep -o 'talosprime\|gestentauto\|next-app' | head -n 1)
    
    if [ -z "$APP_NAME" ]; then
        print_warning "Aucune application PM2 trouvée avec les noms standards"
        print_warning "Listage de toutes les applications PM2 :"
        pm2 list
        read -p "Entrez le nom de l'application à redémarrer : " APP_NAME
    fi
    
    print_step "Redémarrage de $APP_NAME..."
    pm2 restart $APP_NAME
    print_success "Application redémarrée"
    
    # Afficher les logs
    echo ""
    print_step "Logs de l'application (20 dernières lignes) :"
    pm2 logs $APP_NAME --lines 20 --nostream
    
elif systemctl is-active --quiet talosprime; then
    print_success "Service systemd 'talosprime' détecté"
    sudo systemctl restart talosprime
    print_success "Service redémarré"
    
    # Afficher le statut
    echo ""
    print_step "Statut du service :"
    sudo systemctl status talosprime --no-pager -l
    
elif [ -f "docker-compose.yml" ]; then
    print_success "Docker Compose détecté"
    docker-compose restart
    print_success "Containers redémarrés"
    
    # Afficher les logs
    echo ""
    print_step "Logs des containers :"
    docker-compose logs --tail 20
    
else
    print_warning "Aucun gestionnaire de processus détecté"
    print_warning "Vous devrez redémarrer l'application manuellement"
fi

###############################################################################
# ÉTAPE 7 : Vérifications post-déploiement
###############################################################################

print_step "Vérifications post-déploiement..."

# Attendre que l'application démarre
sleep 3

# Tester si l'application répond
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    print_success "Application accessible sur localhost:3000"
else
    print_warning "Application non accessible sur localhost:3000"
    print_warning "Vérifiez les logs ci-dessus"
fi

# Afficher le dernier commit déployé
echo ""
print_step "Version déployée :"
git log -1 --oneline
echo ""

###############################################################################
# ÉTAPE 8 : Instructions finales
###############################################################################

echo ""
echo "════════════════════════════════════════════════════════════════"
print_success "Déploiement terminé !"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1. Testez l'application dans votre navigateur :"
echo "   https://www.talosprimes.com/platform/n8n"
echo ""
echo "2. Ouvrez la console du navigateur (F12)"
echo ""
echo "3. Testez le changement d'onglet :"
echo "   - Changez d'onglet pendant 10 secondes"
echo "   - Revenez sur l'onglet"
echo "   - Vérifiez que N8N ne recharge pas"
echo ""
echo "4. Dans la console, vous devriez voir :"
echo "   \"Retour sur l'onglet N8N - iframe préservée\""
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Proposer de voir les logs en temps réel
if command -v pm2 &> /dev/null && [ -n "$APP_NAME" ]; then
    echo ""
    read -p "Voulez-vous voir les logs en temps réel ? (o/N) : " VIEW_LOGS
    if [[ "$VIEW_LOGS" =~ ^[Oo]$ ]]; then
        print_step "Affichage des logs en temps réel (Ctrl+C pour quitter)..."
        pm2 logs $APP_NAME
    fi
fi

echo ""
print_success "Script terminé avec succès !"



