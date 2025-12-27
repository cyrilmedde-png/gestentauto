#!/bin/bash

# Script simple pour corriger manuellement la typo eul -> eu1
# À utiliser si fix-make-url-typo.sh ne fonctionne pas

set -e

echo "🔧 Correction manuelle de l'URL Make.com dans .env.production..."

if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production introuvable"
    exit 1
fi

# Sauvegarde
BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
cp .env.production "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"

# Afficher les URLs actuelles
echo ""
echo "📋 URLs Make.com AVANT correction:"
grep -E "MAKE_URL|NEXT_PUBLIC_MAKE_URL" .env.production || echo "  (aucune URL Make trouvée)"

# Correction avec sed (méthode la plus simple)
echo ""
echo "🔧 Correction en cours..."
sed -i 's/eul\.make\.com/eu1.make.com/g' .env.production
sed -i 's/eul/eu1/g' .env.production  # Correction générale si besoin

# Afficher les URLs après correction
echo ""
echo "📋 URLs Make.com APRÈS correction:"
grep -E "MAKE_URL|NEXT_PUBLIC_MAKE_URL" .env.production || echo "  (aucune URL Make trouvée)"

echo ""
echo "✅ Correction terminée!"
echo "💡 Exécutez maintenant: rm -rf .next && npm run build && pm2 restart talosprime --update-env"

