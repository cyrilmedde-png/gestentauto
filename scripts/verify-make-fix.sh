#!/bin/bash

# Script de vérification complète que la correction de /platform/make est réussie
# Vérifie les backups, les erreurs, et que tout fonctionne

set -e

echo "🔍 Vérification complète de la correction /platform/make"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

ERRORS=0
WARNINGS=0

# 1. Vérifier que la page Make existe
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  VÉRIFICATION DE LA PAGE MAKE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "app/platform/make/page.tsx" ]; then
    echo "✅ app/platform/make/page.tsx existe"
    
    # Vérifier que c'est un client component
    if grep -q "'use client'" app/platform/make/page.tsx; then
        echo "✅ Page est un client component ('use client')"
    else
        echo "❌ Page n'est pas un client component"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Vérifier qu'elle exporte MakePage
    if grep -q "export default function MakePage" app/platform/make/page.tsx; then
        echo "✅ Page exporte MakePage par défaut"
    else
        echo "❌ Page n'exporte pas MakePage par défaut"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Vérifier qu'elle utilise ProtectedRoute (comme n8n)
    if grep -q "ProtectedRoute" app/platform/make/page.tsx; then
        echo "✅ Page utilise ProtectedRoute (comme n8n)"
    else
        echo "⚠️  Page n'utilise pas ProtectedRoute"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ app/platform/make/page.tsx n'existe pas!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Vérifier qu'il n'y a pas de fichiers orphelins
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  VÉRIFICATION DES FICHIERS ORPHELINS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ORPHAN_FOUND=0

if [ -f "app/platform/make/layout.tsx" ]; then
    echo "❌ Fichier orphelin trouvé: app/platform/make/layout.tsx"
    ORPHAN_FOUND=1
    ERRORS=$((ERRORS + 1))
fi

if [ -f "app/platform/make/make-page-client.tsx" ]; then
    echo "❌ Fichier orphelin trouvé: app/platform/make/make-page-client.tsx"
    ORPHAN_FOUND=1
    ERRORS=$((ERRORS + 1))
fi

if [ $ORPHAN_FOUND -eq 0 ]; then
    echo "✅ Aucun fichier orphelin trouvé"
fi
echo ""

# 3. Vérifier les backups
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  VÉRIFICATION DES BACKUPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

BACKUP_DIR="app/platform/.backups"

# Vérifier que le dossier .backups existe
if [ -d "$BACKUP_DIR" ]; then
    echo "✅ Dossier .backups existe: $BACKUP_DIR"
    
    # Compter les backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 | wc -l)
    if [ "$BACKUP_COUNT" -gt 0 ]; then
        echo "✅ $BACKUP_COUNT backup(s) trouvé(s) dans .backups/"
        echo "📋 Liste des backups:"
        ls -lah "$BACKUP_DIR" | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
    else
        echo "ℹ️  Dossier .backups vide (pas de backups à déplacer)"
    fi
else
    echo "⚠️  Dossier .backups n'existe pas (sera créé par le script organize-backups.sh)"
    WARNINGS=$((WARNINGS + 1))
fi

# Vérifier qu'il n'y a PAS de backups dans app/platform/ (hors .backups)
echo ""
echo "🔍 Recherche de backups restants dans app/platform/..."
REMAINING_BACKUPS=$(find "app/platform" -maxdepth 1 -name "*.backup.*" -o -name "*backup.*" 2>/dev/null | grep -v "^${BACKUP_DIR}/" | grep -v "^app/platform$" || true)

if [ -z "$REMAINING_BACKUPS" ]; then
    echo "✅ Aucun backup restant dans app/platform/ (hors .backups/)"
else
    echo "❌ Backups restants trouvés dans app/platform/:"
    echo "$REMAINING_BACKUPS" | while read -r backup; do
        echo "   - $backup"
    done
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Vérifier que .backups est dans .gitignore
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  VÉRIFICATION DE .gitignore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if grep -q "app/platform/.backups/" .gitignore 2>/dev/null; then
    echo "✅ .backups/ est dans .gitignore"
else
    echo "⚠️  .backups/ n'est pas dans .gitignore"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 5. Vérifier que le build Next.js existe
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  VÉRIFICATION DU BUILD NEXT.JS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d ".next" ]; then
    echo "✅ Dossier .next existe"
    
    # Vérifier que la route est générée
    if [ -f ".next/server/app/platform/make/page.js" ]; then
        echo "✅ Route build générée: .next/server/app/platform/make/page.js"
        FILE_SIZE=$(ls -lh .next/server/app/platform/make/page.js | awk '{print $5}')
        echo "   Taille: $FILE_SIZE"
    else
        echo "❌ Route build non générée: .next/server/app/platform/make/page.js n'existe pas"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Vérifier qu'il n'y a pas de dossier Pages Router
    if [ -d ".next/server/pages" ]; then
        echo "⚠️  Dossier .next/server/pages existe (Pages Router - peut causer des conflits)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ Pas de Pages Router (normal pour App Router)"
    fi
