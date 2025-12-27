#!/bin/bash

echo "🔍 Diagnostic du proxy Make.com"
echo "=================================="
echo ""

cd /var/www/talosprime

echo "1️⃣ Vérification de l'existence des fichiers Make..."
echo "---------------------------------------------------"
if [ -f "app/api/platform/make/proxy/route.ts" ]; then
    echo "✅ Route racine trouvée: app/api/platform/make/proxy/route.ts"
else
    echo "❌ Route racine MANQUANTE: app/api/platform/make/proxy/route.ts"
fi

if [ -f "app/api/platform/make/proxy/[...path]/route.ts" ]; then
    echo "✅ Route catch-all trouvée: app/api/platform/make/proxy/[...path]/route.ts"
else
    echo "❌ Route catch-all MANQUANTE: app/api/platform/make/proxy/[...path]/route.ts"
fi

if [ -f "lib/services/make.ts" ]; then
    echo "✅ Service Make trouvé: lib/services/make.ts"
else
    echo "❌ Service Make MANQUANT: lib/services/make.ts"
fi

echo ""
echo "2️⃣ Vérification des variables d'environnement Make..."
echo "---------------------------------------------------"
if grep -q "MAKE_URL\|NEXT_PUBLIC_MAKE_URL" .env.production 2>/dev/null; then
    echo "✅ Variables Make trouvées dans .env.production:"
    grep "MAKE_URL\|NEXT_PUBLIC_MAKE_URL" .env.production | sed 's/=.*/=***/' 
else
    echo "⚠️  Variables Make non trouvées dans .env.production"
fi

echo ""
echo "3️⃣ Vérification du build Next.js..."
echo "---------------------------------------------------"
if [ -d ".next" ]; then
    echo "✅ Dossier .next existe"
    
    if [ -f ".next/server/app/api/platform/make/proxy/route.js" ]; then
        echo "✅ Route Make compilée trouvée dans .next"
    else
        echo "❌ Route Make NON compilée dans .next"
        echo "   Cela indique que le build n'a pas inclus la route Make"
    fi
else
    echo "❌ Dossier .next n'existe pas - le build n'a pas été effectué"
fi

echo ""
echo "4️⃣ Vérification des logs PM2 pour Make..."
echo "---------------------------------------------------"
echo "Dernières lignes contenant 'make' ou 'Make':"
pm2 logs talosprime --lines 500 --nostream 2>/dev/null | grep -i "make\|proxy.*make" | tail -20 || echo "Aucun log Make trouvé"

echo ""
echo "5️⃣ Test de la route proxy Make..."
echo "---------------------------------------------------"
echo "Test avec curl (devrait retourner 403 si la route fonctionne, 502 si elle ne fonctionne pas):"
curl -s -o /dev/null -w "Status HTTP: %{http_code}\n" https://www.talosprimes.com/api/platform/make/proxy || echo "Erreur lors du test"

echo ""
echo "6️⃣ État de PM2..."
echo "---------------------------------------------------"
pm2 list | grep talosprime

echo ""
echo "✅ Diagnostic terminé"
echo ""
echo "💡 Si la route n'est pas compilée dans .next, exécutez:"
echo "   npm run build && pm2 restart talosprime"



