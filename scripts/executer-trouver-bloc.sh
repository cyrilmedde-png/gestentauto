#!/bin/bash
# Script pour exécuter trouver-bloc-talosprimes.sh sur le serveur
# Usage: ./scripts/executer-trouver-bloc.sh

echo "🔍 Exécution du diagnostic des blocs Nginx"
echo "=========================================="
echo ""

cd /var/www/talosprime || {
    echo "❌ Erreur: Impossible d'accéder à /var/www/talosprime"
    exit 1
}

echo "1️⃣  Mise à jour depuis GitHub..."
echo "--------------------------------"
git pull origin main || {
    echo "⚠️  Erreur lors du git pull, continuation quand même..."
}
echo ""

echo "2️⃣  Exécution du script de diagnostic..."
echo "----------------------------------------"
if [ -f "./scripts/trouver-bloc-talosprimes.sh" ]; then
    chmod +x ./scripts/trouver-bloc-talosprimes.sh
    ./scripts/trouver-bloc-talosprimes.sh
else
    echo "❌ Erreur: Script trouver-bloc-talosprimes.sh non trouvé"
    echo "   Vérifiez que git pull a bien fonctionné"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Diagnostic terminé"








