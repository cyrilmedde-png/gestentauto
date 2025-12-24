#!/bin/bash
# Script pour corriger la configuration Nginx pour talosprimes.com
# Ajoute talosprimes.com (sans www) au server_name du Bloc #2
# Usage: ./scripts/fix-nginx-talosprimes-com.sh

echo "🔧 Correction de la configuration Nginx pour talosprimes.com"
echo "============================================================"
echo ""

# Trouver le fichier de configuration Nginx pour talosprimes.com
NGINX_CONFIG=""
if [ -f "/etc/nginx/sites-available/talosprime" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprime"
elif [ -f "/etc/nginx/sites-available/talosprimes" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/talosprimes"
elif [ -f "/etc/nginx/sites-available/www.talosprimes.com" ]; then
    NGINX_CONFIG="/etc/nginx/sites-available/www.talosprimes.com"
else
    echo "❌ Erreur: Impossible de trouver le fichier de configuration Nginx"
    echo "   Fichiers cherchés:"
    echo "   - /etc/nginx/sites-available/talosprime"
    echo "   - /etc/nginx/sites-available/talosprimes"
    echo "   - /etc/nginx/sites-available/www.talosprimes.com"
    echo ""
    echo "📋 Fichiers disponibles dans /etc/nginx/sites-available:"
    ls -la /etc/nginx/sites-available/ | grep -v "^d" | awk '{print "   " $9}'
    exit 1
fi

echo "✅ Fichier de configuration trouvé: $NGINX_CONFIG"
echo ""

# Vérifier si talosprimes.com (sans www) est déjà dans le server_name
if grep -q "server_name.*talosprimes\.com.*www\.talosprimes\.com\|server_name.*www\.talosprimes\.com.*talosprimes\.com" "$NGINX_CONFIG"; then
    echo "✅ talosprimes.com (sans www) est déjà dans le server_name"
    echo ""
    echo "📋 Configuration actuelle:"
    grep "server_name" "$NGINX_CONFIG" | head -5
    echo ""
    echo "💡 Si le problème persiste, vérifiez l'ordre des blocs server"
    exit 0
fi

# Créer une sauvegarde
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"
echo ""

# Trouver la ligne server_name pour www.talosprimes.com
if grep -q "server_name.*www\.talosprimes\.com" "$NGINX_CONFIG"; then
    echo "📝 Modification de la configuration..."
    
    # Remplacer server_name www.talosprimes.com par server_name talosprimes.com www.talosprimes.com
    sed -i 's/server_name[[:space:]]*www\.talosprimes\.com;/server_name talosprimes.com www.talosprimes.com;/g' "$NGINX_CONFIG"
    
    # Vérifier si la modification a réussi
    if grep -q "server_name.*talosprimes\.com.*www\.talosprimes\.com\|server_name.*www\.talosprimes\.com.*talosprimes\.com" "$NGINX_CONFIG"; then
        echo "✅ Configuration modifiée avec succès"
        echo ""
        echo "📋 Nouvelle configuration:"
        grep "server_name" "$NGINX_CONFIG" | grep "talosprimes.com" | head -5
        echo ""
    else
        echo "❌ Erreur: La modification n'a pas fonctionné"
        echo "   Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        exit 1
    fi
else
    echo "⚠️  Aucune ligne server_name avec www.talosprimes.com trouvée"
    echo "   Tentative de modification manuelle..."
    
    # Chercher le bloc server qui écoute sur 443 et a un proxy_pass
    # Ajouter talosprimes.com au server_name de ce bloc
    awk '
    /listen 443/ {
        in_block=1
        print
        next
    }
    /server_name.*www\.talosprimes\.com/ && in_block {
        # Ajouter talosprimes.com avant www.talosprimes.com
        gsub(/server_name[[:space:]]*www\.talosprimes\.com/, "server_name talosprimes.com www.talosprimes.com")
        print
        in_block=0
        next
    }
    /^}/ && in_block {
        in_block=0
        print
        next
    }
    {
        print
    }
    ' "$NGINX_CONFIG" > "${NGINX_CONFIG}.tmp" && mv "${NGINX_CONFIG}.tmp" "$NGINX_CONFIG"
    
    if grep -q "server_name.*talosprimes\.com.*www\.talosprimes\.com\|server_name.*www\.talosprimes\.com.*talosprimes\.com" "$NGINX_CONFIG"; then
        echo "✅ Configuration modifiée avec succès (méthode alternative)"
        echo ""
        echo "📋 Nouvelle configuration:"
        grep "server_name" "$NGINX_CONFIG" | grep "talosprimes.com" | head -5
        echo ""
    else
        echo "❌ Erreur: Impossible de modifier automatiquement"
        echo "   Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        echo ""
        echo "💡 Modification manuelle requise:"
        echo "   1. Éditez $NGINX_CONFIG"
        echo "   2. Trouvez la ligne: server_name www.talosprimes.com;"
        echo "   3. Remplacez par: server_name talosprimes.com www.talosprimes.com;"
        exit 1
    fi
fi

# Tester la configuration Nginx
echo "🧪 Test de la configuration Nginx..."
if nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo "✅ Configuration Nginx valide"
    echo ""
    
    # Recharger Nginx
    echo "🔄 Rechargement de Nginx..."
    if systemctl reload nginx; then
        echo "✅ Nginx rechargé avec succès"
        echo ""
        echo "📋 Vérification finale:"
        echo "   Test avec curl pour talosprimes.com (sans www):"
        RESPONSE=$(curl -s -k -H "Host: talosprimes.com" -H "X-Forwarded-Proto: https" https://localhost/ 2>&1 | head -5)
        if echo "$RESPONSE" | grep -q "Welcome to nginx"; then
            echo "   ❌ Retourne toujours 'Welcome to nginx!'"
            echo "   💡 Attendez quelques secondes et réessayez, ou vérifiez l'ordre des blocs server"
        else
            echo "   ✅ Retourne du Next.js (correction réussie)"
        fi
    else
        echo "❌ Erreur lors du rechargement de Nginx"
        echo "   Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        systemctl reload nginx
        exit 1
    fi
else
    echo "❌ Erreur de syntaxe dans la configuration Nginx"
    echo "   Restauration de la sauvegarde..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    nginx -t
    exit 1
fi

echo ""
echo "============================================================"
echo "✅ Correction terminée"
echo ""
echo "💡 Si le problème persiste, vérifiez:"
echo "   1. Que vous accédez via https://www.talosprimes.com"
echo "   2. L'ordre des blocs server dans Nginx"
echo "   3. Qu'il n'y a pas de cache DNS ou navigateur"
echo ""

