#!/bin/bash

# Script pour mettre à jour le serveur avec les fixes de rechargement
# Exécute tout en une seule fois : git pull, build, restart

set -e

echo "🔄 Mise à jour complète du serveur - Fix rechargements"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2
echo "⏸️  ÉTAPE 1/7: Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Sauvegarder les changements locaux
echo "💾 ÉTAPE 2/7: Sauvegarde des changements locaux..."
git stash 2>/dev/null || true
echo "✅ Changements sauvegardés"
echo ""

# 3. Récupérer les modifications depuis GitHub
echo "📥 ÉTAPE 3/7: Récupération des modifications depuis GitHub..."
if git pull origin main; then
    echo "✅ Modifications récupérées"
else
    echo "❌ Erreur lors du git pull"
    echo "💡 Essayez: git pull origin main --rebase"
    exit 1
fi
echo ""

# 4. Nettoyer les caches
echo "🧹 ÉTAPE 4/7: Nettoyage des caches..."
rm -rf .next .next/cache node_modules/.cache .turbo
find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
echo "✅ Caches nettoyés"
echo ""

# 5. Rebuild de l'application
echo "🔨 ÉTAPE 5/7: Rebuild de l'application..."
if npm run build; then
    echo "✅ Build réussi!"
else
    echo "❌ ERREUR lors du build!"
    exit 1
fi
echo ""

# 6. Supprimer Pages Router si présent
echo "🔍 ÉTAPE 6/7: Vérification du Pages Router..."
if [ -d ".next/server/pages" ]; then
    echo "⚠️  Dossier .next/server/pages existe - suppression..."
    rm -rf .next/server/pages
    echo "✅ Dossier pages/ supprimé"
else
    echo "✅ Pas de Pages Router"
fi
echo ""

# 7. Redémarrer PM2
echo "🔄 ÉTAPE 7/7: Redémarrage de PM2..."
pm2 restart talosprime --update-env 2>/dev/null || pm2 start npm --name talosprime -- start --update-env
sleep 3
pm2 save 2>/dev/null || true
echo "✅ PM2 redémarré"
echo ""

# Attendre le démarrage
echo "⏳ Attente du démarrage complet (10 secondes)..."
sleep 10
echo ""

# Vérifier le statut
echo "🔍 Vérification du statut..."
pm2 status
echo ""

echo "✅ Mise à jour terminée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo "  2. Testez l'application: https://www.talosprimes.com"
echo "  3. Testez N8N: https://www.talosprimes.com/platform/n8n"
echo "  4. Changez d'onglet et revenez - l'iframe NE DOIT PAS recharger"
echo ""




