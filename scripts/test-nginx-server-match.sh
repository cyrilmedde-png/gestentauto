#!/bin/bash
# Script pour tester quel bloc server correspond à www.talosprimes.com

echo "🔍 Test de correspondance des blocs server"
echo "=========================================="
echo ""

# Tester avec curl en simulant exactement ce que fait le navigateur
echo "1️⃣  Test avec Host: www.talosprimes.com (HTTPS simulé):"
echo "------------------------------------------------------"
curl -k -s -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n | head -5
echo ""

echo "2️⃣  Test avec Host: talosprimes.com (sans www):"
echo "-----------------------------------------------"
curl -k -s -H "Host: talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n | head -5
echo ""

echo "3️⃣  Vérification de la configuration active:"
echo "-------------------------------------------"
nginx -T 2>/dev/null | grep -A 30 "server_name.*www\.talosprimes\.com" | grep -A 30 "listen 443" | head -40
echo ""

echo "4️⃣  Vérification s'il y a plusieurs blocs pour www.talosprimes.com:"
echo "-------------------------------------------------------------------"
nginx -T 2>/dev/null | grep -B 5 -A 30 "server_name.*www\.talosprimes\.com" | grep -E "listen|server_name|location|proxy_pass" | head -20
echo ""

echo "=========================================="
echo "💡 Si vous voyez 'Welcome to nginx!',"
echo "   le bloc server ne correspond pas correctement"
echo ""
