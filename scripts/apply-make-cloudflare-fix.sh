#!/bin/bash

# Script pour appliquer les corrections Cloudflare/Make.com sur le serveur
# Ce script récupère les changements, rebuild et redémarre l'application

set -e

echo "🔧 Application des corrections Cloudflare/Make.com"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2
echo "⏸️  Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || true
echo "✅ PM2 arrêté"
echo ""

# 2. Récupérer les changements depuis GitHub
echo "📥 Récupération des changements depuis GitHub..."
git pull origin main
echo "✅ Changements récupérés"
echo ""

# 3. Nettoyer les caches
echo "🧹 Nettoyage des caches..."
rm -rf .next
rm -rf .next/cache
rm -rf node_modules/.cache
echo "✅ Caches nettoyés"
echo ""

# 4. Rebuild l'application
echo "🔨 Rebuild de l'application..."
npm run build
echo "✅ Build réussi"
echo ""

# 5. Redémarrer PM2
echo "🔄 Redémarrage de PM2..."
pm2 restart talosprime --update-env || pm2 start npm --name talosprime -- start --update-env
pm2 save 2>/dev/null || true
echo "✅ PM2 redémarré"
echo ""

# 6. Attendre que l'application démarre
echo "⏳ Attente du démarrage (5 secondes)..."
sleep 5
echo ""

# 7. Vérifier le statut
echo "🔍 Vérification du statut PM2..."
pm2 status
echo ""

# 8. Afficher les dernières lignes des logs
echo "📋 Dernières lignes des logs (pour vérification)..."
pm2 logs talosprime --lines 20 --nostream
echo ""

echo "✅ ✅ ✅ CORRECTIONS APPLIQUÉES ! ✅ ✅ ✅"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Testez la page: https://www.talosprimes.com/platform/make"
echo "  2. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo "  3. Si le problème persiste, vérifiez que les cookies Cloudflare sont transmis"
echo ""

