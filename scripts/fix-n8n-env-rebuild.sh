#!/bin/bash
# Script pour rebuild Next.js avec les variables N8N
# Usage: ./scripts/fix-n8n-env-rebuild.sh

set -e

cd /var/www/talosprime

echo "🔧 Correction de la connexion N8N dans Next.js"
echo "================================================"
echo ""

# 1. Vérifier les variables
echo "1️⃣  Vérification des variables N8N..."
if grep -q "N8N_URL=" .env.production && grep -q "N8N_BASIC_AUTH_USER=" .env.production && grep -q "N8N_BASIC_AUTH_PASSWORD=" .env.production; then
    echo "   ✅ Variables N8N trouvées dans .env.production"
    N8N_URL=$(grep "^N8N_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    echo "   📋 N8N_URL: $N8N_URL"
else
    echo "   ❌ Variables N8N manquantes dans .env.production"
    exit 1
fi
echo ""

# 2. Vérifier que N8N est accessible
echo "2️⃣  Test de connexion à N8N..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "$N8N_URL" || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ N8N est accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ N8N n'est pas accessible (HTTP $HTTP_CODE)"
    echo "   💡 Vérifiez que N8N est démarré: pm2 status n8n"
    exit 1
fi
echo ""

# 3. Nettoyer le cache Next.js
echo "3️⃣  Nettoyage du cache Next.js..."
rm -rf .next
echo "   ✅ Cache nettoyé"
echo ""

# 4. Rebuild avec les variables d'environnement
echo "4️⃣  Build de l'application Next.js..."
echo "   ⏳ Cela peut prendre quelques minutes..."
npm run build

if [ $? -eq 0 ]; then
    echo "   ✅ Build réussi"
else
    echo "   ❌ Erreur lors du build"
    exit 1
fi
echo ""

# 5. Redémarrer PM2
echo "5️⃣  Redémarrage de l'application..."
pm2 restart talosprime
echo "   ✅ Application redémarrée"
echo ""

# 6. Attendre un peu pour le démarrage
echo "6️⃣  Attente du démarrage complet..."
sleep 5
echo ""

# 7. Tester la route health
echo "7️⃣  Test de la route /api/platform/n8n/health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/platform/n8n/health || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Route health répond avec 200 OK"
    
    # Tester le contenu de la réponse
    RESPONSE=$(curl -s http://localhost:3000/api/platform/n8n/health)
    if echo "$RESPONSE" | grep -q "connected"; then
        echo "   ✅ La réponse contient le statut de connexion"
        echo "   📋 Réponse:"
        echo "$RESPONSE" | head -5
    fi
else
    echo "   ⚠️  Route health répond avec HTTP $HTTP_CODE"
    echo "   💡 Vérifiez les logs: pm2 logs talosprime --err --lines 20"
fi
echo ""

echo "================================================"
echo "✅ Correction terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Testez l'interface: https://www.talosprimes.com/platform/n8n"
echo "   2. Si l'erreur persiste, vérifiez les logs:"
echo "      pm2 logs talosprime --err --lines 30"
echo ""


