#!/bin/bash

# Script pour mettre à jour les corrections Cloudflare/Make.com sur le serveur

set -e

echo "🔧 Mise à jour des corrections Cloudflare/Make.com"
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
if git pull origin main; then
    echo "✅ Changements récupérés"
else
    echo "⚠️  Erreur lors du pull. Vérifiez votre connexion GitHub."
    echo "   Vous pouvez forcer avec: git reset --hard origin/main"
    exit 1
fi
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
if npm run build; then
    echo "✅ Build réussi"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
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

echo "✅ ✅ ✅ MISE À JOUR TERMINÉE ! ✅ ✅ ✅"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Testez la page: https://www.talosprimes.com/platform/make"
echo "  2. Attendez 10-15 secondes pour que le challenge Cloudflare se résolve"
echo "  3. Rechargez la page si nécessaire"
echo "  4. Vérifiez les logs: pm2 logs talosprime --lines 50"
echo ""
echo "🔍 Dans les logs, vous devriez voir:"
echo "   - 'Cookie Cloudflare détecté'"
echo "   - 'Public page detected - sending Cloudflare cookies: X' (X > 0 après le premier chargement)"
echo ""

