#!/bin/bash
# Script d'installation complète du serveur
# Usage: sudo ./scripts/installation-complete-serveur.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation complète du serveur"
echo "===================================="
echo ""
echo "Ce script va installer et configurer:"
echo "  - Node.js et npm"
echo "  - PM2 (gestionnaire de processus)"
echo "  - Nginx (serveur web)"
echo "  - Certbot (SSL)"
echo "  - Git"
echo "  - L'application Next.js"
echo "  - Configuration Nginx"
echo "  - Variables d'environnement"
echo ""
read -p "Continuer ? (o/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo "Installation annulée"
    exit 0
fi

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo ./scripts/installation-complete-serveur.sh"
    exit 1
fi

# Variables
APP_DIR="/var/www/talosprime"
APP_USER="www-data"
DOMAIN="www.talosprimes.com"
DOMAIN_NO_WWW="talosprimes.com"
REPO_URL="https://github.com/cyrilmedde-png/gestentauto.git"

echo ""
echo "1️⃣  Mise à jour du système..."
echo "----------------------------"
apt-get update
apt-get upgrade -y

echo ""
echo "2️⃣  Installation des dépendances de base..."
echo "------------------------------------------"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw

echo ""
echo "3️⃣  Installation de Node.js..."
echo "------------------------------"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js déjà installé: $NODE_VERSION"
else
    echo "📦 Installation de Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installé: $(node --version)"
fi

echo ""
echo "4️⃣  Installation de PM2..."
echo "-------------------------"
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 déjà installé"
else
    echo "📦 Installation de PM2..."
    npm install -g pm2
    pm2 startup systemd -u root --hp /root
    echo "✅ PM2 installé"
fi

echo ""
echo "5️⃣  Installation de Nginx..."
echo "----------------------------"
if command -v nginx &> /dev/null; then
    echo "✅ Nginx déjà installé: $(nginx -v 2>&1)"
else
    echo "📦 Installation de Nginx..."
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx installé et démarré"
fi

echo ""
echo "6️⃣  Installation de Certbot (SSL)..."
echo "-----------------------------------"
if command -v certbot &> /dev/null; then
    echo "✅ Certbot déjà installé"
else
    echo "📦 Installation de Certbot..."
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
fi

echo ""
echo "7️⃣  Configuration du firewall (UFW)..."
echo "--------------------------------------"
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "✅ Firewall configuré"

echo ""
echo "8️⃣  Création du répertoire de l'application..."
echo "---------------------------------------------"
if [ -d "$APP_DIR" ]; then
    echo "⚠️  Répertoire $APP_DIR existe déjà"
    read -p "Voulez-vous le supprimer et repartir de zéro ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        echo "🗑️  Suppression de l'ancien répertoire..."
        rm -rf "$APP_DIR"
    else
        echo "✅ Utilisation du répertoire existant"
    fi
fi

if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    chown -R $APP_USER:$APP_USER "$APP_DIR"
    echo "✅ Répertoire créé: $APP_DIR"
fi

echo ""
echo "9️⃣  Clonage du dépôt Git..."
echo "--------------------------"
cd "$APP_DIR" || exit 1

if [ -d ".git" ]; then
    echo "✅ Dépôt Git déjà présent"
    echo "   Mise à jour..."
    git pull origin main || {
        echo "⚠️  Erreur lors du git pull, continuation..."
    }
else
    echo "📦 Clonage du dépôt..."
    git clone "$REPO_URL" .
    echo "✅ Dépôt cloné"
fi

echo ""
echo "🔟 Configuration des variables d'environnement..."
echo "------------------------------------------------"
ENV_FILE="$APP_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    echo "✅ Fichier .env.production existe"
    echo "   Vérification des variables essentielles..."
    
    MISSING_VARS=()
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE"; then
        MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
    fi
    if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE"; then
        MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    fi
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE"; then
        MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    if ! grep -q "N8N_URL" "$ENV_FILE"; then
        MISSING_VARS+=("N8N_URL")
    fi
    if ! grep -q "N8N_BASIC_AUTH_USER" "$ENV_FILE"; then
        MISSING_VARS+=("N8N_BASIC_AUTH_USER")
    fi
    if ! grep -q "N8N_BASIC_AUTH_PASSWORD" "$ENV_FILE"; then
        MISSING_VARS+=("N8N_BASIC_AUTH_PASSWORD")
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Variables manquantes: ${MISSING_VARS[*]}"
        echo "   Vous devrez les ajouter manuellement dans $ENV_FILE"
    else
        echo "✅ Toutes les variables essentielles sont présentes"
    fi
else
    echo "❌ Fichier .env.production manquant"
    echo "   Création d'un fichier template..."
    cat > "$ENV_FILE" << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# N8N
N8N_URL=https://n8n.talosprimes.com
N8N_BASIC_AUTH_USER=
N8N_BASIC_AUTH_PASSWORD=

