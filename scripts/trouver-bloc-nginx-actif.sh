#!/bin/bash
# Script pour trouver quel bloc server Nginx correspond réellement à www.talosprimes.com

echo "🔍 Recherche du bloc server actif pour www.talosprimes.com"
echo "=========================================================="
echo ""

# Méthode 1: Utiliser nginx -T pour voir la configuration complète
echo "1️⃣  Configuration complète pour www.talosprimes.com:"
echo "----------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { in_block=0; found=0 }
/listen 443/ && !found {
    in_block=1
    block_start=NR
    block_content=""
}
/server_name.*www\.talosprimes\.com/ && in_block {
    found=1
    print "✅ Bloc trouvé (commence à la ligne " block_start "):"
}
in_block {
    block_content=block_content "\n" $0
}
/^}/ && in_block {
    if (found) {
        print block_content
        exit
    }
    in_block=0
    block_content=""
}
' | head -80
echo ""

# Méthode 2: Vérifier s'il y a un bloc qui intercepte avant
echo "2️⃣  Tous les blocs server sur le port 443:"
echo "------------------------------------------"
nginx -T 2>/dev/null | awk '
/listen 443/ {
    in_block=1
    block_num++
    server_name=""
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
    print "  " server_name
    if (has_location) {
        print "  ✅ A location / trouvé"
    } else {
        print "  ❌ PAS de location /"
    }
    print ""
    in_block=0
}
'
echo ""

# Méthode 3: Tester avec curl pour voir quel bloc répond
echo "3️⃣  Test avec curl (simulation navigateur):"
echo "-------------------------------------------"
echo "Test 1: www.talosprimes.com"
RESPONSE=$(curl -k -s -H "Host: www.talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n | head -3)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!' (mauvais bloc)"
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js (bon bloc)"
else
    echo "   ⚠️  Réponse inattendue:"
    echo "$RESPONSE" | head -3
fi
echo ""

echo "=========================================================="
echo "💡 Si le test retourne 'Welcome to nginx!',"
echo "   le bloc pour www.talosprimes.com n'est pas le premier"
echo "   ou n'a pas de location / avec proxy_pass"
echo ""
