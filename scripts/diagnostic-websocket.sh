#!/bin/bash
# Script de diagnostic pour les WebSockets N8N
# Usage: sudo ./scripts/diagnostic-websocket.sh

echo "🔍 Diagnostic WebSocket N8N"
echo "============================"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root pour certaines vérifications"
fi

# 1. Vérifier la configuration Nginx
echo "1️⃣  Vérification de la configuration Nginx..."
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

# Vérifier si /rest/push existe
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo "✅ Configuration /rest/push trouvée"
    echo ""
    echo "📋 Configuration actuelle:"
    grep -A 15 "location /rest/push" "$NGINX_CONFIG" | head -20
    echo ""
    
    # Vérifier vers où ça proxifie
    PROXY_PASS=$(grep -A 15 "location /rest/push" "$NGINX_CONFIG" | grep "proxy_pass" | head -1)
    echo "📍 Proxy pass actuel: $PROXY_PASS"
    
    if echo "$PROXY_PASS" | grep -q "localhost:3000"; then
        echo "❌ PROBLÈME: Proxifie vers Next.js (localhost:3000) - Next.js ne supporte pas les WebSockets!"
        echo "   Il faut proxifier directement vers N8N"
    elif echo "$PROXY_PASS" | grep -q "n8n"; then
        echo "✅ Proxifie vers N8N (correct)"
    else
        echo "⚠️  Proxy pass vers: $PROXY_PASS"
    fi
else
    echo "❌ Configuration /rest/push NON trouvée dans Nginx"
    echo "   Il faut l'ajouter avec: sudo ./scripts/fix-websocket-nginx.sh"
fi
echo ""

# 2. Vérifier si N8N est accessible
echo "2️⃣  Vérification de l'accessibilité N8N..."
if curl -k -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com | grep -q "200\|401\|302"; then
    echo "✅ N8N est accessible via HTTPS (https://n8n.talosprimes.com)"
else
    echo "⚠️  N8N n'est pas accessible via HTTPS"
    echo "   Vérification en HTTP..."
    if curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401\|302"; then
        echo "✅ N8N est accessible en local sur http://localhost:5678"
        echo "   ⚠️  Il faudra peut-être proxifier vers http://localhost:5678 au lieu de https://n8n.talosprimes.com"
    else
        echo "❌ N8N n'est pas accessible"
    fi
fi
echo ""

# 3. Vérifier si N8N est en cours d'exécution
echo "3️⃣  Vérification du statut N8N..."
if command -v pm2 &> /dev/null; then
    PM2_N8N=$(pm2 list | grep -i n8n | head -1)
    if [ -n "$PM2_N8N" ]; then
        echo "✅ N8N trouvé dans PM2:"
        echo "$PM2_N8N"
    else
        echo "⚠️  N8N non trouvé dans PM2"
    fi
else
    echo "⚠️  PM2 non installé ou non dans le PATH"
fi
echo ""

# 4. Vérifier les ports en écoute
echo "4️⃣  Vérification des ports en écoute..."
if command -v ss &> /dev/null; then
    PORT_5678=$(ss -tlnp | grep ":5678" || echo "")
    if [ -n "$PORT_5678" ]; then
        echo "✅ Port 5678 en écoute:"
        echo "$PORT_5678"
    else
        echo "❌ Port 5678 n'est pas en écoute"
    fi
else
    echo "⚠️  Commande 'ss' non disponible"
fi
echo ""

# 5. Tester la configuration Nginx
echo "5️⃣  Test de la configuration Nginx..."
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Configuration Nginx valide"
else
    echo "❌ Erreur dans la configuration Nginx:"
    nginx -t
fi
echo ""

# 6. Recommandations
echo "============================================"
echo "📋 Recommandations:"
echo ""

if ! grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo "1. Exécutez: sudo ./scripts/fix-websocket-nginx.sh"
    echo "   pour ajouter la configuration WebSocket"
elif grep -A 15 "location /rest/push" "$NGINX_CONFIG" | grep -q "localhost:3000"; then
    echo "1. Exécutez: sudo ./scripts/fix-websocket-nginx.sh"
    echo "   pour corriger la configuration (proxifier vers N8N au lieu de Next.js)"
    echo ""
    echo "2. Rechargez Nginx: sudo systemctl reload nginx"
else
    echo "1. La configuration semble correcte"
    echo "2. Vérifiez que N8N est bien démarré: pm2 list | grep n8n"
    echo "3. Vérifiez les logs Nginx: sudo tail -f /var/log/nginx/error.log"
    echo "4. Testez la connexion WebSocket manuellement"
fi

echo ""








