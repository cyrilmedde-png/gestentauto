#!/bin/bash
# Script pour tester la route health N8N avec authentification
# Usage: ./scripts/test-n8n-health.sh

set -e

cd /var/www/talosprime

echo "🧪 Test de la route /api/platform/n8n/health"
echo "==========================================="
echo ""

# Test 1: Sans authentification (devrait retourner buildTime: true)
echo "1️⃣  Test sans authentification:"
RESPONSE=$(curl -s http://localhost:3000/api/platform/n8n/health)
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Vérifier les logs récents
echo "2️⃣  Derniers logs testN8NConnection:"
pm2 logs talosprime --lines 100 --nostream | grep -A 15 "testN8NConnection" | tail -30
echo ""

# Test 3: Vérifier si N8N est accessible depuis le serveur
echo "3️⃣  Test direct de connexion à N8N:"
N8N_URL=$(grep "^N8N_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
N8N_USER=$(grep "^N8N_BASIC_AUTH_USER=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
N8N_PASS=$(grep "^N8N_BASIC_AUTH_PASSWORD=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)

if [ -n "$N8N_URL" ] && [ -n "$N8N_USER" ] && [ -n "$N8N_PASS" ]; then
    HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -u "$N8N_USER:$N8N_PASS" "$N8N_URL" || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "   ✅ N8N est accessible (HTTP $HTTP_CODE)"
    else
        echo "   ❌ N8N n'est pas accessible (HTTP $HTTP_CODE)"
    fi
else
    echo "   ⚠️  Variables N8N non trouvées"
fi
echo ""

echo "==========================================="
echo "💡 Note: Pour tester avec authentification,"
echo "   accédez à https://www.talosprimes.com/platform/n8n"
echo "   depuis votre navigateur (avec session active)"