else
    echo "⚠️  Dossier .next n'existe pas (build pas encore effectué)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Vérifier que PM2 fonctionne
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  VÉRIFICATION DE PM2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v pm2 >/dev/null 2>&1; then
    echo "✅ PM2 est installé"
    
    if pm2 list | grep -q "talosprime.*online"; then
        echo "✅ Application talosprime est en ligne"
        
        # Tester la route localement
        echo ""
        echo "🧪 Test de la route /platform/make sur localhost..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ Route /platform/make répond 200 OK"
        elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
            echo "✅ Route /platform/make répond $HTTP_CODE (redirection - normal pour authentification)"
        elif [ "$HTTP_CODE" = "404" ]; then
            echo "❌ Route /platform/make retourne 404 Not Found!"
            ERRORS=$((ERRORS + 1))
        else
            echo "⚠️  Route /platform/make retourne $HTTP_CODE (code inattendu)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo "⚠️  Application talosprime n'est pas en ligne"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "⚠️  PM2 n'est pas installé"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Vérifier les erreurs dans les logs PM2 (optionnel, si PM2 est en ligne)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  VÉRIFICATION DES ERREURS DANS LES LOGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "talosprime.*online"; then
    echo "🔍 Analyse des 50 dernières lignes des logs d'erreur..."
    
    # Vérifier l'erreur InvariantError
    if pm2 logs talosprime --lines 50 --nostream 2>/dev/null | grep -q "InvariantError.*client reference manifest.*platform/make"; then
        echo "❌ Erreur InvariantError détectée pour /platform/make"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ Aucune erreur InvariantError détectée pour /platform/make"
    fi
    
    # Vérifier l'erreur Server Action
    if pm2 logs talosprime --lines 50 --nostream 2>/dev/null | grep -q "Failed to find Server Action"; then
        echo "⚠️  Erreur 'Failed to find Server Action' détectée (peut être normale)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ Aucune erreur 'Failed to find Server Action' détectée"
    fi
    
    # Vérifier le typo eul.make.com
    if pm2 logs talosprime --lines 50 --nostream 2>/dev/null | grep -q "eul\.make\.com\|eul.make.com"; then
        echo "⚠️  Typo 'eul.make.com' détectée dans les logs (devrait être eu1.make.com)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ Aucun typo 'eul.make.com' détecté"
    fi
else
    echo "ℹ️  PM2 n'est pas en ligne, vérification des logs ignorée"
fi
echo ""

# 8. Vérifier la structure du dossier make
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  VÉRIFICATION DE LA STRUCTURE DU DOSSIER MAKE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "app/platform/make" ]; then
    echo "✅ Dossier app/platform/make existe"
    echo "📋 Contenu du dossier:"
    ls -lah app/platform/make/ | tail -n +2 | awk '{print "   - " $9 " (" $5 ")"}'
    
    # Compter les fichiers
    FILE_COUNT=$(find app/platform/make -maxdepth 1 -type f | wc -l)
    if [ "$FILE_COUNT" -eq 1 ]; then
        echo "✅ Structure correcte (1 fichier: page.tsx)"
    else
        echo "⚠️  Structure inattendue ($FILE_COUNT fichier(s) au lieu de 1)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo "❌ Dossier app/platform/make n'existe pas!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Résumé final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ ✅ ✅ TOUT EST PARFAIT ! ✅ ✅ ✅"
    echo ""
    echo "Toutes les vérifications sont passées avec succès."
    echo "La route /platform/make devrait fonctionner correctement."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "✅ Vérifications principales: OK"
    echo "⚠️  $WARNINGS avertissement(s) détecté(s) (non bloquants)"
    echo ""
    echo "La route devrait fonctionner, mais vérifiez les avertissements ci-dessus."
    exit 0
else
    echo "❌ ERREURS DÉTECTÉES: $ERRORS"
    if [ $WARNINGS -gt 0 ]; then
        echo "⚠️  Avertissements: $WARNINGS"
    fi
    echo ""
    echo "Des problèmes ont été détectés. Veuillez les corriger avant de continuer."
    exit 1
fi

