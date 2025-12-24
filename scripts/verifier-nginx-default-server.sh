#!/bin/bash
# Script pour vérifier s'il y a un default_server qui intercepte

echo "🔍 Vérification des default_server et de l'ordre des blocs"
echo "========================================================="
echo ""

# Vérifier tous les default_server
echo "1️⃣  Recherche de default_server:"
echo "-------------------------------"
nginx -T 2>/dev/null | grep -B 5 -A 10 "default_server" || echo "✅ Aucun default_server trouvé"
echo ""

# Vérifier l'ordre des blocs pour le port 443
echo "2️⃣  Ordre des blocs server sur le port 443:"
echo "-------------------------------------------"
nginx -T 2>/dev/null | grep -B 2 "listen 443" | grep -E "server_name|listen" | head -20
echo ""

# Vérifier quel bloc correspond à www.talosprimes.com
echo "3️⃣  Test de correspondance pour www.talosprimes.com:"
echo "----------------------------------------------------"
nginx -T 2>/dev/null | awk '
/listen 443/ { 
    in_443=1
    server_block=""
    server_name=""
}
/server_name/ && in_443 {
    server_name=$0
}
{ 
    if (in_443) server_block=server_block "\n" $0 
}
/^}/ && in_443 {
    if (server_name ~ /www\.talosprimes\.com/) {
        print "✅ Bloc trouvé:"
        print server_block
        exit
    }
    in_443=0
    server_block=""
}
'
echo ""

# Vérifier s'il y a un bloc qui intercepte avant
echo "4️⃣  Vérification des blocs qui pourraient intercepter:"
echo "------------------------------------------------------"
nginx -T 2>/dev/null | grep -B 2 "listen 443" | head -30
echo ""

echo "========================================================="
echo "💡 Si vous voyez toujours la page Nginx par défaut:"
echo "   1. Videz le cache du navigateur (Ctrl+Shift+R)"
echo "   2. Testez en navigation privée"
echo "   3. Vérifiez les logs Nginx en temps réel:"
echo "      tail -f /var/log/nginx/access.log"
echo ""
