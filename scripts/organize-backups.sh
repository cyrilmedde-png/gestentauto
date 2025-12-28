#!/bin/bash

# Script pour organiser les dossiers backup en les déplaçant dans un dossier dédié

set -e

echo "📦 Organisation des dossiers backup..."
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Chemin vers le dossier platform
PLATFORM_DIR="app/platform"
BACKUP_DIR="${PLATFORM_DIR}/.backups"

# Créer le dossier backup s'il n'existe pas
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📁 Création du dossier backup: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    echo "✅ Dossier créé"
else
    echo "✅ Dossier backup existe déjà: $BACKUP_DIR"
fi
echo ""

# Trouver tous les dossiers/fichiers avec .backup.* dans app/platform/
echo "🔍 Recherche des fichiers/dossiers backup..."
BACKUP_ITEMS=$(find "$PLATFORM_DIR" -maxdepth 1 -name "*.backup.*" -o -name "*backup.*" 2>/dev/null | grep -v "^${BACKUP_DIR}/" || true)

if [ -z "$BACKUP_ITEMS" ]; then
    echo "ℹ️  Aucun fichier/dossier backup trouvé"
    echo ""
    exit 0
fi

# Afficher ce qui sera déplacé
echo "📋 Fichiers/dossiers backup trouvés:"
echo "$BACKUP_ITEMS" | while read -r item; do
    if [ -n "$item" ]; then
        basename "$item"
    fi
done
echo ""

# Déplacer chaque item
MOVED_COUNT=0
echo "$BACKUP_ITEMS" | while read -r item; do
    if [ -n "$item" ] && [ "$item" != "$BACKUP_DIR" ]; then
        ITEM_NAME=$(basename "$item")
        TARGET="${BACKUP_DIR}/${ITEM_NAME}"
        
        # Si le target existe déjà, ajouter un timestamp
        if [ -e "$TARGET" ]; then
            TIMESTAMP=$(date +%Y%m%d_%H%M%S)
            TARGET="${BACKUP_DIR}/${ITEM_NAME}.${TIMESTAMP}"
        fi
        
        echo "📦 Déplacement: $ITEM_NAME -> .backups/"
        mv "$item" "$TARGET"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
done

echo ""
echo "✅ Organisation terminée!"
echo "📁 Dossiers backup déplacés dans: $BACKUP_DIR"
echo ""

# Lister le contenu du dossier backup
if [ -d "$BACKUP_DIR" ]; then
    echo "📋 Contenu du dossier backup:"
    ls -lah "$BACKUP_DIR" | tail -n +2
    echo ""
fi

# Vérifier qu'il ne reste plus de backup dans app/platform/
REMAINING=$(find "$PLATFORM_DIR" -maxdepth 1 -name "*.backup.*" -o -name "*backup.*" 2>/dev/null | grep -v "^${BACKUP_DIR}/" || true)
if [ -z "$REMAINING" ]; then
    echo "✅ Aucun backup restant dans app/platform/"
else
    echo "⚠️  Il reste des backups non déplacés:"
    echo "$REMAINING"
fi
echo ""

echo "💡 Pour éviter que Next.js traite les backups comme des routes, ajoutez ceci à .gitignore:"
echo "   app/platform/.backups/"
echo ""

