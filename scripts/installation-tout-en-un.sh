#!/bin/bash
# Script d'installation complète : Serveur + Application + N8N
# Usage: sudo ./scripts/installation-tout-en-un.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Installation complète : Serveur + Application + N8N"
echo "======================================================"
echo ""
echo "Ce script va installer et configurer:"
echo "  ✅ Node.js et npm"
echo "  ✅ PM2 (gestionnaire de processus)"
echo "  ✅ Nginx (serveur web)"
echo "  ✅ Certbot (SSL)"
echo "  ✅ N8N (automatisation)"
echo "  ✅ Application Next.js"
echo "  ✅ Configuration complète"
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
    echo "   Utilisez: sudo ./scripts/installation-tout-en-un.sh"
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
    ufw \
    docker.io \
    docker-compose

# Démarrer Docker
systemctl enable docker
systemctl start docker

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
ufw allow $N8N_PORT/tcp  # N8N
echo "✅ Firewall configuré"

echo ""
echo "8️⃣  Installation et configuration de N8N..."
echo "------------------------------------------"
# Vérifier si N8N est déjà installé
if pm2 list | grep -q "n8n"; then
    echo "✅ N8N déjà installé dans PM2"
else
    echo "📦 Installation de N8N..."
    npm install -g n8n
    
    # Créer le répertoire de données N8N
    mkdir -p /root/.n8n
    chmod 755 /root/.n8n
    
    # Démarrer N8N avec PM2
    pm2 start n8n --name n8n -- \
        --port=$N8N_PORT \
        --host=0.0.0.0 \
        --protocol=https \
        --tls-key=/etc/letsencrypt/live/$N8N_DOMAIN/privkey.pem \
        --tls-cert=/etc/letsencrypt/live/$N8N_DOMAIN/fullchain.pem
    
    pm2 save
    echo "✅ N8N installé et démarré sur le port $N8N_PORT"
fi

