#!/bin/bash

# Script pour envoyer le projet sur GitHub
# Exécutez ce script depuis le terminal : bash push-to-github.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Préparation pour GitHub..."

# Aller dans le dossier du projet
cd "$(dirname "$0")"

# Vérifier si Git est déjà initialisé
if [ ! -d .git ]; then
    echo "📦 Initialisation de Git..."
    git init
else
    echo "✅ Git déjà initialisé"
fi

# Configurer Git si pas déjà fait (optionnel - sera demandé si nécessaire)
if [ -z "$(git config user.name)" ]; then
    echo "⚠️  Git user.name n'est pas configuré"
    echo "   Exécutez : git config --global user.name 'Votre Nom'"
    echo "   Et : git config --global user.email 'votre@email.com'"
fi

# Ajouter tous les fichiers
echo "📝 Ajout des fichiers..."
git add .

# Vérifier ce qui sera commité
echo ""
echo "📋 Fichiers à commiter :"
git status --short

# Faire le commit
echo ""
echo "💾 Création du commit..."
git commit -m "Initial commit: Application SaaS de gestion d'entreprise

- Module Core avec authentification Supabase
- Interface utilisateur avec design moderne et animations
- Documentation complète
- Configuration pour déploiement sur Vercel"

# Renommer la branche en main
git branch -M main 2>/dev/null || echo "Branche déjà 'main'"

echo ""
echo "✅ Commit créé avec succès !"
echo ""
echo "📤 Pour envoyer sur GitHub :"
echo ""
echo "1. Créez un nouveau dépôt sur https://github.com"
echo "2. Ensuite, exécutez ces commandes :"
echo ""
echo "   git remote add origin https://github.com/VOTRE_USERNAME/REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "   (Remplacez VOTRE_USERNAME et REPO_NAME par vos valeurs)"
echo ""

