#!/bin/bash
# Script pour corriger la configuration Nginx en retirant les références SSL
# jusqu'à ce que les certificats soient obtenus
# Usage: sudo ./scripts/fix-nginx-sans-ssl.sh

echo "🔧 Correction de la configuration Nginx (sans SSL)"
echo "=================================================="
echo ""

# Trouver le fichier de configuration
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/talosprime" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
elif [ -f "/etc/nginx/sites-available/talosprimes" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprimes"
else
    echo "❌ Erreur: Impossible de trouver le fichier de configuration Nginx"
    exit 1
fi

echo "✅ Fichier trouvé: $NGINX_CONFIG"
echo ""

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Vérifier si les certificats existent
if [ -f "/etc/letsencrypt/live/talosprimes.com/fullchain.pem" ]; then
    echo "✅ Certificats SSL existent déjà"
    echo "   La configuration devrait fonctionner"
    nginx -t
    exit 0
fi

echo "📝 Modification de la configuration pour retirer les références SSL..."
echo ""

# Créer une nouvelle configuration sans les lignes SSL
cat > "$NGINX_CONFIG" << 'EOF'
# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name talosprimes.com www.talosprimes.com;
    
    # Pour l'instant, servir directement (redirection après obtention SSL)
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
    }
}

# Configuration HTTPS (sera activée après obtention des certificats)
# Certbot ajoutera automatiquement cette section
EOF

echo "✅ Configuration modifiée (HTTP uniquement pour l'instant)"
echo ""

# Tester la configuration
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    echo ""
    
    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
    echo ""
    
    echo "📋 Prochaines étapes:"
    echo "   1. Vérifiez que les DNS pointent vers ce serveur"
    echo "   2. Vérifiez que les ports 80 et 443 sont ouverts"
    echo "   3. Obtenez les certificats SSL avec:"
    echo "      certbot --nginx -d talosprimes.com -d www.talosprimes.com"
    echo ""
    echo "   Certbot modifiera automatiquement la configuration pour ajouter HTTPS"
    echo ""
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "   Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi




