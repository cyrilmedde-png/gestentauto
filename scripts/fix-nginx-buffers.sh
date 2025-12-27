#!/bin/bash

# ============================================
# Script pour corriger les buffers nginx
# Résout l'erreur "upstream sent too big header"
# ============================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
NGINX_ENABLED="/etc/nginx/sites-enabled/talosprime"

echo "🔧 Correction des buffers nginx pour résoudre les erreurs de headers trop grands"
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

# Vérifier si les directives existent déjà
if grep -q "proxy_buffer_size" "$NGINX_CONFIG"; then
    echo "⚠️  Les directives de buffer existent déjà. Mise à jour..."
    # Supprimer les anciennes directives
    sed -i '/proxy_buffer_size/d' "$NGINX_CONFIG"
    sed -i '/proxy_buffers/d' "$NGINX_CONFIG"
    sed -i '/proxy_busy_buffers_size/d' "$NGINX_CONFIG"
    sed -i '/large_client_header_buffers/d' "$NGINX_CONFIG"
fi

# Trouver le bloc location qui proxy vers Next.js
# Chercher le bloc location / ou location ~ ^/(api|platform|_next)
if grep -q "location.*proxy_pass.*127.0.0.1:3000" "$NGINX_CONFIG" || grep -q "location /" "$NGINX_CONFIG"; then
    echo "✅ Bloc location trouvé"
    
    # Ajouter les directives après le proxy_pass ou dans le bloc server
    # Chercher le bloc server pour talosprimes.com
    if grep -q "server_name.*talosprimes.com" "$NGINX_CONFIG"; then
        echo "✅ Bloc server pour talosprimes.com trouvé"
        
        # Ajouter les directives dans le bloc server, juste après l'ouverture ou avant la fermeture
        # Chercher où insérer (après les directives proxy existantes ou dans le bloc location)
        
        # Méthode 1: Ajouter dans le bloc location qui contient proxy_pass
        if grep -A 20 "location" "$NGINX_CONFIG" | grep -q "proxy_pass.*3000"; then
            # Trouver la ligne proxy_pass et ajouter après
            LINE_NUM=$(grep -n "proxy_pass.*3000" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
            if [ -n "$LINE_NUM" ]; then
                # Insérer après proxy_pass
                sed -i "${LINE_NUM}a\\
    # Augmenter les buffers pour les headers (résout 'upstream sent too big header')\\
    proxy_buffer_size 16k;\\
    proxy_buffers 8 16k;\\
    proxy_busy_buffers_size 32k;\\
    large_client_header_buffers 4 32k;
" "$NGINX_CONFIG"
                echo "✅ Directives ajoutées après proxy_pass"
            fi
        else
            # Méthode 2: Ajouter dans le bloc server, avant la fermeture
            # Trouver la dernière ligne avant }
            SERVER_END=$(grep -n "^}" "$NGINX_CONFIG" | tail -1 | cut -d: -f1)
            if [ -n "$SERVER_END" ]; then
                # Insérer avant la fermeture du bloc server
                sed -i "$((SERVER_END-1))a\\
    # Augmenter les buffers pour les headers (résout 'upstream sent too big header')\\
    proxy_buffer_size 16k;\\
    proxy_buffers 8 16k;\\
    proxy_busy_buffers_size 32k;\\
    large_client_header_buffers 4 32k;
" "$NGINX_CONFIG"
                echo "✅ Directives ajoutées dans le bloc server"
            fi
        fi
    else
        echo "⚠️  Bloc server pour talosprimes.com non trouvé, ajout dans le premier bloc server"
        # Ajouter dans le premier bloc server
        SERVER_START=$(grep -n "^server {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
        if [ -n "$SERVER_START" ]; then
            sed -i "$((SERVER_START+5))a\\
    # Augmenter les buffers pour les headers (résout 'upstream sent too big header')\\
    proxy_buffer_size 16k;\\
    proxy_buffers 8 16k;\\
    proxy_busy_buffers_size 32k;\\
    large_client_header_buffers 4 32k;
" "$NGINX_CONFIG"
            echo "✅ Directives ajoutées dans le bloc server"
        fi
    fi
else
    echo "⚠️  Aucun bloc location avec proxy_pass trouvé, ajout dans le bloc server"
    # Ajouter dans le bloc server
    SERVER_START=$(grep -n "^server {" "$NGINX_CONFIG" | head -1 | cut -d: -f1)
    if [ -n "$SERVER_START" ]; then
        sed -i "$((SERVER_START+5))a\\
    # Augmenter les buffers pour les headers (résout 'upstream sent too big header')\\
    proxy_buffer_size 16k;\\
    proxy_buffers 8 16k;\\
    proxy_busy_buffers_size 32k;\\
    large_client_header_buffers 4 32k;
" "$NGINX_CONFIG"
        echo "✅ Directives ajoutées dans le bloc server"
    fi
fi

# Vérifier la syntaxe nginx
echo ""
echo "🔍 Vérification de la syntaxe nginx..."
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Syntaxe nginx valide"
    
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
    echo "Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

echo ""
echo "✅ Configuration nginx mise à jour avec succès!"
echo "📝 Sauvegarde: $BACKUP_FILE"

