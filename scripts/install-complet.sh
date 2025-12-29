#!/bin/bash
# Script d'installation complète : Serveur + Application + N8N
# Usage: sudo bash install-complet.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation complète : Serveur + Application + N8N"
echo "======================================================"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo bash install-complet.sh"
    exit 1
fi

# Variables
APP_DIR="/var/www/talosprime"
APP_USER="www-data"
DOMAIN="www.talosprimes.com"
DOMAIN_NO_WWW="talosprimes.com"
REPO_URL="https://github.com/cyrilmedde-png/gestentauto.git"
N8N_PORT=5678
N8N_DOMAIN="n8n.talosprimes.com"

echo "1️⃣  Correction des permissions Git..."
echo "-----------------------------------"
# Corriger le problème de propriété Git
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
chown -R root:root "$APP_DIR" 2>/dev/null || true
echo "✅ Permissions Git corrigées"

echo ""
echo "2️⃣  Mise à jour du système..."
echo "----------------------------"
apt-get update -qq
apt-get upgrade -y -qq

echo ""
echo "3️⃣  Installation des dépendances de base..."
echo "------------------------------------------"
apt-get install -y -qq \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    net-tools

echo ""
echo "4️⃣  Installation de Node.js..."
echo "------------------------------"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js déjà installé: $NODE_VERSION"
else
    echo "📦 Installation de Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs
    echo "✅ Node.js installé: $(node --version)"
fi

echo ""
echo "5️⃣  Installation de PM2..."
echo "-------------------------"
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 déjà installé"
else
    echo "📦 Installation de PM2..."
    npm install -g pm2 > /dev/null 2>&1
    pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true
    echo "✅ PM2 installé"
fi

echo ""
echo "6️⃣  Installation de Nginx..."
echo "----------------------------"
if command -v nginx &> /dev/null; then
    echo "✅ Nginx déjà installé"
else
    echo "📦 Installation de Nginx..."
    apt-get install -y -qq nginx
    systemctl enable nginx > /dev/null 2>&1
    systemctl start nginx
    echo "✅ Nginx installé et démarré"
fi

echo ""
echo "7️⃣  Installation de Certbot (SSL)..."
echo "-----------------------------------"
if command -v certbot &> /dev/null; then
    echo "✅ Certbot déjà installé"
else
    echo "📦 Installation de Certbot..."
    apt-get install -y -qq certbot python3-certbot-nginx
    echo "✅ Certbot installé"
fi

echo ""
echo "8️⃣  Configuration du firewall (UFW)..."
echo "--------------------------------------"
ufw --force enable > /dev/null 2>&1 || true
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw allow $N8N_PORT/tcp > /dev/null 2>&1
echo "✅ Firewall configuré"

echo ""
echo "9️⃣  Installation et configuration de N8N..."
echo "------------------------------------------"
if pm2 list | grep -q "n8n.*online"; then
    echo "✅ N8N déjà installé et en cours d'exécution"
else
    echo "📦 Installation de N8N..."
    npm install -g n8n > /dev/null 2>&1
    
    # Créer le répertoire de données N8N
    mkdir -p /root/.n8n
    chmod 755 /root/.n8n
    
    # Démarrer N8N avec PM2
    pm2 delete n8n 2>/dev/null || true
    pm2 start n8n --name n8n -- \
        --port=$N8N_PORT \
        --host=0.0.0.0 > /dev/null 2>&1
    
    pm2 save > /dev/null 2>&1
    echo "✅ N8N installé et démarré sur le port $N8N_PORT"
fi

echo ""
echo "🔟 Configuration du répertoire de l'application..."
echo "------------------------------------------------"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    echo "✅ Répertoire créé: $APP_DIR"
fi

cd "$APP_DIR" || exit 1

# Corriger les permissions
chown -R root:root "$APP_DIR" 2>/dev/null || true
git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true

