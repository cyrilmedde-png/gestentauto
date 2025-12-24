#!/bin/bash
# Script pour vérifier s'il y a un fichier default activé qui intercepte

echo "🔍 Vérification des fichiers default Nginx"
echo "==========================================="
echo ""

# Vérifier s'il y a un fichier default activé
echo "1️⃣  Fichiers dans sites-enabled:"
echo "--------------------------------"
ls -la /etc/nginx/sites-enabled/
echo ""

# Vérifier s'il y a un fichier default
echo "2️⃣  Vérification du fichier default:"
echo "------------------------------------"
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "⚠️  Fichier default ACTIVÉ trouvé !"
    echo "   Ce fichier pourrait intercepter les requêtes"
    echo ""
    echo "📄 Contenu du fichier default:"
    cat /etc/nginx/sites-enabled/default | head -30
    echo ""
    echo "💡 Ce fichier doit être désactivé pour que votre configuration fonctionne"
    read -p "   Désactiver le fichier default ? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        rm -f /etc/nginx/sites-enabled/default
        echo "   ✅ Fichier default désactivé"
        nginx -t && systemctl reload nginx
        echo "   ✅ Nginx rechargé"
    fi
elif [ -f "/etc/nginx/sites-available/default" ]; then
    echo "✅ Fichier default existe mais n'est PAS activé"
    echo "   (présent dans sites-available mais pas dans sites-enabled)"
else
    echo "✅ Aucun fichier default trouvé"
fi
echo ""

# Vérifier l'ordre des blocs dans la configuration active
echo "3️⃣  Ordre des blocs server dans la configuration active:"
echo "--------------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { block_num=0 }
/listen 443/ {
    block_num++
    in_block=1
    server_name=""
    listen_line=$0
}
/server_name/ && in_block {
    server_name=$0
}
/^}/ && in_block {
    print "Bloc #" block_num ": " listen_line
    print "  " server_name
    print ""
    in_block=0
}
' | head -20
echo ""

# Vérifier quel bloc correspond en premier pour www.talosprimes.com
echo "4️⃣  Test de correspondance pour www.talosprimes.com:"
echo "----------------------------------------------------"
nginx -T 2>/dev/null | awk '
BEGIN { found_first=0 }
/listen 443/ {
    in_block=1
    block_start=NR
    server_name=""
}
/server_name.*www\.talosprimes\.com/ && in_block && !found_first {
    found_first=1
    print "✅ Premier bloc trouvé pour www.talosprimes.com (ligne " block_start "):"
    print "   " server_name
}
/server_name/ && in_block {
    server_name=$0
}
/^}/ && in_block {
    in_block=0
}
'
echo ""

echo "==========================================="
echo "💡 Si le navigateur voit toujours 'Welcome to nginx!',"
echo "   vérifiez que vous accédez via https://www.talosprimes.com"
echo "   et non https://talosprimes.com (sans www)"
echo ""
