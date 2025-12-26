#!/bin/bash
# Script pour vérifier et corriger la configuration Nginx pour proxyfier vers Next.js
# Usage: ./scripts/fix-nginx-proxy.sh

set -e

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
NGINX_ENABLED="/etc/nginx/sites-enabled/talosprime"

echo "🔧 Vérification et correction de la configuration Nginx"
echo "========================================================"
echo ""

# Vérifier que le fichier existe
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Fichier de configuration Nginx non trouvé: $NGINX_CONFIG"
    echo "💡 Cherchons d'autres fichiers de configuration..."
    
    # Chercher d'autres fichiers possibles
    if [ -f "/etc/nginx/sites-available/talosprimes.com" ]; then
        NGINX_CONFIG="/etc/nginx/sites-available/talosprimes.com"
        NGINX_ENABLED="/etc/nginx/sites-enabled/talosprimes.com"
        echo "✅ Fichier trouvé: $NGINX_CONFIG"
    elif [ -f "/etc/nginx/sites-available/www.talosprimes.com" ]; then
        NGINX_CONFIG="/etc/nginx/sites-available/www.talosprimes.com"
        NGINX_ENABLED="/etc/nginx/sites-enabled/www.talosprimes.com"
        echo "✅ Fichier trouvé: $NGINX_CONFIG"
    else
        echo "❌ Aucun fichier de configuration trouvé"
        echo "📋 Fichiers disponibles dans /etc/nginx/sites-available/:"
        ls -la /etc/nginx/sites-available/ | grep -v "^d" | awk '{print $9}' | grep -v "^$"
        exit 1
    fi
fi

echo "📄 Fichier de configuration: $NGINX_CONFIG"
echo ""

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Création d'une sauvegarde: $BACKUP_FILE"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée"
echo ""

# Vérifier si la configuration proxy existe déjà
if grep -q "location /" "$NGINX_CONFIG" && grep -q "proxy_pass.*3000" "$NGINX_CONFIG"; then
    echo "✅ Configuration proxy trouvée"
    
    # Vérifier si toutes les routes sont proxifiées
    if grep -q "location / {" "$NGINX_CONFIG"; then
        echo "✅ Route racine (/) est proxifiée"
    else
        echo "⚠️  Route racine (/) n'est pas proxifiée"
    fi
else
    echo "⚠️  Configuration proxy non trouvée ou incomplète"
fi

echo ""
echo "📋 Configuration actuelle (extrait):"
echo "-----------------------------------"
grep -A 10 "server {" "$NGINX_CONFIG" | head -20 || echo "Aucune configuration server trouvée"
echo ""

# Vérifier si Next.js est en cours d'exécution
echo "🔍 Vérification de Next.js..."
if pm2 list | grep -q "talosprime.*online"; then
    echo "✅ Next.js est en cours d'exécution (PM2)"
    PM2_STATUS=$(pm2 list | grep talosprime | awk '{print $10}')
    echo "   Statut: $PM2_STATUS"
else
    echo "❌ Next.js n'est PAS en cours d'exécution"
    echo "💡 Démarrez Next.js avec: pm2 start talosprime"
    exit 1
fi

# Vérifier que le port 3000 répond
echo ""
echo "🔍 Test de connexion au port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404\|403"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    echo "✅ Port 3000 répond (HTTP $HTTP_CODE)"
else
    echo "❌ Port 3000 ne répond pas"
    echo "💡 Vérifiez que Next.js est démarré et écoute sur le port 3000"
    exit 1
fi

echo ""
echo "📝 Configuration recommandée pour Nginx:"
echo "----------------------------------------"
cat << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name www.talosprimes.com talosprimes.com;

    # Redirection HTTPS
    return 301 https://www.talosprimes.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.talosprimes.com talosprimes.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/www.talosprimes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.talosprimes.com/privkey.pem;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Taille maximale des uploads
    client_max_body_size 50M;

    # Proxy vers Next.js pour TOUTES les routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket pour N8N
    location /rest/push {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
    }
}
EOF

echo ""
echo "❓ Voulez-vous que je modifie automatiquement la configuration ?"
echo "   (Cela créera une sauvegarde avant modification)"
echo ""
read -p "Continuer ? (o/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo "❌ Opération annulée"
    echo "💡 Modifiez manuellement: $NGINX_CONFIG"
    exit 0
fi

echo ""
echo "🔧 Modification de la configuration..."
echo ""

# Vérifier si le fichier contient déjà un bloc server pour www.talosprimes.com
if grep -q "server_name.*www.talosprimes.com" "$NGINX_CONFIG"; then
    echo "✅ Bloc server pour www.talosprimes.com trouvé"
    
    # Vérifier si location / existe
    if grep -q "location / {" "$NGINX_CONFIG"; then
        echo "✅ location / existe déjà"
        
        # Vérifier si proxy_pass pointe vers localhost:3000
        if grep -A 5 "location / {" "$NGINX_CONFIG" | grep -q "proxy_pass.*localhost:3000"; then
            echo "✅ proxy_pass vers localhost:3000 trouvé"
        else
            echo "⚠️  proxy_pass ne pointe pas vers localhost:3000"
            echo "💡 Modification nécessaire - veuillez vérifier manuellement"
        fi
    else
        echo "⚠️  location / n'existe pas"
        echo "💡 Ajout de location /..."
        # Cette partie nécessiterait une modification plus complexe du fichier
        echo "⚠️  Modification automatique complexe - veuillez modifier manuellement"
    fi
else
    echo "❌ Bloc server pour www.talosprimes.com non trouvé"
    echo "💡 Veuillez vérifier la configuration manuellement"
fi

echo ""
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    echo ""
    echo "🔄 Rechargement de Nginx..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "💡 Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "✅ Sauvegarde restaurée"
    exit 1
fi

echo ""
echo "========================================================"
echo "✅ Configuration Nginx vérifiée"
echo ""
echo "📋 Vérifications à faire:"
echo "   1. Testez https://www.talosprimes.com/platform/n8n"
echo "   2. Vérifiez les logs Nginx: tail -f /var/log/nginx/error.log"
echo "   3. Vérifiez les logs Next.js: pm2 logs talosprime"
echo ""
echo "💾 Sauvegarde: $BACKUP_FILE"
echo ""



