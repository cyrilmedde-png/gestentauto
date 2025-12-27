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

# Corriger la typo eul -> eu1 (corriger directement sans chercher)
echo "🔍 Recherche et correction de la typo 'eul' dans .env.production..."

# Chercher la typo
if grep -iE "eul.*make|make.*eul" .env.production > /dev/null 2>&1; then
    echo "🔍 Typo trouvée, correction en cours..."
    # Utiliser perl pour corriger toutes les occurrences
    perl -i -pe 's/eul\.make\.com/eu1.make.com/gi' .env.production
    perl -i -pe 's/(https?:\/\/)eul\.make\.com/$1eu1.make.com/gi' .env.production
    echo "✅ Typo corrigée (eul -> eu1)"
else
    echo "ℹ️  Aucune typo 'eul' trouvée dans les URLs Make.com"
fi

# Correction forcée pour être sûr (corriger même si pas trouvé, c'est idempotent)
echo "🔧 Correction forcée pour être sûr..."
perl -i -pe 's/eul\.make\.com/eu1.make.com/gi' .env.production
perl -i -pe 's/(NEXT_PUBLIC_MAKE_URL|MAKE_URL)=.*eul\.make\.com/$1=https:\/\/eu1.make.com\/organization\/5837397\/dashboard/gi' .env.production || true

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

