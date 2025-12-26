#!/bin/bash
# Script de diagnostic complet pour les WebSockets N8N
# Usage: sudo ./scripts/diagnostic-complet-websocket.sh

echo "🔍 Diagnostic complet WebSocket N8N"
echo "===================================="
echo ""

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier la configuration Nginx
echo "1️⃣ Configuration Nginx:"
echo "-----------------------"
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/talosprime" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
elif [ -f "/etc/nginx/sites-available/talosprimes" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprimes"
else
    echo -e "${RED}   ❌ Fichier de configuration Nginx non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}   ✅ Fichier trouvé: $NGINX_CONFIG${NC}"
echo ""

# Vérifier si /rest/push existe
if grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo -e "${GREEN}   ✅ location /rest/push existe${NC}"
    echo ""
    echo "   📋 Configuration actuelle:"
    grep -A 15 "location /rest/push" "$NGINX_CONFIG" | head -20 | sed 's/^/      /'
    echo ""
    
    # Vérifier vers où ça proxifie
    PROXY_PASS=$(grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep "proxy_pass" | head -1 | sed 's/^[[:space:]]*//')
    echo "   📍 Proxy pass: $PROXY_PASS"
    
    if echo "$PROXY_PASS" | grep -q "localhost:3000\|127.0.0.1:3000"; then
        echo -e "${RED}   ❌ PROBLÈME: Proxifie vers Next.js (localhost:3000)${NC}"
        echo -e "${RED}      Next.js ne supporte pas les WebSockets !${NC}"
        echo -e "${YELLOW}      Il faut proxifier directement vers N8N${NC}"
    elif echo "$PROXY_PASS" | grep -q "n8n\|5678"; then
        echo -e "${GREEN}   ✅ Proxifie vers N8N (correct)${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Proxy pass vers: $PROXY_PASS${NC}"
    fi
    
    # Vérifier les headers WebSocket
    if grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "Upgrade.*upgrade"; then
        echo -e "${GREEN}   ✅ Headers WebSocket présents (Upgrade)${NC}"
    else
        echo -e "${RED}   ❌ Headers WebSocket manquants (Upgrade)${NC}"
    fi
    
    if grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "Connection.*upgrade"; then
        echo -e "${GREEN}   ✅ Headers WebSocket présents (Connection)${NC}"
    else
        echo -e "${RED}   ❌ Headers WebSocket manquants (Connection)${NC}"
    fi
    
    # Vérifier proxy_http_version
    if grep -A 10 "location /rest/push" "$NGINX_CONFIG" | grep -q "proxy_http_version 1.1"; then
        echo -e "${GREEN}   ✅ proxy_http_version 1.1 présent${NC}"
    else
        echo -e "${YELLOW}   ⚠️  proxy_http_version 1.1 manquant${NC}"
    fi
else
    echo -e "${RED}   ❌ location /rest/push NON trouvée${NC}"
    echo -e "${YELLOW}   💡 Exécutez: sudo ./scripts/fix-websocket-nginx.sh${NC}"
fi

echo ""

# Vérifier l'ordre des locations (CRITIQUE)
echo "   📋 Ordre des locations /rest dans Nginx:"
REST_LOCATIONS=$(grep -n "location /rest" "$NGINX_CONFIG" | head -10)
if [ -n "$REST_LOCATIONS" ]; then
    echo "$REST_LOCATIONS" | sed 's/^/      /'
    echo ""
    
    # Vérifier si /rest/push est avant /rest/ ou /api/
    PUSH_LINE=$(echo "$REST_LOCATIONS" | grep "/rest/push" | cut -d: -f1)
    REST_LINE=$(echo "$REST_LOCATIONS" | grep -E "location /rest[^/]|location /api" | cut -d: -f1 | head -1)
    
    if [ -n "$PUSH_LINE" ] && [ -n "$REST_LINE" ]; then
        if [ "$PUSH_LINE" -lt "$REST_LINE" ]; then
            echo -e "${GREEN}   ✅ /rest/push est AVANT les autres locations (correct)${NC}"
        else
            echo -e "${RED}   ❌ PROBLÈME: /rest/push est APRÈS les autres locations${NC}"
            echo -e "${YELLOW}      /rest/push doit être AVANT /rest/ ou /api/ pour être prioritaire${NC}"
        fi
    fi
else
    echo -e "${YELLOW}   ⚠️  Aucune location /rest trouvée${NC}"
fi

echo ""

# 2. Vérifier l'accessibilité N8N
echo "2️⃣ Accessibilité N8N:"
echo "---------------------"
if curl -k -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com 2>/dev/null | grep -q "200\|401\|302"; then
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://n8n.talosprimes.com 2>/dev/null)
    echo -e "${GREEN}   ✅ N8N accessible via HTTPS (https://n8n.talosprimes.com) - Code: $HTTP_CODE${NC}"
    N8N_URL="https://n8n.talosprimes.com"
elif curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null | grep -q "200\|401\|302"; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null)
    echo -e "${GREEN}   ✅ N8N accessible en local (http://localhost:5678) - Code: $HTTP_CODE${NC}"
    N8N_URL="http://localhost:5678"
