#!/bin/bash

# ============================================
# Script d'installation complète de N8N
# Pour serveur VPS Ubuntu avec Node.js, PM2, Nginx
# ============================================

set -e  # Arrêter en cas d'erreur

# ============================================
# CONFIGURATION
# ============================================
N8N_DOMAIN="n8n.talosprimes.com"
N8N_PORT=5678
N8N_DIR="/var/n8n"
N8N_USER="n8n"
N8N_EMAIL="n8n@n8n.talosprimes.com"
APP_URL="https://www.talosprimes.com"
BACKUP_DIR="/var/backups/n8n"

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
        echo "Usage: sudo bash install-n8n.sh"
        exit 1
    fi
}

# ============================================
# VÉRIFICATION DES PRÉREQUIS
# ============================================
echo ""
log_info "🔍 Vérification des prérequis..."
echo ""

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js installé: $NODE_VERSION"
else
    log_error "Node.js n'est pas installé"
    exit 1
fi

# Vérifier npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm installé: $NPM_VERSION"
else
    log_error "npm n'est pas installé"
    exit 1
fi

# Vérifier PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    log_success "PM2 installé: $PM2_VERSION"
else
    log_error "PM2 n'est pas installé"
    echo "Installez PM2 avec: sudo npm install -g pm2"
    exit 1
fi

# Vérifier Nginx
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    log_success "Nginx installé: $NGINX_VERSION"
else
    log_error "Nginx n'est pas installé"
    exit 1
fi

# Vérifier Certbot
if command -v certbot &> /dev/null; then
    log_success "Certbot installé"
else
    log_warning "Certbot n'est pas installé, installation..."
    apt update
    apt install -y certbot python3-certbot-nginx
    log_success "Certbot installé"
fi

echo ""

# ============================================
# CRÉATION DE L'UTILISATEUR N8N
# ============================================
log_info "👤 Création de l'utilisateur N8N..."
if id "$N8N_USER" &>/dev/null; then
    log_warning "L'utilisateur $N8N_USER existe déjà"
else
    useradd -r -s /bin/bash -d "$N8N_DIR" -m "$N8N_USER"
    log_success "Utilisateur $N8N_USER créé"
fi

# ============================================
# CRÉATION DES RÉPERTOIRES
# ============================================
log_info "📁 Création des répertoires..."

mkdir -p "$N8N_DIR"/{data,backups,logs}
mkdir -p "$BACKUP_DIR"

chown -R "$N8N_USER:$N8N_USER" "$N8N_DIR"
chown -R "$N8N_USER:$N8N_USER" "$BACKUP_DIR"

log_success "Répertoires créés"

# ============================================
# INSTALLATION DE N8N
# ============================================
log_info "📦 Installation de N8N..."

# Installer N8N globalement
npm install -g n8n

# Vérifier l'installation
if command -v n8n &> /dev/null; then
    N8N_VERSION=$(n8n --version)
    log_success "N8N installé: version $N8N_VERSION"
else
    log_error "Échec de l'installation de N8N"
    exit 1
fi

# ============================================
# CONFIGURATION DES VARIABLES D'ENVIRONNEMENT
# ============================================
log_info "⚙️  Configuration des variables d'environnement..."

ENV_FILE="$N8N_DIR/.env"

# Demander les informations nécessaires
echo ""
log_info "Veuillez fournir les informations suivantes :"
echo ""

# Supabase
read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY

# Resend
read -p "RESEND_API_KEY: " RESEND_API_KEY
read -p "RESEND_FROM_EMAIL [noreply@talosprimes.com]: " RESEND_FROM_EMAIL
RESEND_FROM_EMAIL=${RESEND_FROM_EMAIL:-noreply@talosprimes.com}

# Twilio
read -p "TWILIO_ACCOUNT_SID: " TWILIO_ACCOUNT_SID
read -p "TWILIO_AUTH_TOKEN: " TWILIO_AUTH_TOKEN
read -p "TWILIO_PHONE_NUMBER: " TWILIO_PHONE_NUMBER

# Stripe
read -p "STRIPE_SECRET_KEY (optionnel, appuyez sur Entrée pour ignorer): " STRIPE_SECRET_KEY
read -p "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (optionnel): " STRIPE_PUBLISHABLE_KEY
read -p "STRIPE_WEBHOOK_SECRET (optionnel): " STRIPE_WEBHOOK_SECRET

# Authentification N8N
echo ""
log_info "Configuration de l'authentification N8N..."
read -p "Nom d'utilisateur N8N: " N8N_USERNAME
read -sp "Mot de passe N8N: " N8N_PASSWORD
echo ""

# Créer le fichier .env
cat > "$ENV_FILE" <<EOF
# ============================================
# N8N Configuration
# ============================================
N8N_HOST=0.0.0.0
N8N_PORT=$N8N_PORT
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://$N8N_DOMAIN

# ============================================
# Authentification
# ============================================
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=$N8N_USERNAME
N8N_BASIC_AUTH_PASSWORD=$N8N_PASSWORD

