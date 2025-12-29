#!/bin/bash

echo "🔍 Recherche de la configuration nginx pour N8N..."
echo ""

# Chercher toutes les mentions de n8n dans nginx
echo "1. Recherche dans /etc/nginx/sites-available/ :"
sudo grep -r "n8n" /etc/nginx/sites-available/ 2>/dev/null || echo "Aucune configuration trouvée"

echo ""
echo "2. Recherche dans /etc/nginx/sites-enabled/ :"
sudo grep -r "n8n" /etc/nginx/sites-enabled/ 2>/dev/null || echo "Aucune configuration trouvée"

echo ""
echo "3. Recherche dans /etc/nginx/conf.d/ :"
sudo grep -r "n8n" /etc/nginx/conf.d/ 2>/dev/null || echo "Aucune configuration trouvée"

echo ""
echo "4. Recherche de n8n.talosprimes.com dans toutes les configs :"
sudo grep -r "n8n.talosprimes.com" /etc/nginx/ 2>/dev/null || echo "Aucune configuration trouvée"

echo ""
echo "5. Liste des fichiers dans sites-available :"
ls -la /etc/nginx/sites-available/

echo ""
echo "6. Liste des fichiers dans sites-enabled :"
ls -la /etc/nginx/sites-enabled/

echo ""
echo "7. Test d'accès direct à N8N (port 5678) :"
curl -I http://localhost:5678 2>/dev/null | head -5

echo ""
echo "8. Vérification que N8N tourne :"
pm2 list | grep n8n

