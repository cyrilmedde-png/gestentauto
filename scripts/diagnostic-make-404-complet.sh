#!/bin/bash

# Script de diagnostic complet pour le 404 de /platform/make
# À exécuter sur le serveur

set -e

echo "🔍 Diagnostic complet du 404 pour /platform/make"
echo ""

cd /var/www/talosprime

echo "1️⃣ Vérification des fichiers..."
echo ""

# Vérifier que les fichiers existent
if [ ! -f "app/platform/make/page.tsx" ]; then
    echo "❌ ERREUR: app/platform/make/page.tsx n'existe pas!"
    exit 1
fi
echo "✅ app/platform/make/page.tsx existe"

if [ ! -f "app/platform/make/make-page-client.tsx" ]; then
    echo "❌ ERREUR: app/platform/make/make-page-client.tsx n'existe pas!"
    exit 1
fi
echo "✅ app/platform/make/make-page-client.tsx existe"

if [ ! -f "components/auth/ProtectedPlatformRoute.tsx" ]; then
    echo "❌ ERREUR: components/auth/ProtectedPlatformRoute.tsx n'existe pas!"
    exit 1
fi
echo "✅ components/auth/ProtectedPlatformRoute.tsx existe"

echo ""
echo "2️⃣ Vérification du contenu de page.tsx..."
echo ""

# Vérifier que page.tsx contient 'use client'
if ! grep -q "'use client'" app/platform/make/page.tsx; then
    echo "❌ ERREUR: page.tsx ne contient pas 'use client'"
    exit 1
fi
echo "✅ page.tsx contient 'use client'"

# Vérifier que page.tsx contient ProtectedPlatformRoute
if ! grep -q "ProtectedPlatformRoute" app/platform/make/page.tsx; then
    echo "❌ ERREUR: page.tsx ne contient pas ProtectedPlatformRoute"
    exit 1
fi
echo "✅ page.tsx contient ProtectedPlatformRoute"

# Vérifier que page.tsx contient MakePageClient
if ! grep -q "MakePageClient" app/platform/make/page.tsx; then
    echo "❌ ERREUR: page.tsx ne contient pas MakePageClient"
    exit 1
fi
echo "✅ page.tsx contient MakePageClient"

echo ""
echo "3️⃣ Vérification du build Next.js..."
echo ""

# Vérifier que .next existe
if [ ! -d ".next" ]; then
    echo "⚠️  .next n'existe pas - le build n'a pas été fait"
    echo "   Exécutez: npm run build"
    exit 1
fi
echo "✅ .next existe"

# Vérifier que la route est dans le build
if [ -d ".next/server/app/platform/make" ]; then
    echo "✅ Route /platform/make trouvée dans .next/server/app/platform/make"
    
    if [ -f ".next/server/app/platform/make/page.js" ] || [ -f ".next/server/app/platform/make/page.jsx" ]; then
        echo "✅ page.js trouvé dans le build"
    else
        echo "⚠️  page.js non trouvé dans le build"
        echo "   Contenu de .next/server/app/platform/make:"
        ls -la .next/server/app/platform/make/ 2>/dev/null || echo "   (dossier vide ou inexistant)"
    fi
else
    echo "❌ Route /platform/make NON trouvée dans .next/server/app/platform/make"
    echo "   Le build ne contient pas cette route!"
    echo ""
    echo "   Routes platform disponibles:"
    ls -la .next/server/app/platform/ 2>/dev/null | grep "^d" | awk '{print $9}' || echo "   (aucune route trouvée)"
fi

echo ""
echo "4️⃣ Vérification de PM2..."
echo ""

if pm2 list | grep -q "talosprime.*online"; then
    echo "✅ PM2 process talosprime est online"
    pm2 list | grep talosprime
else
    echo "❌ PM2 process talosprime n'est pas online"
    pm2 list
fi

echo ""
echo "5️⃣ Test de la route..."
echo ""

# Tester localement
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Route locale retourne 200 OK"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Route locale retourne 404 - le problème est dans Next.js"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "⚠️  Impossible de tester localement (Next.js ne répond pas?)"
else
    echo "⚠️  Route locale retourne $HTTP_CODE"
fi

# Tester via le domaine
HTTP_CODE_DOMAIN=$(curl -s -o /dev/null -w "%{http_code}" https://talosprimes.com/platform/make 2>/dev/null || echo "000")

if [ "$HTTP_CODE_DOMAIN" = "200" ]; then
    echo "✅ Route domaine retourne 200 OK"
elif [ "$HTTP_CODE_DOMAIN" = "404" ]; then
    echo "❌ Route domaine retourne 404"
elif [ "$HTTP_CODE_DOMAIN" = "000" ]; then
    echo "⚠️  Impossible de tester via le domaine"
else
    echo "⚠️  Route domaine retourne $HTTP_CODE_DOMAIN"
fi

echo ""
echo "6️⃣ Vérification des logs récents..."
echo ""

echo "Dernières lignes des logs PM2:"
pm2 logs talosprime --lines 20 --nostream 2>/dev/null | tail -20 || echo "   (impossible de lire les logs)"

echo ""
echo "✅ Diagnostic terminé"
echo ""
echo "Si tout est ✅ mais que vous avez toujours 404:"
echo "  1. Videz le cache du navigateur (Ctrl+Shift+R)"
echo "  2. Testez en navigation privée"
echo "  3. Vérifiez les logs PM2: pm2 logs talosprime --lines 50"

