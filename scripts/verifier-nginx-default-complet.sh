#!/bin/bash
# Script pour vérifier complètement s'il y a un serveur par défaut qui intercepte

echo "🔍 Vérification complète des serveurs par défaut"
echo "================================================"
echo ""

# Vérifier dans nginx.conf
echo "1️⃣  Vérification dans /etc/nginx/nginx.conf:"
echo "--------------------------------------------"
if grep -q "default_server\|server_name.*_" /etc/nginx/nginx.conf; then
    echo "⚠️  Serveur par défaut trouvé dans nginx.conf:"
    grep -B 5 -A 20 "default_server\|server_name.*_" /etc/nginx/nginx.conf | head -30
else
    echo "✅ Aucun serveur par défaut dans nginx.conf"
fi
echo ""

# Vérifier dans tous les fichiers de configuration
echo "2️⃣  Vérification dans tous les fichiers sites-enabled:"
echo "-----------------------------------------------------"
for file in /etc/nginx/sites-enabled/*; do
    if [ -f "$file" ]; then
        echo "📄 Fichier: $file"
        if grep -q "default_server" "$file"; then
            echo "   ⚠️  default_server trouvé:"
            grep -n "default_server" "$file"
        else
            echo "   ✅ Pas de default_server"
        fi
        echo ""
    fi
done

# Vérifier l'ordre des blocs pour www.talosprimes.com
echo "3️⃣  Ordre des blocs qui pourraient correspondre à www.talosprimes.com:"
echo "--------------------------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    has_www_talosprimes=0
    has_location=0
}
/server_name.*talosprimes\.com/ && in_block {
    server_name=$0
    if (/www\.talosprimes\.com/) {
        has_www_talosprimes=1
    }
}
/location \// && in_block {
    has_location=1
}
/^}/ && in_block {
    if (has_www_talosprimes || server_name ~ /talosprimes\.com/) {
        print "Bloc #" block_num ":"
        print "  " server_name
        if (has_location) {
            print "  ✅ A location /"
        } else {
            print "  ❌ PAS de location /"
        }
        if (has_www_talosprimes) {
            print "  ⭐ Bloc pour www.talosprimes.com"
        }
        print ""
    }
    in_block=0
}
'
echo ""

# Test avec talosprimes.com (sans www)
echo "4️⃣  Test avec talosprimes.com (sans www):"
echo "----------------------------------------"
RESPONSE=$(curl -k -s -H "Host: talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/platform/n8n | head -3)
if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
    echo "   ❌ Retourne 'Welcome to nginx!' (mauvais bloc)"
elif echo "$RESPONSE" | grep -q "Gestion Entreprise\|Chargement de N8N"; then
    echo "   ✅ Retourne du Next.js (bon bloc)"
else
    echo "   ⚠️  Réponse inattendue"
fi
echo ""

# Vérifier s'il y a un serveur qui écoute sur toutes les interfaces
echo "5️⃣  Vérification des serveurs qui écoutent sur *:443:"
echo "-----------------------------------------------------"
nginx -T 2>/dev/null | grep -B 10 "listen.*\*:443\|listen 443.*default" | head -30
echo ""

echo "================================================"
echo "💡 Si le navigateur voit 'Welcome to nginx!',"
echo "   vérifiez que vous accédez via www.talosprimes.com"
echo "   et non talosprimes.com (sans www)"
echo ""