else
    echo -e "${RED}   ❌ N8N non accessible${NC}"
    N8N_URL=""
fi

# Vérifier le port 5678
if command -v ss &> /dev/null; then
    PORT_5678=$(ss -tlnp 2>/dev/null | grep ":5678" || echo "")
    if [ -n "$PORT_5678" ]; then
        echo -e "${GREEN}   ✅ Port 5678 en écoute${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Port 5678 n'est pas en écoute${NC}"
    fi
fi

echo ""

# 3. Vérifier PM2 (N8N)
echo "3️⃣ Statut N8N (PM2):"
echo "---------------------"
if command -v pm2 &> /dev/null; then
    PM2_N8N=$(pm2 list 2>/dev/null | grep -i n8n | head -1)
    if [ -n "$PM2_N8N" ]; then
        echo -e "${GREEN}   ✅ N8N trouvé dans PM2:${NC}"
        echo "$PM2_N8N" | sed 's/^/      /'
    else
        echo -e "${YELLOW}   ⚠️  N8N non trouvé dans PM2${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  PM2 non installé ou non dans le PATH${NC}"
fi

echo ""

# 4. Vérifier la route Next.js
echo "4️⃣ Route Next.js /rest/[...path]:"
echo "--------------------------------"
if [ -f "app/rest/[...path]/route.ts" ]; then
    echo -e "${YELLOW}   ⚠️  Fichier app/rest/[...path]/route.ts existe${NC}"
    echo "   📋 Vérification du contenu..."
    
    if grep -q "restPath === 'push'" "app/rest/[...path]/route.ts" 2>/dev/null; then
        echo -e "${GREEN}   ✅ /rest/push est exclu de la route Next.js${NC}"
    else
        echo -e "${RED}   ❌ PROBLÈME: /rest/push n'est PAS exclu${NC}"
        echo -e "${YELLOW}      La route Next.js intercepte /rest/push${NC}"
        echo -e "${YELLOW}      Il faut exclure /rest/push dans route.ts${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Fichier app/rest/[...path]/route.ts n'existe pas${NC}"
    echo -e "${GREEN}      Les requêtes /rest/* ne sont pas interceptées par Next.js${NC}"
fi

echo ""

# 5. Vérifier la configuration Nginx (syntaxe)
echo "5️⃣ Test de la configuration Nginx:"
echo "-----------------------------------"
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}   ✅ Configuration Nginx valide${NC}"
else
    echo -e "${RED}   ❌ Erreur dans la configuration Nginx:${NC}"
    nginx -t 2>&1 | sed 's/^/      /'
fi

echo ""

# 6. Résumé et recommandations
echo "===================================="
echo "📋 Résumé et recommandations:"
echo "===================================="
echo ""

PROBLEMS=0

# Vérifier les problèmes critiques
if ! grep -q "location /rest/push" "$NGINX_CONFIG"; then
    echo -e "${RED}❌ PROBLÈME CRITIQUE: location /rest/push manquante${NC}"
    echo "   Solution: sudo ./scripts/fix-websocket-nginx.sh"
    PROBLEMS=$((PROBLEMS + 1))
fi

if grep -A 10 "location /rest/push" "$NGINX_CONFIG" 2>/dev/null | grep -q "localhost:3000\|127.0.0.1:3000"; then
    echo -e "${RED}❌ PROBLÈME CRITIQUE: /rest/push proxifie vers Next.js${NC}"
    echo "   Solution: sudo ./scripts/fix-websocket-nginx.sh"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ -f "app/rest/[...path]/route.ts" ] && ! grep -q "restPath === 'push'" "app/rest/[...path]/route.ts" 2>/dev/null; then
    echo -e "${RED}❌ PROBLÈME: Route Next.js intercepte /rest/push${NC}"
    echo "   Solution: Exclure /rest/push dans app/rest/[...path]/route.ts"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ -z "$N8N_URL" ]; then
    echo -e "${RED}❌ PROBLÈME: N8N non accessible${NC}"
    echo "   Solution: Vérifier que N8N est démarré (pm2 list | grep n8n)"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun problème critique détecté${NC}"
    echo ""
    echo "💡 Si les WebSockets ne fonctionnent toujours pas:"
    echo "   1. Rechargez Nginx: sudo systemctl reload nginx"
    echo "   2. Vérifiez les logs: sudo tail -f /var/log/nginx/error.log"
    echo "   3. Testez la connexion WebSocket manuellement"
else
    echo ""
    echo -e "${YELLOW}⚠️  $PROBLEMS problème(s) détecté(s)${NC}"
    echo ""
    echo "📝 Actions recommandées:"
    echo "   1. Corriger les problèmes ci-dessus"
    echo "   2. Recharger Nginx: sudo systemctl reload nginx"
    echo "   3. Redémarrer l'application: pm2 restart talosprime"
    echo "   4. Tester à nouveau"
fi

echo ""

