#!/bin/bash

# Script pour corriger la typo dans l'URL Make.com (eul -> eu1)
# et forcer le rebuild

set -e

echo "🔧 Correction de l'URL Make.com dans .env.production..."

# Vérifier que le fichier existe
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production introuvable"
    exit 1
fi

# Sauvegarder le fichier
BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
cp .env.production "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"

# Corriger la typo eul -> eu1 (chercher avec et sans échappement)
echo "🔍 Recherche de la typo 'eul' dans .env.production..."
if grep -i "eul\.make\.com\|eul.make.com" .env.production > /dev/null 2>&1; then
    echo "🔍 Typo trouvée: eul.make.com -> eu1.make.com"
    # Utiliser perl pour une substitution plus robuste
    perl -i -pe 's/eul\.make\.com/eu1.make.com/gi' .env.production
    echo "✅ Typo corrigée"
elif grep -i "eul" .env.production | grep -i "make" > /dev/null 2>&1; then
    echo "🔍 Variante de typo trouvée (sans point): eul -> eu1"
    perl -i -pe 's/eul/eu1/gi if /make/i' .env.production
    echo "✅ Typo corrigée"
else
    echo "ℹ️  Aucune typo 'eul' trouvée (vérification manuelle recommandée)"
fi

# Afficher les URLs Make actuelles
echo ""
echo "📋 URLs Make.com dans .env.production:"
grep -E "MAKE_URL|NEXT_PUBLIC_MAKE_URL" .env.production || echo "  (aucune URL Make trouvée)"

# Nettoyer le cache et rebuilder
echo ""
echo "🧹 Nettoyage du cache..."
rm -rf .next
rm -rf node_modules/.cache

echo ""
echo "🔨 Rebuild de l'application..."
npm run build

echo ""
echo "🔄 Redémarrage de PM2..."
pm2 restart talosprime --update-env

echo ""
echo "✅ Correction terminée!"
echo "📝 Vérifiez les logs: pm2 logs talosprime --lines 50"

