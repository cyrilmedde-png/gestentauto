#!/bin/bash

# Script de correction FINALE pour TOUTES les erreurs
# Corrige: InvariantError, Failed to find Server Action, etc.

set -e

echo "🔧 Correction FINALE de TOUTES les erreurs"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2 COMPLÈTEMENT
echo "⏸️  ÉTAPE 1: Arrêt complet de PM2..."
pm2 stop talosprime 2>/dev/null || true
pm2 delete talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Supprimer TOUS les processus node qui pourraient bloquer
echo "🔍 ÉTAPE 2: Nettoyage des processus node..."
pkill -f "next start" 2>/dev/null || true
pkill -f "node.*talosprime" 2>/dev/null || true
sleep 2
echo "✅ Processus nettoyés"
echo ""

# 3. NETTOYAGE ULTRA-AGRESSIF de tous les caches
echo "🧹 ÉTAPE 3: Nettoyage ULTRA-AGRESSIF de tous les caches..."
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

# 4. NETTOYER les logs PM2 pour un départ propre
echo "🧹 ÉTAPE 4: Nettoyage des logs PM2..."
pm2 flush 2>/dev/null || true
echo "✅ Logs nettoyés"
echo ""

# 5. Rebuild COMPLET avec vérifications
echo "🔨 ÉTAPE 5: Rebuild complet de l'application..."
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

# 6. Vérifier qu'il n'y a PAS de dossier pages/ (Pages Router)
echo "🔍 ÉTAPE 6: Vérification qu'il n'y a pas de Pages Router..."
if [ -d ".next/server/pages" ]; then
    echo "⚠️  ATTENTION: Dossier .next/server/pages existe (Pages Router)"
    echo "   Ceci peut causer des conflits. Suppression..."
    rm -rf .next/server/pages
    echo "✅ Dossier pages/ supprimé"
else
    echo "✅ Pas de Pages Router (normal pour App Router)"
fi
echo ""

# 7. Redémarrer PM2 PROPREMENT avec les nouvelles variables d'environnement
echo "🔄 ÉTAPE 7: Redémarrage propre de PM2..."

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

# 8. Attendre que l'application démarre complètement
echo "⏳ ÉTAPE 8: Attente du démarrage complet (10 secondes)..."
sleep 10
echo ""

# 9. Vérifier que PM2 fonctionne
echo "🔍 ÉTAPE 9: Vérification du statut PM2..."
pm2 status
echo ""

echo "✅ Correction FINALE terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo "  2. Vérifiez qu'il n'y a plus d'erreur InvariantError dans les logs"
echo "  3. Vérifiez qu'il n'y a plus d'erreur 'Failed to find Server Action'"
echo ""
echo "📋 Logs du build disponibles dans: $BUILD_LOG"
echo ""
