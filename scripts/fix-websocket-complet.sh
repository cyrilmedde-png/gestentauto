#!/bin/bash
# Script complet pour corriger les erreurs WebSocket N8N
# Usage: sudo ./scripts/fix-websocket-complet.sh

echo "🔧 Correction complète des WebSockets N8N"
echo "=========================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

# Trouver le fichier de configuration Nginx
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/talosprime" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
elif [ -f "/etc/nginx/sites-available/talosprimes" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprimes"
else
    echo "❌ Fichier de configuration Nginx non trouvé"
    echo "   Cherché dans: /etc/nginx/sites-available/talosprime et talosprimes"
    exit 1
fi

echo "✅ Fichier de configuration trouvé: $NGINX_CONFIG"
echo ""

# Détecter où N8N est accessible
echo "🔍 Détection de l'emplacement N8N..."
N8N_PROXY=""
N8N_HOST=""

# Essayer HTTPS d'abord
if curl -k -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com 2>/dev/null | grep -q "200\|401\|302"; then
    N8N_PROXY="https://n8n.talosprimes.com"
    N8N_HOST="n8n.talosprimes.com"
    echo "✅ N8N détecté sur: $N8N_PROXY"
# Essayer HTTP local
elif curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null | grep -q "200\|401\|302"; then
    N8N_PROXY="http://localhost:5678"
    N8N_HOST="\$host"
    echo "✅ N8N détecté sur: $N8N_PROXY"
else
    # Par défaut, utiliser le sous-domaine HTTPS
    N8N_PROXY="https://n8n.talosprimes.com"
    N8N_HOST="n8n.talosprimes.com"
    echo "⚠️  N8N non détecté, utilisation par défaut: $N8N_PROXY"
fi
echo ""

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Vérifier si la configuration /rest/push existe
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo "📋 Configuration /rest/push existe déjà"
    
    # Vérifier vers où elle proxifie
    CURRENT_PROXY=$(grep -A 2 "location /rest/push" "$NGINX_CONFIG" | grep "proxy_pass" | head -1 | awk '{print $2}' | tr -d ';')
    
    if echo "$CURRENT_PROXY" | grep -q "localhost:3000"; then
        echo "❌ PROBLÈME: Proxifie vers Next.js (localhost:3000)"
        echo "   Next.js ne supporte pas les WebSockets!"
        NEEDS_FIX=true
    elif echo "$CURRENT_PROXY" | grep -q "n8n\|5678"; then
        echo "✅ Proxifie déjà vers N8N: $CURRENT_PROXY"
        if [ "$CURRENT_PROXY" != "$N8N_PROXY" ]; then
            echo "⚠️  Mais l'URL ne correspond pas à celle détectée"
            echo "   Actuel: $CURRENT_PROXY"
            echo "   Détecté: $N8N_PROXY"
            NEEDS_FIX=true
        else
            NEEDS_FIX=false
        fi
    else
        echo "⚠️  Proxy pass inconnu: $CURRENT_PROXY"
        NEEDS_FIX=true
    fi
    
    if [ "$NEEDS_FIX" = true ]; then
        echo ""
        echo "🔧 Correction de la configuration..."
        
        # Supprimer l'ancienne configuration
        sed -i '/location \/rest\/push/,/^[[:space:]]*}/d' "$NGINX_CONFIG"
        
        # Trouver le bloc server pour www.talosprimes.com et ajouter la nouvelle config
        awk -v n8n_proxy="$N8N_PROXY" -v n8n_host="$N8N_HOST" '
        /server_name.*www\.talosprimes\.com/ || /server_name.*talosprimes\.com.*www\.talosprimes\.com/ {
            in_correct_block=1
        }
        /^[[:space:]]*}/ && in_correct_block {
            # Insérer la configuration WebSocket avant la fermeture
            print "    # WebSocket pour N8N - proxifier directement vers N8N"
            print "    location /rest/push {"
            print "        proxy_pass " n8n_proxy ";"
            print "        proxy_http_version 1.1;"
            print "        proxy_set_header Upgrade $http_upgrade;"
            print "        proxy_set_header Connection \"upgrade\";"
            print "        proxy_set_header Host " n8n_host ";"
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
        
        echo "✅ Configuration corrigée"
    fi
else
    echo "📝 Ajout de la configuration WebSocket..."
    
    # Trouver le bloc server pour www.talosprimes.com et ajouter la config
    awk -v n8n_proxy="$N8N_PROXY" -v n8n_host="$N8N_HOST" '
    /server_name.*www\.talosprimes\.com/ || /server_name.*talosprimes\.com.*www\.talosprimes\.com/ {
        in_correct_block=1
    }
    /^[[:space:]]*}/ && in_correct_block {
        # Insérer la configuration WebSocket avant la fermeture
        print "    # WebSocket pour N8N - proxifier directement vers N8N"
        print "    location /rest/push {"
        print "        proxy_pass " n8n_proxy ";"
        print "        proxy_http_version 1.1;"
        print "        proxy_set_header Upgrade $http_upgrade;"
        print "        proxy_set_header Connection \"upgrade\";"
        print "        proxy_set_header Host " n8n_host ";"
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

echo ""

# Vérifier les headers WebSocket
if grep -A 15 "location /rest/push" "$NGINX_CONFIG" | grep -q "Upgrade.*upgrade"; then
    echo "✅ Headers WebSocket présents"
else
    echo "⚠️  Headers WebSocket manquants, ajout..."
    # Ajouter les headers manquants après proxy_pass
    sed -i '/location \/rest\/push/a\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection "upgrade";
' "$NGINX_CONFIG"
    echo "✅ Headers ajoutés"
fi

echo ""

# Afficher la configuration finale
echo "📋 Configuration finale /rest/push:"
echo "-----------------------------------"
grep -A 15 "location /rest/push" "$NGINX_CONFIG" | head -20
echo ""

# Tester la configuration Nginx
echo "🧪 Test de la configuration Nginx..."
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Configuration Nginx valide"
    echo ""
    
    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    if systemctl reload nginx; then
        echo "✅ Nginx rechargé avec succès"
    else
        echo "❌ Erreur lors du rechargement de Nginx"
        echo "   Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        systemctl reload nginx
        exit 1
    fi
else
    echo "❌ Erreur dans la configuration Nginx:"
    nginx -t
    echo ""
    echo "   Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Correction terminée avec succès!"
echo ""
echo "📋 Résumé:"
echo "   - Configuration WebSocket ajoutée/corrigée"
echo "   - Proxy pass vers: $N8N_PROXY"
echo "   - Host header: $N8N_HOST"
echo "   - Nginx rechargé"
echo ""
echo "💡 Testez maintenant dans le navigateur:"
echo "   https://www.talosprimes.com/platform/n8n"
echo ""
echo "🔍 Si les erreurs persistent, vérifiez:"
echo "   1. Que N8N est bien démarré: pm2 list | grep n8n"
echo "   2. Les logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   3. Que N8N est accessible: curl -k $N8N_PROXY"
echo ""




