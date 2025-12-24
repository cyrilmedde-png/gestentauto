#!/bin/bash
# Script pour vérifier et corriger l'ordre des blocs server Nginx

echo "🔧 Vérification et correction de l'ordre des blocs server"
echo "========================================================="
echo ""

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"

# Créer une sauvegarde
echo "💾 Création d'une sauvegarde: $BACKUP_FILE"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée"
echo ""

# Vérifier s'il y a un fichier default qui intercepte
echo "1️⃣  Vérification des fichiers default:"
echo "--------------------------------------"
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Fichier default trouvé dans sites-enabled"
    echo "   Ce fichier pourrait intercepter les requêtes"
    echo "   Désactivation recommandée..."
    read -p "   Désactiver le fichier default ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        rm -f /etc/nginx/sites-enabled/default
        echo "   ✅ Fichier default désactivé"
    fi
else
    echo "✅ Aucun fichier default trouvé"
fi
echo ""

# Vérifier l'ordre des blocs HTTPS
echo "2️⃣  Ordre actuel des blocs HTTPS (port 443):"
echo "--------------------------------------------"
grep -n "listen 443" "$NGINX_CONFIG" | while read line; do
    line_num=$(echo "$line" | cut -d: -f1)
    server_name=$(sed -n "${line_num},/^}/p" "$NGINX_CONFIG" | grep "server_name" | head -1)
    echo "   Ligne $line_num: $server_name"
done
echo ""

# Vérifier quel bloc correspond en premier pour www.talosprimes.com
echo "3️⃣  Test de correspondance:"
echo "--------------------------"
nginx -T 2>/dev/null | awk '
/listen 443/ {
    in_443=1
    server_name=""
    block_start=NR
}
/server_name/ && in_443 {
    server_name=$0
}
/^}/ && in_443 {
    if (server_name ~ /www\.talosprimes\.com/) {
        print "✅ Bloc trouvé pour www.talosprimes.com (ligne " block_start "):"
        print server_name
        exit
    }
    in_443=0
}
' || echo "❌ Aucun bloc HTTPS trouvé pour www.talosprimes.com"
echo ""

# Vérifier s'il y a un default_server sur le port 443
echo "4️⃣  Vérification des default_server:"
echo "-----------------------------------"
if nginx -T 2>/dev/null | grep -q "default_server.*443"; then
    echo "⚠️  Un default_server trouvé sur le port 443"
    nginx -T 2>/dev/null | grep -B 5 -A 10 "default_server.*443"
else
    echo "✅ Aucun default_server sur le port 443"
fi
echo ""

# Tester la configuration
echo "5️⃣  Test de la configuration:"
echo "-----------------------------"
if nginx -t; then
    echo "✅ Configuration valide"
    echo ""
    echo "🔄 Rechargement de Nginx..."
    systemctl reload nginx
    echo "✅ Nginx rechargé"
else
    echo "❌ Erreur dans la configuration"
    echo "💡 Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi
echo ""

echo "========================================================="
echo "✅ Vérification terminée"
echo ""
echo "💡 Testez maintenant depuis le navigateur:"
echo "   https://www.talosprimes.com/platform/n8n"
echo ""
echo "💾 Sauvegarde: $BACKUP_FILE"
echo ""
