#!/bin/bash
# Script pour tester toutes les routes N8N et identifier le problème
# Usage: ./scripts/test-routes-n8n-complet.sh

echo "🔍 Test complet des routes N8N"
echo "=============================="
echo ""

# Test 1: Route /platform/n8n avec www.talosprimes.com
echo "1️⃣  Test /platform/n8n avec www.talosprimes.com:"
echo "------------------------------------------------"
RESPONSE=$(curl -s -k -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n 2>&1)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!' (mauvais bloc)"
    echo "   📋 Premières lignes de la réponse:"
    echo "$RESPONSE" | head -5
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js (bon bloc)"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE" | head -10
fi
echo ""

# Test 2: Route /platform/n8n avec talosprimes.com (sans www)
echo "2️⃣  Test /platform/n8n avec talosprimes.com (sans www):"
echo "------------------------------------------------------"
RESPONSE=$(curl -s -k -H "Host: talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n 2>&1)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!' (mauvais bloc)"
    echo "   📋 Premières lignes de la réponse:"
    echo "$RESPONSE" | head -5
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js (bon bloc)"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE" | head -10
fi
echo ""

# Test 3: Route /platform/n8n/view avec www.talosprimes.com
echo "3️⃣  Test /platform/n8n/view avec www.talosprimes.com:"
echo "----------------------------------------------------"
RESPONSE=$(curl -s -k -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n/view 2>&1)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!' (mauvais bloc)"
elif echo "$RESPONSE" | grep -q "N8N - Automatisation\|n8n-iframe"; then
    echo "   ✅ Retourne la page HTML avec iframe N8N"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE" | head -10
fi
echo ""

# Test 4: Route /api/platform/n8n/proxy avec www.talosprimes.com
echo "4️⃣  Test /api/platform/n8n/proxy avec www.talosprimes.com:"
echo "---------------------------------------------------------"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/api/platform/n8n/proxy 2>&1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ Route répond (HTTP $HTTP_CODE)"
else
    echo "   ❌ Route ne répond pas correctement (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Vérifier l'ordre des blocs server
echo "5️⃣  Ordre des blocs server HTTPS (port 443):"
echo "-------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_location=0
}
/server_name/ && in_block {
    server_name=$0
}
/location \// && in_block {
    has_location=1
}
/^}/ && in_block {
    print "Bloc #" block_num ":"
    print "  " listen_line
    print "  " server_name
    if (has_location) {
        print "  ✅ A location / avec proxy_pass"
    } else {
        print "  ❌ PAS de location /"
    }
    print ""
    in_block=0
}
'
echo ""

# Test 6: Vérifier quel bloc correspond en premier pour www.talosprimes.com
echo "6️⃣  Bloc qui correspond en premier pour www.talosprimes.com:"
echo "----------------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { found_first=0; block_num=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
    has_location=0
}
/server_name.*www\.talosprimes\.com/ && in_block && !found_first {
    found_first=1
    print "✅ Premier bloc trouvé (Bloc #" block_num "):"
    print "   " listen_line
    print "   " server_name
}
/server_name/ && in_block {
    server_name=$0
}
/location \// && in_block {
    has_location=1
}
/^}/ && in_block {
    if (found_first && has_location) {
        print "   ✅ A location / avec proxy_pass"
    } else if (found_first && !has_location) {
        print "   ❌ PAS de location / - C'EST LE PROBLÈME !"
    }
    in_block=0
}
'
echo ""

# Test 7: Vérifier s'il y a un bloc qui intercepte avant
echo "7️⃣  Vérification des blocs qui pourraient intercepter:"
echo "-----------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0; found_www=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
}
/server_name.*www\.talosprimes\.com/ && in_block {
    found_www=1
    print "⭐ Bloc #" block_num " - Bloc pour www.talosprimes.com"
}
/server_name/ && in_block && !found_www {
    server_name=$0
    if (server_name !~ /www\.talosprimes\.com/ && server_name ~ /talosprimes/) {
        print "⚠️  Bloc #" block_num " - " server_name " (AVANT le bloc www.talosprimes.com)"
    }
}
/^}/ && in_block {
    in_block=0
}
'
echo ""

echo "=============================="
echo "✅ Tests terminés"
echo ""
echo "💡 Si tous les tests retournent 'Welcome to nginx!',"
echo "   le problème vient de l'ordre des blocs server ou"
echo "   d'un bloc qui intercepte avant www.talosprimes.com"
echo ""

