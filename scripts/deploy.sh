#!/bin/bash

# Script de déploiement automatique
# Usage: ./deploy.sh ou bash deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement..."

# Aller dans le répertoire du projet
cd /var/www/talosprime || {
    echo "❌ Erreur: Impossible d'accéder au répertoire /var/www/talosprime"
    exit 1
}

echo "📦 Récupération des dernières modifications depuis GitHub..."

# Forcer la résolution des conflits en réinitialisant les fichiers locaux
# Cette méthode est plus sûre pour un environnement de production
set +e  # Ne pas arrêter en cas d'erreur pour cette vérification
git diff --quiet && git diff --cached --quiet
HAS_CHANGES=$?
set -e  # Réactiver l'arrêt en cas d'erreur

if [ $HAS_CHANGES -ne 0 ]; then
    echo "⚠️  Modifications locales détectées, sauvegarde et réinitialisation..."
    git stash push -m "Auto-stash before deploy $(date +%Y-%m-%d_%H-%M-%S)" || true
    echo "🔄 Réinitialisation des fichiers locaux..."
    git reset --hard HEAD
    echo "✅ Fichiers locaux réinitialisés"
fi

# Récupérer les dernières modifications
echo "📥 Téléchargement des modifications..."
git fetch origin main || {
    echo "❌ Erreur lors du git fetch"
    exit 1
}

echo "🔄 Application des modifications..."
git reset --hard origin/main || {
    echo "❌ Erreur lors du git reset"
    exit 1
}

echo "✅ Dernières modifications récupérées avec succès"

    echo "📦 Installation des dépendances..."
    npm install || {
      echo "❌ Erreur lors de l'installation des dépendances"
      exit 1
    }

    echo "🔨 Construction de l'application..."
    npm run build || {
      echo "❌ Erreur lors du build"
      exit 1
    }

echo "🔄 Redémarrage de l'application PM2..."
pm2 restart talosprime || {
    echo "❌ Erreur lors du redémarrage PM2"
    exit 1
}

echo "✅ Déploiement terminé avec succès!"
echo "📊 Statut PM2:"
pm2 status