# ============================================
# Données et logs
# ============================================
N8N_USER_FOLDER=$N8N_DIR/data
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=file
N8N_LOG_FILE_LOCATION=$N8N_DIR/logs/n8n.log

# ============================================
# Email (pour notifications N8N)
# ============================================
N8N_EMAIL_MODE=smtp
N8N_SMTP_HOST=smtp.resend.com
N8N_SMTP_PORT=465
N8N_SMTP_USER=resend
N8N_SMTP_PASS=$RESEND_API_KEY
N8N_SMTP_SENDER=$N8N_EMAIL
N8N_SMTP_SECURE=true

# ============================================
# Intégrations - Supabase
# ============================================
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# ============================================
# Intégrations - Resend (Email)
# ============================================
RESEND_API_KEY=$RESEND_API_KEY
RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
RESEND_FROM_NAME=TalosPrime

# ============================================
# Intégrations - Twilio (SMS)
# ============================================
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER

# ============================================
# Intégrations - Stripe (Paiement)
# ============================================
EOF

# Ajouter Stripe seulement si fourni
if [ -n "$STRIPE_SECRET_KEY" ]; then
    cat >> "$ENV_FILE" <<EOF
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
EOF
fi

cat >> "$ENV_FILE" <<EOF

# ============================================
# Application
# ============================================
NEXT_PUBLIC_APP_URL=$APP_URL
NODE_ENV=production

# ============================================
# Sécurité
# ============================================
N8N_SECURE_COOKIE=true
N8N_METRICS=false
EOF

# Sécuriser le fichier .env
chmod 600 "$ENV_FILE"
chown "$N8N_USER:$N8N_USER" "$ENV_FILE"

log_success "Variables d'environnement configurées"

# ============================================
# CONFIGURATION NGINX
# ============================================
log_info "🌐 Configuration de Nginx..."

NGINX_CONFIG="/etc/nginx/sites-available/n8n"

cat > "$NGINX_CONFIG" <<EOF
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name $N8N_DOMAIN;

    # Pour Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name $N8N_DOMAIN;

    # Certificats SSL (seront configurés par Certbot)
    # ssl_certificate /etc/letsencrypt/live/$N8N_DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$N8N_DOMAIN/privkey.pem;

    # Paramètres SSL recommandés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy vers N8N
    location / {
        proxy_pass http://localhost:$N8N_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts pour les workflows longs
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Logs avec informations utilisateur
    access_log /var/log/nginx/n8n-access.log;
    error_log /var/log/nginx/n8n-error.log;
}
EOF

# Activer le site
ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/n8n

# Tester la configuration
if nginx -t; then
    log_success "Configuration Nginx valide"
    systemctl reload nginx
else
    log_error "Erreur dans la configuration Nginx"
    exit 1
fi

# ============================================
# CONFIGURATION SSL AVEC LET'S ENCRYPT
# ============================================
log_info "🔒 Configuration du certificat SSL..."

# Vérifier si le certificat existe déjà
if [ -d "/etc/letsencrypt/live/$N8N_DOMAIN" ]; then
    log_warning "Certificat SSL existe déjà pour $N8N_DOMAIN"
    read -p "Voulez-vous le renouveler ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        certbot renew --cert-name "$N8N_DOMAIN"
    fi
else
    log_info "Génération du certificat SSL avec Let's Encrypt..."
    certbot --nginx -d "$N8N_DOMAIN" --non-interactive --agree-tos --email "$N8N_EMAIL" --redirect
    log_success "Certificat SSL installé"
fi

# Recharger Nginx
systemctl reload nginx

# ============================================
# CONFIGURATION PM2
# ============================================
log_info "⚙️  Configuration de PM2..."

# Créer le fichier ecosystem pour PM2
PM2_CONFIG="$N8N_DIR/ecosystem.config.js"

