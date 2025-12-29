#!/bin/bash

# Script de diagnostic pour vérifier les rechargements

echo "🔍 DIAGNOSTIC : Vérification des rechargements"
echo ""

echo "1️⃣ Vérification de la configuration Next.js..."
if grep -q "reactStrictMode: true" next.config.js; then
    echo "   ✅ reactStrictMode: true (normal)"
else
    echo "   ⚠️  reactStrictMode modifié"
fi
echo ""

echo "2️⃣ Vérification des fichiers modifiés récemment..."
git log --oneline --all -5 --name-only | head -20
echo ""

echo "3️⃣ Vérification du cache Next.js..."
if [ -d ".next" ]; then
    echo "   ✅ Dossier .next existe"
    echo "   💡 Pour vider le cache: rm -rf .next"
else
    echo "   ⚠️  Dossier .next n'existe pas"
fi
echo ""

echo "4️⃣ Instructions pour vérifier dans le navigateur:"
echo "   1. Ouvrez la console (F12)"
echo "   2. Allez dans l'onglet Network"
echo "   3. Changez d'onglet et revenez"
echo "   4. Vérifiez s'il y a de nouvelles requêtes réseau"
echo "   5. Si oui, c'est un vrai rechargement"
echo "   6. Si non, c'est juste un re-render React (normal)"
echo ""

echo "5️⃣ Pour vider le cache du navigateur:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)"
echo "   - Firefox: Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)"
echo "   - Safari: Cmd+Option+E"
echo ""

echo "✅ Diagnostic terminé"
echo ""




