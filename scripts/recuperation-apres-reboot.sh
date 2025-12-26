#!/bin/bash
# Script de récupération après reboot du serveur
# Usage: ./scripts/recuperation-apres-reboot.sh

echo "🚨 Récupération après reboot du serveur"
echo "======================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "   Utilisez: sudo ./scripts/recuperation-apres-reboot.sh"
    exit 1
fi

echo "1️⃣  Vérification de l'état du serveur..."
echo "--------------------------------------"

# Vérifier Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installé: $NODE_VERSION"
else
    echo "❌ Node.js non installé"
    echo "   Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Vérifier PM2
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 installé"
else
    echo "❌ PM2 non installé"
    echo "   Installation de PM2..."
    npm install -g pm2
fi

# Vérifier Nginx
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1)
    echo "✅ Nginx installé: $NGINX_VERSION"
else
    echo "❌ Nginx non installé"
    echo "   Installation de Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Vérifier Git
if command -v git &> /dev/null; then
    echo "✅ Git installé"
else
    echo "❌ Git non installé"
    echo "   Installation de Git..."
    apt-get install -y git
fi

echo ""
echo "2️⃣  Vérification du répertoire de l'application..."
echo "------------------------------------------------"

APP_DIR="/var/www/talosprime"
if [ -d "$APP_DIR" ]; then
    echo "✅ Répertoire $APP_DIR existe"
    cd "$APP_DIR" || exit 1
else
    echo "❌ Répertoire $APP_DIR n'existe pas"
    echo "   Création du répertoire..."
    mkdir -p "$APP_DIR"
    cd "$APP_DIR" || exit 1
    
    echo "   Clonage du dépôt..."
    git clone https://github.com/cyrilmedde-png/gestentauto.git .
fi

echo ""
echo "3️⃣  Mise à jour du code..."
echo "-------------------------"
git pull origin main || {
    echo "⚠️  Erreur lors du git pull"
    echo "   Vérification de la connexion Git..."
}

echo ""
echo "4️⃣  Vérification des variables d'environnement..."
echo "------------------------------------------------"
ENV_FILE="$APP_DIR/.env.production"
if [ -f "$ENV_FILE" ]; then
    echo "✅ Fichier .env.production existe"
    # Vérifier les variables essentielles
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" && grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE"; then
        echo "✅ Variables Supabase présentes"
    else
        echo "⚠️  Variables Supabase manquantes dans .env.production"
    fi
    
    if grep -q "N8N_URL" "$ENV_FILE" && grep -q "N8N_BASIC_AUTH_USER" "$ENV_FILE"; then
        echo "✅ Variables N8N présentes"
    else
        echo "⚠️  Variables N8N manquantes dans .env.production"
    fi
else
    echo "❌ Fichier .env.production manquant"
    echo "   💡 Vous devez créer ce fichier avec vos variables d'environnement"
fi

echo ""
echo "5️⃣  Installation des dépendances..."
echo "----------------------------------"
if [ -f "package.json" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
    echo "✅ Dépendances installées"
else
    echo "❌ package.json non trouvé"
fi

echo ""
echo "6️⃣  Vérification de PM2..."
echo "-------------------------"
PM2_STATUS=$(pm2 list 2>/dev/null | grep -i "talosprime\|next" | wc -l)
if [ "$PM2_STATUS" -gt 0 ]; then
    echo "✅ Application trouvée dans PM2"
    pm2 list
else
    echo "⚠️  Application non trouvée dans PM2"
    echo "   Vous devrez la démarrer avec: pm2 start npm --name talosprime -- start"
fi

echo ""
echo "7️⃣  Vérification de Nginx..."
echo "---------------------------"
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx est actif"
else
    echo "⚠️  Nginx n'est pas actif"
    echo "   Démarrage de Nginx..."
    systemctl start nginx
    systemctl enable nginx
fi

# Vérifier la configuration Nginx
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Configuration Nginx valide"
else
    echo "❌ Erreur dans la configuration Nginx"
    nginx -t
fi

echo ""
echo "8️⃣  Vérification des ports..."
echo "----------------------------"
# Vérifier le port 3000 (Next.js)
if netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 en écoute (Next.js)"
else
    echo "⚠️  Port 3000 non en écoute"
fi

# Vérifier le port 80 (HTTP)
if netstat -tuln | grep -q ":80"; then
    echo "✅ Port 80 en écoute (HTTP)"
else
    echo "⚠️  Port 80 non en écoute"
fi

# Vérifier le port 443 (HTTPS)
if netstat -tuln | grep -q ":443"; then
    echo "✅ Port 443 en écoute (HTTPS)"
else
    echo "⚠️  Port 443 non en écoute"
fi

echo ""
echo "======================================="
echo "📋 Résumé et actions à faire:"
echo "======================================="
echo ""
echo "✅ Vérifications terminées"
echo ""
echo "💡 Si des éléments manquent, voici les commandes à exécuter:"
echo ""
echo "1. Si .env.production manque:"
echo "   cp .env.example .env.production"
echo "   nano .env.production  # Éditez avec vos variables"
echo ""
echo "2. Si l'application n'est pas dans PM2:"
echo "   cd /var/www/talosprime"
echo "   npm run build"
echo "   pm2 start npm --name talosprime -- start"
echo "   pm2 save"
echo "   pm2 startup  # Pour démarrer au boot"
echo ""
echo "3. Si Nginx n'est pas configuré:"
echo "   ./scripts/fix-nginx-talosprimes-com.sh"
echo ""
echo "4. Vérifier les logs:"
echo "   pm2 logs talosprime"
echo "   tail -f /var/log/nginx/error.log"
echo ""