cat > "$PM2_CONFIG" <<EOF
module.exports = {
  apps: [{
    name: 'n8n',
    script: 'n8n',
    cwd: '$N8N_DIR',
    user: '$N8N_USER',
    env_file: '$ENV_FILE',
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

chown "$N8N_USER:$N8N_USER" "$PM2_CONFIG"

# Démarrer N8N avec PM2
log_info "🚀 Démarrage de N8N avec PM2..."

# Passer à l'utilisateur n8n pour démarrer
sudo -u "$N8N_USER" bash <<EOF
cd $N8N_DIR
export \$(cat $ENV_FILE | grep -v '^#' | xargs)
pm2 start ecosystem.config.js
pm2 save
EOF

# Configurer PM2 pour démarrer au boot
pm2 startup systemd -u "$N8N_USER" --hp "$N8N_DIR" | grep -v "PM2" | bash || true

log_success "N8N démarré avec PM2"

# ============================================
# CONFIGURATION DES SAUVEGARDES AUTOMATIQUES
# ============================================
log_info "💾 Configuration des sauvegardes automatiques..."

BACKUP_SCRIPT="$N8N_DIR/backup.sh"

cat > "$BACKUP_SCRIPT" <<'BACKUP_EOF'
#!/bin/bash
# Script de sauvegarde automatique N8N

N8N_DIR="/var/n8n"
BACKUP_DIR="/var/backups/n8n"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/n8n_backup_$DATE.tar.gz"

# Créer le répertoire de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarder les données N8N
tar -czf "$BACKUP_FILE" \
    -C "$N8N_DIR" \
    data \
    .env \
    2>/dev/null

if [ $? -eq 0 ]; then
    echo "[$(date)] Sauvegarde réussie: $BACKUP_FILE"
    
    # Supprimer les sauvegardes de plus de 30 jours
    find "$BACKUP_DIR" -name "n8n_backup_*.tar.gz" -mtime +30 -delete
    
    # Garder seulement les 10 dernières sauvegardes
    ls -t "$BACKUP_DIR"/n8n_backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f
else
    echo "[$(date)] Erreur lors de la sauvegarde"
    exit 1
fi
BACKUP_EOF

chmod +x "$BACKUP_SCRIPT"
chown "$N8N_USER:$N8N_USER" "$BACKUP_SCRIPT"

# Ajouter une tâche cron pour les sauvegardes quotidiennes
(crontab -u "$N8N_USER" -l 2>/dev/null; echo "0 2 * * * $BACKUP_SCRIPT >> $N8N_DIR/logs/backup.log 2>&1") | crontab -u "$N8N_USER" -

log_success "Sauvegardes automatiques configurées (quotidiennes à 2h du matin)"

# ============================================
# CONFIGURATION DES LOGS UTILISATEUR
# ============================================
log_info "📝 Configuration des logs utilisateur..."

# Créer un script pour logger les actions utilisateur
LOG_SCRIPT="$N8N_DIR/log-user-action.sh"

cat > "$LOG_SCRIPT" <<'LOG_EOF'
#!/bin/bash
# Script pour logger les actions utilisateur dans N8N

LOG_FILE="/var/n8n/logs/user-actions.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
USER_IP=${REMOTE_ADDR:-unknown}
USER_AGENT=${HTTP_USER_AGENT:-unknown}

echo "[$TIMESTAMP] User: $1 | Action: $2 | Workflow: $3 | IP: $USER_IP" >> "$LOG_FILE"
LOG_EOF

chmod +x "$LOG_SCRIPT"
chown "$N8N_USER:$N8N_USER" "$LOG_SCRIPT"

log_success "Système de logs utilisateur configuré"

# ============================================
# CRÉATION D'UN WEBHOOK DE BASE
# ============================================
log_info "🔗 Création d'un exemple de webhook..."

WEBHOOK_EXAMPLE="$N8N_DIR/webhook-example.json"

cat > "$WEBHOOK_EXAMPLE" <<'WEBHOOK_EOF'
{
  "name": "TalosPrime - Webhook Example",
  "nodes": [
    {
      "parameters": {},
      "id": "webhook-node",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300],
      "webhookId": "talosprime-webhook"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.NEXT_PUBLIC_APP_URL }}/api/webhooks/n8n",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-Webhook-Source",
              "value": "n8n"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "event",
              "value": "={{ $json.body.event }}"
            },
            {
              "name": "data",
              "value": "={{ $json.body.data }}"
            }
          ]
        }
      },
      "id": "http-request-node",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  }
}
WEBHOOK_EOF

chown "$N8N_USER:$N8N_USER" "$WEBHOOK_EXAMPLE"

log_success "Exemple de webhook créé dans $WEBHOOK_EXAMPLE"

# ============================================
# CONFIGURATION DU FIREWALL
# ============================================
log_info "🔒 Configuration du firewall..."

# Ouvrir le port 5678 uniquement en localhost (N8N sera accessible via Nginx)
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log_success "Firewall configuré"

# ============================================
# RÉSUMÉ FINAL
# ============================================
echo ""
echo "============================================"
log_success "Installation de N8N terminée avec succès !"
echo "============================================"
echo ""
echo "📋 Informations importantes :"
echo ""
echo "   🌐 URL d'accès: https://$N8N_DOMAIN"
echo "   👤 Utilisateur: $N8N_USERNAME"
echo "   📁 Données: $N8N_DIR/data"
echo "   📝 Logs: $N8N_DIR/logs"
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
echo "   # Sauvegarder manuellement"
echo "   sudo -u $N8N_USER $BACKUP_SCRIPT"
echo ""
echo "   # Voir les logs utilisateur"
echo "   tail -f $N8N_DIR/logs/user-actions.log"
echo ""
echo "📚 Documentation :"
echo "   - Exemple de webhook: $WEBHOOK_EXAMPLE"
echo "   - Configuration PM2: $PM2_CONFIG"
echo "   - Variables d'environnement: $ENV_FILE"
echo ""
echo "⚠️  IMPORTANT :"
echo "   1. Vérifiez que le DNS pointe vers ce serveur"
echo "   2. Testez l'accès à https://$N8N_DOMAIN"
echo "   3. Importez l'exemple de webhook dans N8N si nécessaire"
echo ""