echo ""
echo "1️⃣1️⃣  Mise à jour du code depuis Git..."
echo "--------------------------------------"
if [ -d ".git" ]; then
    echo "✅ Dépôt Git présent"
    git pull origin main || {
        echo "⚠️  Erreur lors du git pull, tentative de clone..."
        cd /tmp
        rm -rf talosprime-tmp
        git clone "$REPO_URL" talosprime-tmp
        cp -r talosprime-tmp/* "$APP_DIR/"
        cp -r talosprime-tmp/.git "$APP_DIR/" 2>/dev/null || true
        rm -rf talosprime-tmp
        cd "$APP_DIR"
    }
else
    echo "📦 Clonage du dépôt..."
    git clone "$REPO_URL" .
fi

# S'assurer que le script existe
if [ ! -f "scripts/installation-tout-en-un.sh" ]; then
    echo "⚠️  Script installation-tout-en-un.sh non trouvé"
    echo "   Vérification des scripts disponibles..."
    ls -la scripts/ | head -10
fi

echo ""
echo "1️⃣2️⃣  Configuration des variables d'environnement..."
echo "------------------------------------------------"
ENV_FILE="$APP_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Création du fichier .env.production..."
    cat > "$ENV_FILE" << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# N8N
N8N_URL=https://$N8N_DOMAIN
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=

# Application
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF
    chmod 600 "$ENV_FILE"
    echo "✅ Fichier template créé: $ENV_FILE"
    echo "   ⚠️  IMPORTANT: Éditez ce fichier et ajoutez vos variables"
else
    echo "✅ Fichier .env.production existe"
fi

echo ""
echo "1️⃣3️⃣  Installation des dépendances npm..."
echo "--------------------------------------"
if [ -f "package.json" ]; then
    echo "📦 Installation des dépendances..."
    npm install > /dev/null 2>&1
    echo "✅ Dépendances installées"
else
    echo "❌ package.json non trouvé"
    exit 1
fi

echo ""
echo "1️⃣4️⃣  Build de l'application..."
echo "-------------------------------"
echo "🔨 Compilation de l'application Next.js..."
npm run build
echo "✅ Build terminé"

echo ""
echo "1️⃣5️⃣  Configuration Nginx complète..."
echo "------------------------------------"
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

# Vérifier si les certificats SSL existent
SSL_CERT="/etc/letsencrypt/live/$DOMAIN_NO_WWW/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/$DOMAIN_NO_WWW/privkey.pem"
SSL_N8N_CERT="/etc/letsencrypt/live/$N8N_DOMAIN/fullchain.pem"
SSL_N8N_KEY="/etc/letsencrypt/live/$N8N_DOMAIN/privkey.pem"

HAS_SSL=false
HAS_N8N_SSL=false

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    HAS_SSL=true
    echo "✅ Certificats SSL trouvés pour $DOMAIN_NO_WWW"
fi

if [ -f "$SSL_N8N_CERT" ] && [ -f "$SSL_N8N_KEY" ]; then
    HAS_N8N_SSL=true
    echo "✅ Certificats SSL trouvés pour $N8N_DOMAIN"
fi

# Créer la configuration Nginx
cat > "$NGINX_CONFIG" << EOF
# Redirection HTTP vers HTTPS pour www.talosprimes.com
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NO_WWW $DOMAIN;
    
    # Redirection permanente vers HTTPS
    return 301 https://\$host\$request_uri;
}

# Configuration HTTPS pour www.talosprimes.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_NO_WWW $DOMAIN;
    
EOF

# Ajouter les certificats SSL si disponibles
if [ "$HAS_SSL" = true ]; then
    cat >> "$NGINX_CONFIG" << EOF
    # Certificats SSL
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
EOF
else
    cat >> "$NGINX_CONFIG" << EOF
    # Certificats SSL (à configurer avec Certbot)
    # ssl_certificate $SSL_CERT;
    # ssl_certificate_key $SSL_KEY;
    
EOF
fi

cat >> "$NGINX_CONFIG" << EOF
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Taille maximale des uploads
    client_max_body_size 100M;
    
    # Proxy vers Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket pour N8N
    location /rest/push {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Configuration HTTPS pour N8N
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $N8N_DOMAIN;
    
EOF

# Ajouter les certificats SSL N8N si disponibles
if [ "$HAS_N8N_SSL" = true ]; then
    cat >> "$NGINX_CONFIG" << EOF
    # Certificats SSL
    ssl_certificate $SSL_N8N_CERT;
    ssl_certificate_key $SSL_N8N_KEY;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
EOF
else
    cat >> "$NGINX_CONFIG" << EOF
    # Certificats SSL (à configurer avec Certbot)
    # ssl_certificate $SSL_N8N_CERT;
    # ssl_certificate_key $SSL_N8N_KEY;
    
EOF
fi

cat >> "$NGINX_CONFIG" << EOF
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
    }
    
    # WebSocket pour N8N
    location /rest/push {
        proxy_pass http://localhost:$N8N_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Activer la configuration
if [ -f "/etc/nginx/sites-enabled/talosprime" ]; then
    rm /etc/nginx/sites-enabled/talosprime
fi
ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/

# Désactiver la configuration par défaut
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Tester la configuration
if nginx -t > /dev/null 2>&1; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
else
    echo "⚠️  Erreur dans la configuration Nginx (peut-être certificats manquants)"
    echo "   Test détaillé:"
    nginx -t || true
    echo ""
    echo "   Si erreur de certificats, ils seront ajoutés par Certbot"
fi

echo ""
echo "1️⃣6️⃣  Démarrage de l'application avec PM2..."
echo "--------------------------------------------"
pm2 delete talosprime 2>/dev/null || true
cd "$APP_DIR"
pm2 start npm --name talosprime -- start
pm2 save > /dev/null 2>&1
echo "✅ Application démarrée avec PM2"

echo ""
echo "1️⃣7️⃣  Vérification finale..."
echo "----------------------------"
sleep 3

echo "📋 État des processus PM2:"
pm2 list

echo ""
echo "📋 Ports en écoute:"
netstat -tuln | grep -E ":(3000|443|80|$N8N_PORT)" || echo "   Aucun port détecté"

echo ""
echo "======================================================"
echo "✅ Installation complète terminée !"
echo "======================================================"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurez les variables d'environnement:"
echo "   nano $ENV_FILE"
echo ""
echo "2. Si certificats SSL manquants:"
echo "   certbot --nginx -d $DOMAIN_NO_WWW -d $DOMAIN"
echo "   certbot --nginx -d $N8N_DOMAIN"
echo ""
echo "3. Vérifiez les logs:"
echo "   pm2 logs"
echo "   tail -f /var/log/nginx/error.log"
echo ""
echo "4. URLs:"
echo "   🌐 Application: https://$DOMAIN"
echo "   🔧 N8N: https://$N8N_DOMAIN"
echo ""






