#!/bin/bash
# Script pour vérifier le bloc HTTPS complet pour www.talosprimes.com

echo "🔍 Vérification du bloc HTTPS pour www.talosprimes.com"
echo "====================================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

# Extraire le bloc HTTPS complet pour www.talosprimes.com
echo "1️⃣  Bloc HTTPS complet (port 443) pour www.talosprimes.com:"
echo "-----------------------------------------------------------"
# Chercher le bloc server qui écoute sur 443 et contient www.talosprimes.com
awk '
/listen 443/ { in_443_block=1; block_start=NR }
/server_name.*www\.talosprimes\.com/ && in_443_block { in_target_block=1 }
in_target_block && in_443_block { print }
/^}/ && in_target_block && in_443_block { print; exit }
' "$NGINX_CONFIG" | head -100

echo ""
echo "2️⃣  Test HTTPS depuis le serveur:"
echo "---------------------------------"
# Tester avec HTTPS (en ignorant les erreurs SSL)
curl -k -s -H "Host: www.talosprimes.com" https://localhost/platform/n8n | head -20
echo ""

echo "3️⃣  Vérification de l'ordre des blocs server:"
echo "---------------------------------------------"
# Afficher tous les blocs server avec leur ligne et server_name
grep -n "server {" "$NGINX_CONFIG" | while read line; do
    line_num=$(echo "$line" | cut -d: -f1)
    server_name=$(sed -n "${line_num},/^}/p" "$NGINX_CONFIG" | grep "server_name" | head -1)
    listen=$(sed -n "${line_num},/^}/p" "$NGINX_CONFIG" | grep "listen" | head -1)
    echo "Ligne $line_num: $listen | $server_name"
done
echo ""

echo "====================================================="
echo "✅ Vérification terminée"
