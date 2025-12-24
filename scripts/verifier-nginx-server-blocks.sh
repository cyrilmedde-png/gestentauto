#!/bin/bash
# Script pour vérifier les blocs server Nginx et identifier le problème

echo "🔍 Vérification des blocs server Nginx"
echo "======================================"
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"

# Chercher le fichier de configuration
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "📋 Recherche du fichier de configuration..."
    for config in /etc/nginx/sites-available/talosprime /etc/nginx/sites-available/talosprimes.com /etc/nginx/sites-available/www.talosprimes.com; do
        if [ -f "$config" ]; then
            NGINX_CONFIG="$config"
            echo "✅ Fichier trouvé: $NGINX_CONFIG"
            break
        fi
    done
fi

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Aucun fichier de configuration trouvé"
    echo "📋 Fichiers disponibles:"
    ls -la /etc/nginx/sites-available/ | grep -v "^d" | awk '{print $9}' | grep -v "^$"
    exit 1
fi

echo "📄 Fichier: $NGINX_CONFIG"
echo ""

# Extraire tous les blocs server
echo "1️⃣  Blocs server trouvés:"
echo "------------------------"
grep -n "server {" "$NGINX_CONFIG" | head -10
echo ""

# Vérifier les server_name
echo "2️⃣  Server names configurés:"
echo "---------------------------"
grep -A 2 "server_name" "$NGINX_CONFIG" | grep -E "server_name|listen" | head -20
echo ""

# Vérifier le bloc pour www.talosprimes.com
echo "3️⃣  Bloc server pour www.talosprimes.com:"
echo "------------------------------------------"
# Extraire le bloc server qui contient www.talosprimes.com
awk '/server {/,/^}/ {if (/server_name.*www\.talosprimes\.com/ || /server_name.*talosprimes\.com/) {in_block=1} if (in_block) print; if (/^}/ && in_block) {exit}}' "$NGINX_CONFIG" | head -50
echo ""

# Vérifier si location / existe dans ce bloc
echo "4️⃣  Vérification location / dans le bloc www.talosprimes.com:"
echo "------------------------------------------------------------"
# Extraire le bloc server et vérifier location /
awk '/server_name.*www\.talosprimes\.com/,/^}/ {if (/location \//) {print "✅ location / trouvé:"; in_location=1} if (in_location) print; if (/^}/ && in_location) {exit}}' "$NGINX_CONFIG" | head -20
echo ""

# Vérifier si proxy_pass pointe vers localhost:3000
echo "5️⃣  Vérification proxy_pass:"
echo "----------------------------"
if grep -A 10 "server_name.*www.talosprimes.com" "$NGINX_CONFIG" | grep -q "proxy_pass.*localhost:3000"; then
    echo "✅ proxy_pass vers localhost:3000 trouvé"
    grep -A 10 "server_name.*www.talosprimes.com" "$NGINX_CONFIG" | grep -A 5 "location /" | grep "proxy_pass"
else
    echo "❌ proxy_pass vers localhost:3000 NON trouvé dans le bloc www.talosprimes.com"
    echo ""
    echo "📋 Configuration actuelle du bloc:"
    awk '/server_name.*www\.talosprimes\.com/,/^}/' "$NGINX_CONFIG" | head -30
fi
echo ""

# Vérifier s'il y a un bloc par défaut qui pourrait intercepter
echo "6️⃣  Vérification des blocs par défaut:"
echo "-------------------------------------"
if grep -q "server_name.*_" "$NGINX_CONFIG"; then
    echo "⚠️  Bloc par défaut (_) trouvé - pourrait intercepter les requêtes"
    grep -B 2 -A 10 "server_name.*_" "$NGINX_CONFIG" | head -20
else
    echo "✅ Aucun bloc par défaut trouvé"
fi
echo ""

# Tester depuis le serveur
echo "7️⃣  Test depuis le serveur:"
echo "---------------------------"
echo "Test avec Host: www.talosprimes.com"
curl -s -H "Host: www.talosprimes.com" http://localhost/platform/n8n | head -5
echo ""
echo "Test direct localhost:3000"
curl -s http://localhost:3000/platform/n8n | head -5
echo ""

echo "======================================"
echo "✅ Vérification terminée"