# Application
NEXT_PUBLIC_APP_URL=https://www.talosprimes.com
NODE_ENV=production
EOF
    chmod 600 "$ENV_FILE"
    echo "✅ Fichier template créé: $ENV_FILE"
    echo "   ⚠️  IMPORTANT: Éditez ce fichier et ajoutez vos variables d'environnement"
    echo "   Commande: nano $ENV_FILE"
fi

echo ""
echo "1️⃣1️⃣  Installation des dépendances npm..."
echo "--------------------------------------"
if [ -f "package.json" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
else
    echo "❌ package.json non trouvé"
    exit 1
fi

echo ""
echo "1️⃣2️⃣  Build de l'application..."
echo "-------------------------------"
echo "🔨 Compilation de l'application Next.js..."
npm run build
echo "✅ Build terminé"

echo ""
echo "1️⃣3️⃣  Configuration Nginx..."
echo "----------------------------"
NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

# Créer la configuration Nginx
cat > "$NGINX_CONFIG" << EOF
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NO_WWW $DOMAIN;
    
    # Redirection permanente vers HTTPS
    return 301 https://\$host\$request_uri;
}

# Configuration HTTPS (sans certificats SSL pour l'instant)
# Les certificats seront ajoutés automatiquement par Certbot
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN_NO_WWW $DOMAIN;
    
    # Certificats SSL (seront ajoutés par Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN_NO_WWW/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN_NO_WWW/privkey.pem;
    
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
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
else
    echo "❌ Erreur dans la configuration Nginx"
    nginx -t
    exit 1
fi

echo ""
echo "1️⃣4️⃣  Configuration SSL avec Certbot..."
echo "--------------------------------------"
echo "📋 Configuration SSL (nécessite que les DNS pointent vers ce serveur)"
echo ""
read -p "Voulez-vous configurer SSL maintenant ? (o/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo "📧 Entrez votre email pour les notifications Let's Encrypt:"
    read -p "Email: " CERTBOT_EMAIL
    
    if [ -z "$CERTBOT_EMAIL" ]; then
        CERTBOT_EMAIL="admin@talosprimes.com"
    fi
    
    echo "🔐 Obtention des certificats SSL..."
    certbot --nginx -d "$DOMAIN_NO_WWW" -d "$DOMAIN" \
        --non-interactive \
        --agree-tos \
        --email "$CERTBOT_EMAIL" \
        --redirect || {
        echo "⚠️  Erreur lors de la configuration SSL"
        echo "   Vérifiez que:"
        echo "   1. Les DNS pointent vers ce serveur"
        echo "   2. Les ports 80 et 443 sont ouverts"
        echo "   3. Le domaine est accessible depuis Internet"
        echo ""
        echo "   Vous pourrez réessayer plus tard avec:"
        echo "   certbot --nginx -d $DOMAIN_NO_WWW -d $DOMAIN"
    }
else
    echo "⏭️  Configuration SSL ignorée"
    echo "   Pour configurer SSL plus tard, exécutez:"
    echo "   certbot --nginx -d $DOMAIN_NO_WWW -d $DOMAIN"
fi

echo ""
echo "1️⃣5️⃣  Démarrage de l'application avec PM2..."
echo "--------------------------------------------"
# Arrêter l'application si elle tourne déjà
pm2 delete talosprime 2>/dev/null || true

# Démarrer l'application
cd "$APP_DIR"
pm2 start npm --name talosprime -- start
pm2 save

echo ""
echo "1️⃣6️⃣  Rechargement de Nginx..."
echo "-------------------------------"
systemctl reload nginx
echo "✅ Nginx rechargé"

echo ""
echo "1️⃣7️⃣  Vérification finale..."
echo "----------------------------"
sleep 3

# Vérifier PM2
if pm2 list | grep -q "talosprime.*online"; then
    echo "✅ Application PM2 en cours d'exécution"
else
    echo "⚠️  Application PM2 non démarrée"
    echo "   Vérifiez avec: pm2 logs talosprime"
fi

# Vérifier Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx est actif"
else
    echo "❌ Nginx n'est pas actif"
fi

# Vérifier les ports
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 en écoute (Next.js)"
else
    echo "⚠️  Port 3000 non en écoute"
fi

if netstat -tuln | grep -q ":443"; then
    echo "✅ Port 443 en écoute (HTTPS)"
else
    echo "⚠️  Port 443 non en écoute (SSL peut-être non configuré)"
fi

echo ""
echo "===================================="
echo "✅ Installation terminée !"
echo "===================================="
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Configurez les variables d'environnement:"
echo "   nano $ENV_FILE"
echo ""
echo "2. Si SSL n'est pas configuré, exécutez:"
echo "   certbot --nginx -d $DOMAIN_NO_WWW -d $DOMAIN"
echo ""
echo "3. Vérifiez les logs:"
echo "   pm2 logs talosprime"
echo "   tail -f /var/log/nginx/error.log"
echo ""
echo "4. Testez l'application:"
echo "   https://$DOMAIN"
echo ""
echo "5. Si problème Nginx avec talosprimes.com (sans www):"
echo "   cd $APP_DIR"
echo "   ./scripts/fix-nginx-talosprimes-com.sh"
echo ""

