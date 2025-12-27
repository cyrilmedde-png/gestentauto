#!/bin/bash

# ============================================
# Script pour vérifier et corriger le routage nginx pour /platform/*
# ============================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
NGINX_ENABLED="/etc/nginx/sites-enabled/talosprime"

echo "🔧 Vérification et correction du routage nginx pour /platform/*"
echo ""

# Vérifier que le fichier existe
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Erreur: Fichier $NGINX_CONFIG non trouvé"
    exit 1
fi

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Afficher la configuration actuelle
echo "📋 Configuration actuelle (extrait):"
echo "-----------------------------------"
grep -A 10 "location" "$NGINX_CONFIG" | head -30
echo ""

# Vérifier si toutes les routes sont proxifiées vers Next.js
if grep -q "proxy_pass.*127.0.0.1:3000\|proxy_pass.*localhost:3000" "$NGINX_CONFIG"; then
    echo "✅ proxy_pass vers Next.js trouvé"
    
    # Vérifier si c'est dans un bloc location / ou location ~
    if grep -A 5 "location /" "$NGINX_CONFIG" | grep -q "proxy_pass.*3000"; then
        echo "✅ Toutes les routes sont proxifiées via location /"
    else
        echo "⚠️  Configuration de proxy_pass non standard détectée"
    fi
else
    echo "❌ Aucun proxy_pass vers Next.js trouvé!"
    echo "La configuration nginx ne route pas vers Next.js"
    exit 1
fi

# Vérifier les directives de buffer
echo ""
echo "🔍 Vérification des directives de buffer..."
if grep -q "proxy_buffer_size\|large_client_header_buffers" "$NGINX_CONFIG"; then
    echo "✅ Directives de buffer trouvées"
    grep "proxy_buffer_size\|proxy_buffers\|proxy_busy_buffers_size\|large_client_header_buffers" "$NGINX_CONFIG" | head -5
else
    echo "⚠️  Directives de buffer non trouvées"
    echo "Ajout des directives de buffer..."
    
    # Trouver le bloc location avec proxy_pass
    PROXY_LINE=$(grep -n "proxy_pass.*3000" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    if [ -n "$PROXY_LINE" ]; then
        # Ajouter après proxy_pass
        sed -i "${PROXY_LINE}a\\
    # Augmenter les buffers pour les headers (résout 'upstream sent too big header')\\
    proxy_buffer_size 16k;\\
    proxy_buffers 8 16k;\\
    proxy_busy_buffers_size 32k;\\
    large_client_header_buffers 4 32k;
" "$NGINX_CONFIG"
        echo "✅ Directives de buffer ajoutées"
    else
        echo "❌ Impossible de trouver proxy_pass dans la configuration"
        exit 1
    fi
fi

# Vérifier la syntaxe nginx
echo ""
echo "🔍 Vérification de la syntaxe nginx..."
NGINX_TEST_OUTPUT=$(nginx -t 2>&1)
NGINX_EXIT_CODE=$?

if [ $NGINX_EXIT_CODE -eq 0 ] && (echo "$NGINX_TEST_OUTPUT" | grep -q "syntax is ok\|test is successful"); then
    echo "✅ Syntaxe nginx valide"
    # Afficher les warnings s'il y en a (mais ne pas les considérer comme des erreurs)
    if echo "$NGINX_TEST_OUTPUT" | grep -q "warn"; then
        echo "⚠️  Warnings détectés (non bloquants):"
        echo "$NGINX_TEST_OUTPUT" | grep "warn" | head -3
    fi
    
    # Recharger nginx
    echo ""
    echo "🔄 Rechargement de nginx..."
    if systemctl reload nginx; then
        echo "✅ Nginx rechargé avec succès"
    else
        echo "❌ Erreur lors du rechargement de nginx"
        echo "Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        exit 1
    fi
else
    echo "❌ Erreur de syntaxe nginx!"
    echo "Sortie complète:"
    echo "$NGINX_TEST_OUTPUT"
    echo ""
    echo "Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# Test de connectivité
echo ""
echo "🧪 Test de connectivité..."
echo "Test Next.js direct:"
if curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/platform/make | grep -q "200"; then
    echo "✅ Next.js répond correctement sur /platform/make"
else
    echo "⚠️  Next.js ne répond pas correctement (mais cela peut être normal si non authentifié)"
fi

echo ""
echo "✅ Configuration nginx vérifiée et corrigée!"
echo "📝 Sauvegarde: $BACKUP_FILE"
echo ""
echo "💡 Si la page /platform/make retourne toujours 404, vérifiez:"
echo "   1. Que nginx route bien toutes les requêtes vers Next.js (location /)"
echo "   2. Les logs nginx: tail -f /var/log/nginx/access.log"
echo "   3. Les logs nginx erreurs: tail -f /var/log/nginx/error.log"


