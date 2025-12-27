#!/bin/bash

# Script de nettoyage complet du build Next.js
# À exécuter quand on a des erreurs de build corrompu
# Résout les erreurs: "client reference manifest does not exist", "Failed to find Server Action", etc.

set -e

echo "🧹 Nettoyage complet du build Next.js..."
echo ""

# Arrêter PM2 si l'application tourne
if pm2 list | grep -q "talosprime.*online\|talosprime.*stopped"; then
    echo "⏸️  Arrêt de PM2..."
    pm2 stop talosprime || true
fi

# Supprimer tous les caches Next.js
echo "🗑️  Suppression des caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf node_modules/.next
rm -rf .next/cache 2>/dev/null || true

echo "✅ Caches supprimés"
echo ""

# Rebuild complet
echo "🔨 Rebuild de l'application..."
npm run build

echo ""
echo "✅ Build terminé avec succès!"
echo ""
echo "💡 Pour redémarrer PM2, exécutez:"
echo "   pm2 restart talosprime --update-env"
echo ""
echo "📝 Pour vérifier les logs:"
echo "   pm2 logs talosprime --lines 50"

