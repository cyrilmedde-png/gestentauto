#!/bin/bash
# Script pour vérifier si le nouveau code N8N est dans le build
# Usage: ./scripts/verifier-build-n8n.sh

set -e

cd /var/www/talosprime

echo "🔍 Vérification du build N8N"
echo "============================"
echo ""

# 1. Vérifier le code source
echo "1️⃣  Code source:"
if grep -q "Utilisation de https.request()" lib/services/n8n.ts; then
    echo "   ✅ Nouveau code trouvé dans lib/services/n8n.ts"
else
    echo "   ❌ Nouveau code NON trouvé dans lib/services/n8n.ts"
    echo "   💡 Faites: git pull origin main"
    exit 1
fi
echo ""

# 2. Vérifier si .next existe
echo "2️⃣  Dossier .next:"
if [ -d .next ]; then
    echo "   ✅ Dossier .next existe"
    
    # Vérifier la date du build
    BUILD_TIME=$(stat -c %y .next 2>/dev/null || stat -f %Sm .next 2>/dev/null || echo "inconnue")
    echo "   📅 Dernier build: $BUILD_TIME"
else
    echo "   ❌ Dossier .next n'existe pas - BUILD REQUIS"
    echo "   💡 Exécutez: npm run build"
    exit 1
fi
echo ""

# 3. Chercher le code dans le build (peut être minifié)
echo "3️⃣  Recherche dans le build:"
if grep -r "https.request" .next/server 2>/dev/null | head -1 > /dev/null; then
    echo "   ✅ Code https.request trouvé dans le build"
    echo "   📋 Exemple:"
    grep -r "https.request" .next/server 2>/dev/null | head -1 | cut -c1-100
else
    echo "   ⚠️  Code https.request NON trouvé dans le build"
    echo "   💡 Le code peut être minifié ou le build est ancien"
    echo "   💡 Rebuild requis: rm -rf .next && npm run build"
fi
echo ""

# 4. Vérifier les logs PM2
echo "4️⃣  Vérification des logs PM2:"
if pm2 logs talosprime --lines 100 --nostream 2>/dev/null | grep -q "Utilisation de https.request()"; then
    echo "   ✅ Nouveau code détecté dans les logs (s'exécute)"
else
    echo "   ❌ Nouveau code NON détecté dans les logs"
    echo "   💡 L'ancien code est encore utilisé"
    echo "   💡 Rebuild et redémarrage requis"
fi
echo ""

echo "============================"
echo "📊 Résumé:"
echo ""
echo "Si le nouveau code n'est pas dans les logs:"
echo "   1. rm -rf .next"
echo "   2. npm run build"
echo "   3. pm2 restart talosprime"
echo ""





