#!/bin/bash
# Script pour recharger Nginx et vérifier la connexion

echo "🔄 Rechargement de Nginx"
echo "========================"
echo ""

# Vérifier la configuration
echo "1️⃣  Test de la configuration Nginx..."
if nginx -t 2>&1; then
    echo "   ✅ Configuration valide"
else
    echo "   ❌ Erreur dans la configuration"
    exit 1
fi
echo ""

# Recharger Nginx
echo "2️⃣  Rechargement de Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "   ✅ Nginx rechargé"
else
    echo "   ❌ Erreur lors du rechargement"
    exit 1
fi
echo ""

# Vérifier que Nginx tourne
echo "3️⃣  Vérification du statut Nginx..."
systemctl status nginx --no-pager -l | head -10
echo ""

# Tester la connexion depuis Nginx vers Next.js
echo "4️⃣  Test de connexion depuis Nginx vers Next.js..."
# Simuler une requête comme Nginx le ferait
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:3000/platform/n8n
echo ""

# Vérifier les logs récents
echo "5️⃣  Dernières erreurs Nginx (10 dernières lignes):"
tail -10 /var/log/nginx/error.log | grep -E "error|failed" || echo "   ✅ Aucune erreur récente"
echo ""

# Vérifier les logs d'accès récents
echo "6️⃣  Derniers accès (5 dernières lignes):"
tail -5 /var/log/nginx/access.log 2>/dev/null || echo "   ⚠️  Fichier d'accès non disponible"
echo ""

echo "========================"
echo "✅ Vérifications terminées"
echo ""
echo "💡 Testez maintenant depuis le navigateur:"
echo "   https://www.talosprimes.com/platform/n8n"
echo ""
