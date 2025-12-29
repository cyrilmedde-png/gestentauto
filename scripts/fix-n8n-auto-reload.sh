#!/bin/bash

###############################################################################
# Script pour empêcher N8N de se recharger automatiquement
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
# Configuration N8N pour éviter les reconnexions automatiques
###############################################################################

print_step "Configuration de N8N pour éviter les rechargements automatiques..."

# Arrêter N8N
print_step "Arrêt de N8N..."
pm2 stop n8n || true

# Créer un fichier de configuration pour PM2
print_step "Création de la configuration PM2 pour N8N..."

cat > /tmp/n8n-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'n8n',
    script: 'n8n',
    cwd: '/root/.n8n',
    env: {
      // Configuration de base
      N8N_HOST: '0.0.0.0',
      N8N_PORT: '5678',
      N8N_PROTOCOL: 'https',
      WEBHOOK_URL: 'https://n8n.talosprimes.com/',
      
      // Empêcher les reconnexions agressives
      N8N_RECONNECT_TIMEOUT: '300000',  // 5 minutes au lieu de quelques secondes
      
      // Désactiver les vérifications de versions qui causent des erreurs
      N8N_VERSION_NOTIFICATIONS_ENABLED: 'false',
      
      // Configuration des workers (éviter les processus séparés)
      EXECUTIONS_PROCESS: 'main',
      N8N_DISABLE_PRODUCTION_MAIN_PROCESS: 'false',
      
      // Timeout de session plus long
      N8N_USER_MANAGEMENT_JWT_DURATION_HOURS: '168',  // 7 jours
      
      // Logs
      N8N_LOG_LEVEL: 'info',
      N8N_LOG_OUTPUT: 'console',
      
      // CORS (si nécessaire)
      N8N_CORS_ORIGIN: 'https://www.talosprimes.com'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/n8n-error.log',
    out_file: '/var/log/n8n-out.log',
    time: true
  }]
}
EOF

# Vérifier si le fichier ecosystem existe déjà
if [ -f "/var/www/talosprime/ecosystem.config.js" ]; then
    print_warning "Un fichier ecosystem.config.js existe déjà"
    print_step "Sauvegarde de l'ancien fichier..."
    cp /var/www/talosprime/ecosystem.config.js /var/www/talosprime/ecosystem.config.js.backup
fi

# Copier la nouvelle configuration
cp /tmp/n8n-ecosystem.config.js /var/www/talosprime/n8n-ecosystem.config.js
print_success "Configuration créée : /var/www/talosprime/n8n-ecosystem.config.js"

# Supprimer l'ancienne configuration PM2 de N8N
print_step "Suppression de l'ancienne configuration N8N..."
pm2 delete n8n || true

# Démarrer N8N avec la nouvelle configuration
print_step "Démarrage de N8N avec la nouvelle configuration..."
cd /var/www/talosprime
pm2 start n8n-ecosystem.config.js

# Sauvegarder la configuration PM2
print_step "Sauvegarde de la configuration PM2..."
pm2 save

# Afficher le statut
print_step "Statut de N8N :"
pm2 list | grep n8n

# Afficher les variables d'environnement
echo ""
print_step "Variables d'environnement N8N :"
pm2 env n8n | grep -E "N8N_|WEBHOOK"

# Afficher les logs
echo ""
print_step "Logs N8N (20 dernières lignes) :"
pm2 logs n8n --lines 20 --nostream

echo ""
print_success "Configuration terminée !"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "N8N a été reconfiguré avec les paramètres suivants :"
echo ""
echo "✅ Timeout de reconnexion : 5 minutes (au lieu de quelques secondes)"
echo "✅ Vérifications de version : désactivées"
echo "✅ Durée de session JWT : 7 jours"
echo "✅ Processus principal : mode main (pas de workers séparés)"
echo ""
echo "Cela devrait empêcher N8N de se recharger automatiquement"
echo "lors des changements d'onglet."
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Testez maintenant :"
echo "1. Ouvrez https://www.talosprimes.com/platform/n8n"
echo "2. Changez d'onglet pendant 10-15 secondes"
echo "3. Revenez sur l'onglet"
echo "4. N8N ne devrait plus afficher 'Chargement...'"
echo ""

