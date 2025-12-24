#!/bin/bash
# Script pour vérifier et corriger la configuration WebSocket dans Nginx
# Usage: sudo ./scripts/fix-websocket-nginx.sh

echo "🔧 Correction de la configuration WebSocket Nginx"
echo "=================================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    exit 1
fi

# Trouver le fichier de configuration
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/talosprime" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
elif [ -f "/etc/nginx/sites-available/talosprimes" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprimes"
else
    echo "❌ Fichier de configuration Nginx non trouvé"
    exit 1
fi

echo "✅ Fichier trouvé: $NGINX_CONFIG"
echo ""

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Vérifier si la configuration WebSocket existe
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo "✅ Configuration WebSocket /rest/push existe déjà"
    
    # Vérifier si elle a les bons headers
    if grep -A 5 "location /rest/push" "$NGINX_CONFIG" | grep -q "Upgrade.*upgrade"; then
        echo "✅ Headers WebSocket corrects"
    else
        echo "⚠️  Headers WebSocket manquants, correction..."
        # Remplacer la section /rest/push
        sed -i '/location \/rest\/push/,/}/ {
            /location \/rest\/push/ {
                a\
    proxy_http_version 1.1;\
    proxy_set_header Upgrade $http_upgrade;\
    proxy_set_header Connection "upgrade";
            }
        }' "$NGINX_CONFIG"
    fi
else
    echo "📝 Ajout de la configuration WebSocket..."
    
    # Trouver le bloc server pour www.talosprimes.com
    # Ajouter la configuration WebSocket avant la fermeture du bloc
    awk '
    /server_name.*www\.talosprimes\.com/ || /server_name.*talosprimes\.com.*www\.talosprimes\.com/ {
        in_correct_block=1
    }
    /^}/ && in_correct_block {
        # Insérer la configuration WebSocket avant la fermeture
        print "    # WebSocket pour N8N"
        print "    location /rest/push {"
        print "        proxy_pass http://localhost:3000;"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Upgrade $http_upgrade;"
        print "        proxy_set_header Connection \"upgrade\";"
        print "        proxy_set_header Host $host;"
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "    }"
        print ""
        in_correct_block=0
    }
    { print }
    ' "$NGINX_CONFIG" > "${NGINX_CONFIG}.tmp" && mv "${NGINX_CONFIG}.tmp" "$NGINX_CONFIG"
    
    echo "✅ Configuration WebSocket ajoutée"
fi

# Tester la configuration
echo ""
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration Nginx valide"
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur dans la configuration Nginx"
    echo "   Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

echo ""
echo "=================================================="
echo "✅ Configuration WebSocket corrigée"
echo ""
echo "💡 Les WebSockets vers /rest/push devraient maintenant fonctionner"
echo ""

