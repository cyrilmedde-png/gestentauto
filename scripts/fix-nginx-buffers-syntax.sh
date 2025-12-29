#!/bin/bash

# Script pour corriger la syntaxe Nginx
# large_client_header_buffers doit être dans http {}, pas dans server {}

set -e

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
NGINX_MAIN_CONFIG="/etc/nginx/nginx.conf"

echo "🔧 Correction de la syntaxe Nginx pour large_client_header_buffers"
echo ""

# Vérifier que les fichiers existent
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Erreur: Fichier $NGINX_CONFIG non trouvé"
    exit 1
fi

if [ ! -f "$NGINX_MAIN_CONFIG" ]; then
    echo "❌ Erreur: Fichier $NGINX_MAIN_CONFIG non trouvé"
    exit 1
fi

# Créer des sauvegardes
BACKUP_SITES="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
BACKUP_MAIN="${NGINX_MAIN_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_SITES"
cp "$NGINX_MAIN_CONFIG" "$BACKUP_MAIN"
echo "✅ Sauvegardes créées:"
echo "   - $BACKUP_SITES"
echo "   - $BACKUP_MAIN"
echo ""

# 1. Supprimer large_client_header_buffers du fichier sites-available/talosprime
echo "🔍 Recherche de 'large_client_header_buffers' dans $NGINX_CONFIG..."
if grep -q "large_client_header_buffers" "$NGINX_CONFIG"; then
    echo "⚠️  'large_client_header_buffers' trouvé dans le bloc server (incorrect)"
    echo "   Suppression de cette directive..."
    
    # Supprimer la ligne (et les lignes de commentaires associées si présentes)
    sed -i '/large_client_header_buffers/d' "$NGINX_CONFIG"
    
    # Supprimer aussi les lignes vides supplémentaires
    sed -i '/^[[:space:]]*$/N;/^\n$/d' "$NGINX_CONFIG"
    
    echo "✅ Directive supprimée du fichier sites-available"
else
    echo "✅ 'large_client_header_buffers' non trouvé dans le fichier sites-available (déjà corrigé ou absent)"
fi
echo ""

# 2. Vérifier si large_client_header_buffers est déjà dans nginx.conf (bloc http)
echo "🔍 Vérification de 'large_client_header_buffers' dans $NGINX_MAIN_CONFIG (bloc http)..."
if grep -q "large_client_header_buffers" "$NGINX_MAIN_CONFIG"; then
    echo "✅ 'large_client_header_buffers' existe déjà dans nginx.conf"
    grep "large_client_header_buffers" "$NGINX_MAIN_CONFIG"
else
    echo "⚠️  'large_client_header_buffers' non trouvé dans nginx.conf"
    echo "   Ajout dans le bloc http..."
    
    # Trouver le bloc http et ajouter la directive après les autres directives similaires
    # Chercher un pattern comme proxy_buffer_size ou client_max_body_size pour trouver le bon endroit
    if grep -q "client_max_body_size\|proxy_buffer_size" "$NGINX_MAIN_CONFIG"; then
        # Ajouter après une directive existante
        sed -i '/client_max_body_size\|proxy_buffer_size/a\    large_client_header_buffers 4 32k;' "$NGINX_MAIN_CONFIG"
        echo "✅ Directive ajoutée après les autres directives similaires"
    else
        # Ajouter après la ligne http { (première ligne du bloc http)
        sed -i '/^http {/a\    large_client_header_buffers 4 32k;' "$NGINX_MAIN_CONFIG"
        echo "✅ Directive ajoutée au début du bloc http"
    fi
fi
echo ""

# 3. Garder proxy_buffer_size, proxy_buffers, proxy_busy_buffers_size dans le bloc server (c'est correct)
echo "✅ Les directives proxy_buffer_size, proxy_buffers, proxy_busy_buffers_size"
echo "   peuvent rester dans le bloc server (c'est correct)"
echo ""

# 4. Vérifier la syntaxe
echo "🔍 Vérification de la syntaxe Nginx..."
NGINX_TEST_OUTPUT=$(nginx -t 2>&1)
NGINX_EXIT_CODE=$?

if [ $NGINX_EXIT_CODE -eq 0 ]; then
    echo "✅ Syntaxe Nginx valide!"
    
    # Afficher les warnings s'il y en a
    if echo "$NGINX_TEST_OUTPUT" | grep -q "warn"; then
        echo "⚠️  Warnings détectés (non bloquants):"
        echo "$NGINX_TEST_OUTPUT" | grep "warn" | head -5
    fi
    
    echo ""
    echo "🔄 Rechargement de Nginx..."
    if systemctl reload nginx; then
        echo "✅ Nginx rechargé avec succès!"
    else
        echo "❌ Erreur lors du rechargement de Nginx"
        echo "Restauration des sauvegardes..."
        cp "$BACKUP_SITES" "$NGINX_CONFIG"
        cp "$BACKUP_MAIN" "$NGINX_MAIN_CONFIG"
        exit 1
    fi
else
    echo "❌ Erreur de syntaxe Nginx!"
    echo "Sortie complète:"
    echo "$NGINX_TEST_OUTPUT"
    echo ""
    echo "Restauration des sauvegardes..."
    cp "$BACKUP_SITES" "$NGINX_CONFIG"
    cp "$BACKUP_MAIN" "$NGINX_MAIN_CONFIG"
    exit 1
fi

echo ""
echo "✅ Correction terminée!"
echo ""
echo "📋 Résumé des changements:"
echo "   - 'large_client_header_buffers' supprimé du bloc server"
echo "   - 'large_client_header_buffers' ajouté au bloc http dans nginx.conf"
echo "   - Nginx rechargé avec succès"
echo ""
echo "💡 Pour vérifier la configuration:"
echo "   nginx -t"
echo "   systemctl status nginx"
echo ""


