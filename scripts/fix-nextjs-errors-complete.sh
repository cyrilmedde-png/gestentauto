#!/bin/bash

# Script de correction COMPLÈTE pour toutes les erreurs Next.js
# Corrige: InvariantError, Failed to find Server Action, Failed to load static file /500

set -e

echo "🔧 Correction COMPLÈTE de toutes les erreurs Next.js"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2 COMPLÈTEMENT
echo "⏸️  Arrêt complet de PM2..."
pm2 stop talosprime 2>/dev/null || true
pm2 delete talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Supprimer TOUS les processus node qui pourraient bloquer
echo "🔍 Recherche de processus node en cours..."
pkill -f "next start" 2>/dev/null || true
pkill -f "node.*talosprime" 2>/dev/null || true
sleep 2
echo "✅ Processus nettoyés"
echo ""

# 3. NETTOYAGE ULTRA-AGRESSIF de tous les caches
echo "🧹 Nettoyage ULTRA-AGRESSIF de tous les caches..."
rm -rf .next
rm -rf .next/cache
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf node_modules/.next
rm -rf .swc
rm -rf .vercel
rm -rf out
rm -rf build
rm -rf dist
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true
echo "✅ Tous les caches supprimés"
echo ""

# 4. Vérifier que la page Make existe et est correcte
echo "🔍 Vérification de la page Make..."
if [ ! -f "app/platform/make/page.tsx" ]; then
    echo "❌ ERREUR: app/platform/make/page.tsx n'existe pas!"
    exit 1
fi

# Vérifier que c'est bien un client component
if ! grep -q "'use client'" app/platform/make/page.tsx; then
    echo "❌ ERREUR: La page n'est pas un client component!"
    exit 1
fi

# Vérifier qu'elle exporte bien une fonction par défaut
if ! grep -q "export default function MakePage" app/platform/make/page.tsx; then
    echo "❌ ERREUR: La page n'exporte pas MakePage par défaut!"
    exit 1
fi

echo "✅ Page Make vérifiée et correcte"
echo ""

# 5. Vérifier qu'il n'y a pas de fichiers orphelins
echo "🔍 Vérification des fichiers orphelins..."
if [ -f "app/platform/make/layout.tsx" ]; then
    echo "⚠️  ATTENTION: layout.tsx existe, suppression..."
    rm -f app/platform/make/layout.tsx
fi
if [ -f "app/platform/make/make-page-client.tsx" ]; then
    echo "⚠️  ATTENTION: make-page-client.tsx existe, suppression..."
    rm -f app/platform/make/make-page-client.tsx
fi
echo "✅ Fichiers orphelins supprimés"
echo ""

# 6. Vérifier la structure du dossier
echo "🔍 Vérification de la structure..."
ls -la app/platform/make/
echo ""

# 7. NETTOYER les logs PM2 pour un départ propre
echo "🧹 Nettoyage des logs PM2..."
pm2 flush 2>/dev/null || true
echo "✅ Logs nettoyés"
echo ""

# 8. Rebuild COMPLET avec vérifications
echo "🔨 Rebuild complet de l'application..."
BUILD_LOG="/tmp/nextjs-build-$(date +%Y%m%d_%H%M%S).log"
if npm run build 2>&1 | tee "$BUILD_LOG"; then
    echo ""
    echo "✅ Build réussi!"
else
    echo ""
    echo "❌ ERREUR lors du build!"
    echo "📋 Logs du build disponibles dans: $BUILD_LOG"
    exit 1
fi
echo ""

# 9. Vérifier que la route apparaît dans le build
echo "🔍 Vérification que la route /platform/make est dans le build..."
if grep -q "/platform/make" "$BUILD_LOG"; then
    echo "✅ Route /platform/make trouvée dans le build:"
    grep "/platform/make" "$BUILD_LOG" | head -1
else
    echo "⚠️  Route /platform/make non trouvée dans les logs du build"
    echo "📋 Recherche dans les fichiers générés..."
    if [ -f ".next/BUILD_ID" ]; then
        echo "✅ BUILD_ID existe"
    fi
fi
echo ""

# 10. Vérifier que les fichiers build existent
echo "🔍 Vérification des fichiers build générés..."
if [ -f ".next/server/app/platform/make/page.js" ]; then
    echo "✅ .next/server/app/platform/make/page.js existe"
    ls -lh .next/server/app/platform/make/page.js
else
    echo "❌ .next/server/app/platform/make/page.js n'existe pas!"
    echo "📋 Contenu du dossier .next/server/app/platform/:"
    ls -la .next/server/app/platform/ 2>/dev/null || echo "  (dossier inexistant)"
    echo ""
    echo "📋 Structure complète de .next/server/app/:"
    find .next/server/app/platform -name "*.js" 2>/dev/null | head -20 || echo "  (aucun fichier trouvé)"
    exit 1
fi

# Vérifier que le manifest client existe (peut ne pas exister pour les routes statiques)
if [ -f ".next/server/app/platform/make/page_client-reference-manifest.js" ]; then
    echo "✅ Manifest client existe"
else
    echo "ℹ️  Manifest client non trouvé (normal si route statique)"
fi
echo ""

# 11. Vérifier qu'il n'y a PAS de dossier pages/ (Pages Router)
echo "🔍 Vérification qu'il n'y a pas de Pages Router..."
if [ -d ".next/server/pages" ]; then
    echo "⚠️  ATTENTION: Dossier .next/server/pages existe (Pages Router)"
    echo "   Ceci peut causer des conflits. Suppression..."
    rm -rf .next/server/pages
    echo "✅ Dossier pages/ supprimé"
else
    echo "✅ Pas de Pages Router (normal pour App Router)"
fi
echo ""

# 12. Redémarrer PM2 PROPREMENT
echo "🔄 Redémarrage propre de PM2..."

# Vérifier si PM2 est déjà configuré
if pm2 list | grep -q "talosprime"; then
    pm2 restart talosprime --update-env
else
    # Créer la commande PM2 si elle n'existe pas
    cd "$(pwd)"
    pm2 start npm --name talosprime -- start --update-env
fi

sleep 3
pm2 save 2>/dev/null || true
echo "✅ PM2 redémarré"
echo ""

# 13. Attendre que l'application démarre complètement
echo "⏳ Attente du démarrage complet (10 secondes)..."
sleep 10
echo ""

# 14. Vérifier que PM2 fonctionne
echo "🔍 Vérification du statut PM2..."
pm2 status
echo ""

# 15. Tester la route localement
echo "🧪 Test de la route /platform/make sur localhost..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Route fonctionne! (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "✅ Redirection détectée (HTTP $HTTP_CODE) - normal (authentification)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ ERREUR: Route retourne toujours 404!"
    echo "📋 Derniers logs PM2:"
    pm2 logs talosprime --lines 20 --nostream
    exit 1
else
    echo "⚠️  Code HTTP: $HTTP_CODE"
fi
echo ""

echo "✅ Correction terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo "  2. Testez sur le domaine: https://www.talosprimes.com/platform/make"
echo "  3. Si des erreurs persistent, vérifiez les logs détaillés"
echo ""
echo "📋 Logs du build disponibles dans: $BUILD_LOG"
echo ""

