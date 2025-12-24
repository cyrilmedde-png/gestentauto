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

# Détecter où N8N est accessible
echo "🔍 Détection de l'emplacement N8N..."
N8N_PROXY=""
if curl -k -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com | grep -q "200\|401\|302"; then
    N8N_PROXY="https://n8n.talosprimes.com"
    echo "✅ N8N détecté sur: $N8N_PROXY"
elif curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401\|302"; then
    N8N_PROXY="http://localhost:5678"
    echo "✅ N8N détecté sur: $N8N_PROXY"
else
    # Par défaut, utiliser le sous-domaine
    N8N_PROXY="https://n8n.talosprimes.com"
    echo "⚠️  N8N non détecté, utilisation par défaut: $N8N_PROXY"
fi
echo ""

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Vérifier si la configuration WebSocket existe
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo "✅ Configuration WebSocket /rest/push existe déjà"
    
    # Vérifier si elle proxifie vers N8N (pas Next.js)
    if grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "proxy_pass.*n8n"; then
        echo "✅ Configuration WebSocket proxifie vers N8N"
    else
        echo "⚠️  Configuration WebSocket incorrecte (proxifie vers Next.js au lieu de N8N)"
        echo "   Correction nécessaire..."
        
        # Remplacer la section /rest/push complète
        # Déterminer le Host header
        if echo "$N8N_PROXY" | grep -q "https://"; then
            N8N_HOST="n8n.talosprimes.com"
        else
            N8N_HOST="\$host"
        fi
        
        sed -i '/location \/rest\/push/,/^[[:space:]]*}/ {
            /location \/rest\/push/ {
                r /dev/stdin
            }
            /^[[:space:]]*}/!d
        }' "$NGINX_CONFIG" << EOF
    location /rest/push {
        proxy_pass $N8N_PROXY;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $N8N_HOST;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
EOF
        echo "✅ Configuration WebSocket corrigée pour proxifier vers N8N"
    fi
    
    # Vérifier si elle a les bons headers
    if grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "Upgrade.*upgrade"; then
        echo "✅ Headers WebSocket corrects"
    else
        echo "⚠️  Headers WebSocket manquants, ajout..."
        # Ajouter les headers manquants
        sed -i '/location \/rest\/push/a\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";
' "$NGINX_CONFIG"
    fi
else
    echo "📝 Ajout de la configuration WebSocket..."
    
    # Trouver le bloc server pour www.talosprimes.com
    # Ajouter la configuration WebSocket avant la fermeture du bloc
    # Utiliser une variable shell pour passer N8N_PROXY à awk
    awk -v n8n_proxy="$N8N_PROXY" -v n8n_host=$(echo "$N8N_PROXY" | sed 's|https\?://||' | cut -d: -f1) '
    /server_name.*www\.talosprimes\.com/ || /server_name.*talosprimes\.com.*www\.talosprimes\.com/ {
        in_correct_block=1
    }
    /^}/ && in_correct_block {
        # Insérer la configuration WebSocket avant la fermeture
        # IMPORTANT: Proxifier directement vers N8N, pas vers Next.js
        print "    # WebSocket pour N8N - proxifier directement vers N8N"
        print "    location /rest/push {"
        print "        proxy_pass " n8n_proxy ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Upgrade $http_upgrade;"
        print "        proxy_set_header Connection \"upgrade\";"
        if (n8n_proxy ~ /https:\/\//) {
            print "        proxy_set_header Host n8n.talosprimes.com;"
        } else {
            print "        proxy_set_header Host $host;"
        }
        print "        proxy_set_header X-Real-IP $remote_addr;"
        print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
        print "        proxy_set_header X-Forwarded-Proto $scheme;"
        print "        proxy_read_timeout 86400;"
        print "        proxy_send_timeout 86400;"
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

