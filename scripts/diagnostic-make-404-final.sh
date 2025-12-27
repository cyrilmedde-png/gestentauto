#!/bin/bash

# Script de diagnostic complet pour l'erreur 404 sur /platform/make

set -e

echo "🔍 Diagnostic complet de l'erreur 404 sur /platform/make"
echo "=================================================="
echo ""

# 1. Vérifier les fichiers
echo "📁 1. Vérification des fichiers..."
if [ -f "app/platform/make/page.tsx" ]; then
    echo "✅ app/platform/make/page.tsx existe"
    if grep -q "export const dynamic" app/platform/make/page.tsx; then
        echo "✅ export const dynamic trouvé dans page.tsx"
    else
        echo "❌ export const dynamic NON trouvé dans page.tsx"
    fi
    if grep -q "unstable_noStore" app/platform/make/page.tsx; then
        echo "✅ unstable_noStore trouvé dans page.tsx"
    else
        echo "❌ unstable_noStore NON trouvé dans page.tsx"
    fi
else
    echo "❌ app/platform/make/page.tsx n'existe pas"
fi

if [ -f "app/platform/make/layout.tsx" ]; then
    echo "✅ app/platform/make/layout.tsx existe"
    if grep -q "export const dynamic" app/platform/make/layout.tsx; then
        echo "✅ export const dynamic trouvé dans layout.tsx"
    else
        echo "❌ export const dynamic NON trouvé dans layout.tsx"
    fi
else
    echo "❌ app/platform/make/layout.tsx n'existe pas"
fi

echo ""

# 2. Vérifier .env.production
echo "🔧 2. Vérification de .env.production..."
if [ -f ".env.production" ]; then
    echo "✅ .env.production existe"
    echo ""
    echo "📋 URLs Make.com dans .env.production:"
    grep -E "MAKE_URL|NEXT_PUBLIC_MAKE_URL" .env.production || echo "  (aucune URL Make trouvée)"
    
    if grep -q "eul\.make\.com\|eul.make.com" .env.production; then
        echo ""
        echo "❌ TYPO DÉTECTÉE: eul.make.com (devrait être eu1.make.com)"
        echo "💡 Exécutez: sed -i 's/eul\.make\.com/eu1.make.com/g' .env.production"
    else
        echo ""
        echo "✅ Aucune typo 'eul' détectée"
    fi
else
    echo "❌ .env.production n'existe pas"
fi

echo ""

# 3. Vérifier le build
echo "📦 3. Vérification du dernier build..."
if [ -d ".next" ]; then
    echo "✅ .next existe"
    
    # Vérifier si la route est dans le build
    if [ -f ".next/server/app/platform/make/page.js" ]; then
        echo "✅ .next/server/app/platform/make/page.js existe"
    else
        echo "❌ .next/server/app/platform/make/page.js n'existe pas"
    fi
    
    if [ -f ".next/server/app/platform/make/layout.js" ]; then
        echo "✅ .next/server/app/platform/make/layout.js existe"
    else
        echo "⚠️  .next/server/app/platform/make/layout.js n'existe pas (peut être normal)"
    fi
else
    echo "❌ .next n'existe pas - le build n'a pas été fait"
fi

echo ""

# 4. Tester la route localement
echo "🌐 4. Test de la route locale..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make | grep -q "200\|301\|302\|307\|308"; then
    echo "✅ Route accessible localement (HTTP 200/3xx)"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make)
    echo "   Code HTTP: $HTTP_CODE"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make)
    echo "❌ Route retourne HTTP $HTTP_CODE (attendu: 200 ou 3xx)"
fi

echo ""

# 5. Vérifier PM2
echo "🔄 5. Vérification de PM2..."
if pm2 list | grep -q "talosprime.*online"; then
    echo "✅ PM2 talosprime est online"
    echo ""
    echo "📋 Derniers logs PM2 (20 lignes):"
    pm2 logs talosprime --lines 20 --nostream | tail -20
else
    echo "❌ PM2 talosprime n'est pas online"
fi

echo ""
echo "=================================================="
echo "✅ Diagnostic terminé!"
echo ""
echo "💡 Actions recommandées:"
echo "1. Si typo détectée: sed -i 's/eul\.make\.com/eu1.make.com/g' .env.production"
echo "2. Si route inaccessible: rm -rf .next && npm run build && pm2 restart talosprime --update-env"
echo "3. Vérifier les logs: pm2 logs talosprime --lines 100"