echo ""
echo "9️⃣  Création du répertoire de l'application..."
echo "---------------------------------------------"
if [ -d "$APP_DIR" ]; then
    echo "⚠️  Répertoire $APP_DIR existe déjà"
    read -p "Voulez-vous le supprimer et repartir de zéro ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        echo "🗑️  Suppression de l'ancien répertoire..."
        pm2 delete talosprime 2>/dev/null || true
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
echo "🔟 Clonage du dépôt Git..."
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
echo "1️⃣1️⃣  Configuration des variables d'environnement..."
echo "------------------------------------------------"
ENV_FILE="$APP_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    echo "✅ Fichier .env.production existe"
    echo "   Vérification des variables essentielles..."
    
    MISSING_VARS=()
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" || [ -z "$(grep 'NEXT_PUBLIC_SUPABASE_URL' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
    fi
    if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE" || [ -z "$(grep 'NEXT_PUBLIC_SUPABASE_ANON_KEY' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    fi
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE" || [ -z "$(grep 'SUPABASE_SERVICE_ROLE_KEY' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    if ! grep -q "N8N_URL" "$ENV_FILE" || [ -z "$(grep 'N8N_URL' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("N8N_URL")
    fi
    if ! grep -q "N8N_BASIC_AUTH_USER" "$ENV_FILE" || [ -z "$(grep 'N8N_BASIC_AUTH_USER' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("N8N_BASIC_AUTH_USER")
    fi
    if ! grep -q "N8N_BASIC_AUTH_PASSWORD" "$ENV_FILE" || [ -z "$(grep 'N8N_BASIC_AUTH_PASSWORD' "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')" ]; then
        MISSING_VARS+=("N8N_BASIC_AUTH_PASSWORD")
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Variables manquantes ou vides: ${MISSING_VARS[*]}"
        echo "   Vous devrez les ajouter manuellement dans $ENV_FILE"
    else
        echo "✅ Toutes les variables essentielles sont présentes"
    fi
else
    echo "❌ Fichier .env.production manquant"
    echo "   Création d'un fichier template..."
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
    echo "   ⚠️  IMPORTANT: Éditez ce fichier et ajoutez vos variables d'environnement"
    echo "   Commande: nano $ENV_FILE"
fi

echo ""
echo "1️⃣2️⃣  Installation des dépendances npm..."
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
echo "1️⃣3️⃣  Build de l'application..."
echo "-------------------------------"
echo "🔨 Compilation de l'application Next.js..."
npm run build
echo "✅ Build terminé"

echo ""
echo "1️⃣4️⃣  Configuration Nginx complète..."
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
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
else
    echo "❌ Erreur dans la configuration Nginx"
    nginx -t
    exit 1
fi

echo ""
echo "1️⃣5️⃣  Configuration SSL avec Certbot (si nécessaire)..."
echo "------------------------------------------------------"
if [ "$HAS_SSL" = false ]; then
    echo "📋 Certificats SSL manquants pour $DOMAIN_NO_WWW"
    read -p "Voulez-vous obtenir les certificats SSL maintenant ? (o/N): " -n 1 -r
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
            echo "⚠️  Erreur lors de l'obtention des certificats SSL"
            echo "   Vérifiez que les DNS pointent vers ce serveur"
        }
    fi
else
    echo "✅ Certificats SSL déjà présents pour $DOMAIN_NO_WWW"
fi

if [ "$HAS_N8N_SSL" = false ]; then
    echo "📋 Certificats SSL manquants pour $N8N_DOMAIN"
    read -p "Voulez-vous obtenir les certificats SSL pour N8N maintenant ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        if [ -z "$CERTBOT_EMAIL" ]; then
            read -p "Email: " CERTBOT_EMAIL
        fi
        if [ -z "$CERTBOT_EMAIL" ]; then
            CERTBOT_EMAIL="admin@talosprimes.com"
        fi
        
        echo "🔐 Obtention des certificats SSL pour N8N..."
        certbot --nginx -d "$N8N_DOMAIN" \
            --non-interactive \
            --agree-tos \
            --email "$CERTBOT_EMAIL" \
            --redirect || {
            echo "⚠️  Erreur lors de l'obtention des certificats SSL pour N8N"
        }
    fi
else
    echo "✅ Certificats SSL déjà présents pour $N8N_DOMAIN"
fi

echo ""
echo "1️⃣6️⃣  Démarrage de l'application avec PM2..."
echo "--------------------------------------------"
# Arrêter l'application si elle tourne déjà
pm2 delete talosprime 2>/dev/null || true

# Démarrer l'application
cd "$APP_DIR"
pm2 start npm --name talosprime -- start
pm2 save

echo ""
echo "1️⃣7️⃣  Vérification finale..."
echo "----------------------------"
sleep 3

# Vérifier PM2
echo "📋 État des processus PM2:"
pm2 list

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

if netstat -tuln | grep -q ":$N8N_PORT"; then
    echo "✅ Port $N8N_PORT en écoute (N8N)"
else
    echo "⚠️  Port $N8N_PORT non en écoute (N8N)"
fi

if netstat -tuln | grep -q ":443"; then
    echo "✅ Port 443 en écoute (HTTPS)"
else
    echo "⚠️  Port 443 non en écoute"
fi

echo ""
echo "======================================================"
echo "✅ Installation complète terminée !"
echo "======================================================"
echo ""
echo "📋 Résumé:"
echo "  ✅ Node.js installé"
echo "  ✅ PM2 installé et configuré"
echo "  ✅ Nginx installé et configuré"
echo "  ✅ N8N installé et démarré"
echo "  ✅ Application Next.js buildée et démarrée"
echo ""
echo "📋 URLs:"
echo "  🌐 Application: https://$DOMAIN"
echo "  🔧 N8N: https://$N8N_DOMAIN"
echo ""
echo "💡 Commandes utiles:"
echo "  - Voir les logs: pm2 logs"
echo "  - Redémarrer: pm2 restart all"
echo "  - Vérifier Nginx: nginx -t && systemctl status nginx"
echo "  - Vérifier les certificats SSL: certbot certificates"
echo ""





