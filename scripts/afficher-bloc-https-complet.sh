#!/bin/bash
# Script pour afficher le bloc HTTPS complet pour www.talosprimes.com

echo "🔍 Bloc HTTPS complet pour www.talosprimes.com"
echo "==============================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

# Trouver la ligne du bloc HTTPS pour www.talosprimes.com
START_LINE=$(grep -n "listen 443.*ssl.*http2" "$NGINX_CONFIG" | grep -A 1 "server_name.*www.talosprimes.com" | head -1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    # Essayer une autre méthode
    START_LINE=$(awk '/listen 443.*ssl.*http2/,/server_name.*www\.talosprimes\.com/ {if (/server_name.*www\.talosprimes\.com/) {print NR; exit}}' "$NGINX_CONFIG")
fi

if [ -z "$START_LINE" ]; then
    echo "❌ Bloc HTTPS pour www.talosprimes.com non trouvé"
    echo ""
    echo "📋 Tous les blocs HTTPS:"
    grep -n "listen 443" "$NGINX_CONFIG"
    exit 1
fi

echo "📍 Bloc trouvé à la ligne $START_LINE"
echo ""

# Extraire le bloc complet (de "server {" jusqu'au "}" correspondant)
echo "📄 Contenu complet du bloc:"
echo "---------------------------"
awk -v start="$START_LINE" '
NR >= start {
    print
    if (/^server \{/) brace_count++
    if (/^}/) {
        brace_count--
        if (brace_count == 0) exit
    }
}
' "$NGINX_CONFIG"

echo ""
echo "==============================================="
