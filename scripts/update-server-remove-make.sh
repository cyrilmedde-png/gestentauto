#!/bin/bash

# Script pour mettre à jour le serveur après suppression de Make
# À exécuter sur le serveur VPS

set -e

echo "🔄 Mise à jour du serveur après suppression de Make"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2
echo "⏸️  ÉTAPE 1: Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Sauvegarder les changements locaux (si nécessaire)
echo "💾 ÉTAPE 2: Sauvegarde des changements locaux..."
git stash 2>/dev/null || true
echo "✅ Changements sauvegardés"
echo ""

# 3. Récupérer les dernières modifications depuis GitHub
echo "📥 ÉTAPE 3: Récupération des modifications depuis GitHub..."
if git pull origin main; then
    echo "✅ Modifications récupérées"
else
    echo "❌ Erreur lors du git pull"
    echo "💡 Essayez: git pull origin main --rebase"
    exit 1
fi
echo ""

# 4. Vérifier que les fichiers Make ont bien été supprimés
echo "🔍 ÉTAPE 4: Vérification de la suppression de Make..."
if [ -d "app/platform/make" ]; then
    echo "⚠️  ATTENTION: app/platform/make/ existe encore - suppression..."
    rm -rf app/platform/make
fi
if [ -d "app/api/platform/make" ]; then
    echo "⚠️  ATTENTION: app/api/platform/make/ existe encore - suppression..."
    rm -rf app/api/platform/make
fi
if [ -f "lib/services/make.ts" ]; then
    echo "⚠️  ATTENTION: lib/services/make.ts existe encore - suppression..."
    rm -f lib/services/make.ts
fi
echo "✅ Vérification terminée"
echo ""

# 5. Nettoyer les caches
echo "🧹 ÉTAPE 5: Nettoyage des caches..."
rm -rf .next
rm -rf .next/cache
rm -rf node_modules/.cache
rm -rf .turbo
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
echo "✅ Caches nettoyés"
echo ""

# 6. Rebuild de l'application
echo "🔨 ÉTAPE 6: Rebuild de l'application..."
if npm run build; then
    echo "✅ Build réussi!"
else
    echo "❌ ERREUR lors du build!"
    exit 1
fi
echo ""

# 7. Vérifier qu'il n'y a plus de Pages Router
echo "🔍 ÉTAPE 7: Vérification du Pages Router..."
if [ -d ".next/server/pages" ]; then
    echo "⚠️  Dossier .next/server/pages existe - suppression..."
    rm -rf .next/server/pages
    echo "✅ Dossier pages/ supprimé"
else
    echo "✅ Pas de Pages Router"
fi
echo ""

# 8. Redémarrer PM2
echo "🔄 ÉTAPE 8: Redémarrage de PM2..."
pm2 restart talosprime --update-env 2>/dev/null || pm2 start npm --name talosprime -- start --update-env
sleep 3
pm2 save 2>/dev/null || true
echo "✅ PM2 redémarré"
echo ""

# 9. Attendre le démarrage
echo "⏳ ÉTAPE 9: Attente du démarrage (10 secondes)..."
sleep 10
echo ""

# 10. Vérifier le statut
echo "🔍 ÉTAPE 10: Vérification du statut..."
pm2 status
echo ""

# 11. Vérifier qu'il n'y a plus de références à Make dans les logs
echo "🔍 ÉTAPE 11: Vérification des logs (pas de références Make)..."
if pm2 logs talosprime --lines 50 --nostream 2>/dev/null | grep -qi "make\|/platform/make"; then
    echo "⚠️  ATTENTION: Des références à Make apparaissent encore dans les logs"
    echo "   Cela peut être normal si ce sont des erreurs 404 (route supprimée)"
else
    echo "✅ Pas de références Make dans les logs récents"
fi
echo ""

echo "✅ Mise à jour terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo "  2. Testez l'application: https://www.talosprimes.com"
echo "  3. Vérifiez que /platform/make retourne bien 404 (normal, route supprimée)"
echo "  4. Vérifiez que N8N fonctionne toujours: /platform/n8n"
echo ""

