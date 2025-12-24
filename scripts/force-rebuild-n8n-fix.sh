#!/bin/bash
# Script pour forcer un rebuild complet avec le nouveau code N8N
# Usage: ./scripts/force-rebuild-n8n-fix.sh

set -e

cd /var/www/talosprime

echo "🔄 Rebuild complet avec le nouveau code N8N"
echo "============================================="
echo ""

# 1. Récupérer les dernières modifications
echo "1️⃣  Récupération des modifications depuis GitHub..."
git pull origin main
echo ""

# 2. Vérifier que le nouveau code est présent
echo "2️⃣  Vérification du code source..."
if grep -q "Utilisation de https.request()" lib/services/n8n.ts; then
    echo "   ✅ Nouveau code trouvé dans lib/services/n8n.ts"
else
    echo "   ❌ Nouveau code NON trouvé !"
    echo "   💡 Le fichier n'a peut-être pas été mis à jour"
    exit 1
fi

if grep -q "https.request" lib/services/n8n.ts; then
    echo "   ✅ Code https.request() trouvé"
else
    echo "   ❌ Code https.request() NON trouvé !"
    exit 1
fi
echo ""

# 3. Arrêter PM2
echo "3️⃣  Arrêt de l'application..."
pm2 stop talosprime || true
echo "   ✅ Application arrêtée"
echo ""

# 4. Nettoyer complètement
echo "4️⃣  Nettoyage complet..."
rm -rf .next
rm -rf node_modules/.cache
echo "   ✅ Cache nettoyé"
echo ""

# 5. Rebuild
echo "5️⃣  Build de l'application..."
echo "   ⏳ Cela peut prendre quelques minutes..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build réussi"
else
    echo "   ❌ Erreur lors du build"
    exit 1
fi
echo ""

# 6. Vérifier que le nouveau code est dans le build
echo "6️⃣  Vérification du build..."
if grep -r "Utilisation de https.request()" .next/server 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ Nouveau code trouvé dans le build"
else
    echo "   ⚠️  Nouveau code non trouvé dans le build (peut être normal si minifié)"
fi

if grep -r "https.request" .next/server 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ Code https.request() trouvé dans le build"
else
    echo "   ⚠️  Code https.request() non trouvé (peut être normal si minifié)"
fi
echo ""

# 7. Redémarrer
echo "7️⃣  Redémarrage de l'application..."
pm2 start talosprime || pm2 restart talosprime
echo "   ✅ Application redémarrée"
echo ""

# 8. Attendre le démarrage
echo "8️⃣  Attente du démarrage complet..."
sleep 8
echo ""

# 9. Tester
echo "9️⃣  Test de la route health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/platform/n8n/health || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Route health répond (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Route health répond avec HTTP $HTTP_CODE"
fi
echo ""

echo "============================================="
echo "✅ Rebuild terminé !"
echo ""
echo "📋 Vérifiez les logs pour voir les nouveaux messages:"
echo "   pm2 logs talosprime --lines 30 --nostream | grep -A 30 'testN8NConnection'"
echo ""
echo "💡 Les nouveaux logs devraient montrer:"
echo "   - '[testN8NConnection] Utilisation de https.request() (nouveau code)'"
echo "   - '[testN8NConnection] URL parsée:'"
echo "   - '[testN8NConnection] Erreur https.request:' (si erreur)"
echo ""

