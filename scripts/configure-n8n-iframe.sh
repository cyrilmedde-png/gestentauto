#!/bin/bash
# Script pour configurer N8N pour autoriser l'iframe depuis www.talosprimes.com
# Usage: sudo bash scripts/configure-n8n-iframe.sh

echo "🔧 Configuration N8N pour autoriser l'iframe"
echo "============================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root pour certaines opérations"
fi

# 1. Configurer N8N via variables d'environnement PM2
echo "1️⃣ Configuration N8N via PM2..."
echo "--------------------------------"

if command -v pm2 &> /dev/null; then
    # Vérifier si N8N est dans PM2
    PM2_N8N=$(pm2 list 2>/dev/null | grep -i n8n | head -1)
    
    if [ -n "$PM2_N8N" ]; then
        echo "✅ N8N trouvé dans PM2"
        
        # Obtenir le chemin du script N8N
        N8N_SCRIPT=$(pm2 info n8n 2>/dev/null | grep "script path" | awk '{print $4}' || echo "")
        
        if [ -n "$N8N_SCRIPT" ]; then
            echo "   📍 Script: $N8N_SCRIPT"
            
            # Vérifier si le script contient déjà N8N_CORS_ORIGIN
            if grep -q "N8N_CORS_ORIGIN" "$N8N_SCRIPT" 2>/dev/null; then
                echo "   ✅ N8N_CORS_ORIGIN trouvé dans le script"
                # Mettre à jour
                sed -i 's|export N8N_CORS_ORIGIN=.*|export N8N_CORS_ORIGIN=https://www.talosprimes.com|' "$N8N_SCRIPT" 2>/dev/null || \
                sed -i 's|N8N_CORS_ORIGIN=.*|N8N_CORS_ORIGIN=https://www.talosprimes.com|' "$N8N_SCRIPT" 2>/dev/null
                echo "   ✅ N8N_CORS_ORIGIN mis à jour"
            else
                echo "   📝 Ajout de N8N_CORS_ORIGIN au script..."
                # Ajouter avant la commande n8n start
                sed -i '/n8n start/i export N8N_CORS_ORIGIN=https://www.talosprimes.com' "$N8N_SCRIPT" 2>/dev/null || \
                sed -i '/n8n start/i N8N_CORS_ORIGIN=https://www.talosprimes.com' "$N8N_SCRIPT" 2>/dev/null
                echo "   ✅ N8N_CORS_ORIGIN ajouté"
            fi
        fi
        
        # Vérifier le fichier ecosystem.config.js de PM2
        if [ -f "$HOME/.pm2/ecosystem.config.js" ]; then
            echo "   📍 Fichier ecosystem.config.js trouvé"
            if grep -q "N8N_CORS_ORIGIN" "$HOME/.pm2/ecosystem.config.js"; then
                sed -i 's|N8N_CORS_ORIGIN.*|N8N_CORS_ORIGIN: "https://www.talosprimes.com",|' "$HOME/.pm2/ecosystem.config.js"
                echo "   ✅ N8N_CORS_ORIGIN mis à jour dans ecosystem.config.js"
            else
                # Ajouter dans la section env du processus n8n
                sed -i '/name.*n8n/,/}/ {
                    /env:/a\
        N8N_CORS_ORIGIN: "https://www.talosprimes.com",
                }' "$HOME/.pm2/ecosystem.config.js" 2>/dev/null || echo "   ⚠️  Impossible d'ajouter automatiquement dans ecosystem.config.js"
            fi
        fi
    else
        echo "⚠️  N8N non trouvé dans PM2"
    fi
else
    echo "⚠️  PM2 non installé ou non dans le PATH"
fi

echo ""

# 2. Configurer Nginx pour N8N
echo "2️⃣ Configuration Nginx pour N8N..."
echo "----------------------------------"

NGINX_N8N_CONFIG=""
if [ -f "/etc/nginx/sites-available/n8n" ]; then
    NGINX_N8N_CONFIG="/etc/nginx/sites-available/n8n"
elif [ -f "/etc/nginx/sites-available/n8n.talosprimes.com" ]; then
    NGINX_N8N_CONFIG="/etc/nginx/sites-available/n8n.talosprimes.com"
else
    echo "⚠️  Fichier de configuration Nginx pour N8N non trouvé"
    echo "   💡 Chercher dans /etc/nginx/sites-available/"
fi

if [ -n "$NGINX_N8N_CONFIG" ]; then
    echo "✅ Fichier trouvé: $NGINX_N8N_CONFIG"
    
    # Créer une sauvegarde
    BACKUP_FILE="${NGINX_N8N_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_N8N_CONFIG" "$BACKUP_FILE"
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
    
    # Supprimer ou commenter X-Frame-Options SAMEORIGIN
    if grep -q "X-Frame-Options.*SAMEORIGIN" "$NGINX_N8N_CONFIG"; then
        echo "   📝 Suppression de X-Frame-Options SAMEORIGIN..."
        sed -i 's|add_header X-Frame-Options "SAMEORIGIN"|# add_header X-Frame-Options "SAMEORIGIN"|g' "$NGINX_N8N_CONFIG"
        echo "   ✅ X-Frame-Options SAMEORIGIN supprimé"
    fi
    
    # Ajouter Content-Security-Policy pour autoriser l'iframe depuis www.talosprimes.com
    if grep -q "Content-Security-Policy.*frame-ancestors" "$NGINX_N8N_CONFIG"; then
        echo "   📝 Mise à jour de Content-Security-Policy..."
        sed -i 's|add_header Content-Security-Policy.*frame-ancestors.*|add_header Content-Security-Policy "frame-ancestors '\''self'\'' https://www.talosprimes.com" always;|g' "$NGINX_N8N_CONFIG"
        echo "   ✅ Content-Security-Policy mis à jour"
    else
        echo "   📝 Ajout de Content-Security-Policy..."
        # Ajouter dans le bloc server, après les autres add_header
        sed -i '/server_name.*n8n.talosprimes.com/a\
    # Autoriser l'\''iframe depuis www.talosprimes.com\
    add_header Content-Security-Policy "frame-ancestors '\''self'\'' https://www.talosprimes.com" always;
' "$NGINX_N8N_CONFIG"
        echo "   ✅ Content-Security-Policy ajouté"
    fi
    
    # Tester la configuration
    echo ""
    echo "🧪 Test de la configuration Nginx..."
    if nginx -t 2>&1 | grep -q "syntax is ok"; then
        echo "✅ Configuration Nginx valide"
        systemctl reload nginx
        echo "✅ Nginx rechargé"
    else
        echo "❌ Erreur dans la configuration Nginx"
        echo "   Restauration de la sauvegarde..."
        cp "$BACKUP_FILE" "$NGINX_N8N_CONFIG"
        nginx -t
        exit 1
    fi
else
    echo "⚠️  Configuration Nginx pour N8N non trouvée"
    echo "   💡 Vous devrez configurer manuellement :"
    echo "      - Supprimer ou commenter: add_header X-Frame-Options \"SAMEORIGIN\""
    echo "      - Ajouter: add_header Content-Security-Policy \"frame-ancestors 'self' https://www.talosprimes.com\" always;"
fi

echo ""

# 3. Redémarrer N8N
echo "3️⃣ Redémarrage de N8N..."
echo "-------------------------"
if command -v pm2 &> /dev/null; then
    if pm2 list 2>/dev/null | grep -qi n8n; then
        pm2 restart n8n
        echo "✅ N8N redémarré"
        echo ""
        echo "📋 Statut N8N:"
        pm2 list | grep -i n8n
    else
        echo "⚠️  N8N non trouvé dans PM2"
    fi
else
    echo "⚠️  PM2 non disponible"
fi

echo ""
echo "============================================="
echo "✅ Configuration terminée"
echo ""
echo "💡 N8N devrait maintenant accepter les iframes depuis www.talosprimes.com"
echo ""
echo "📝 Pour vérifier:"
echo "   1. Accédez à https://www.talosprimes.com/platform/n8n"
echo "   2. L'iframe devrait maintenant charger N8N"
echo "   3. Si ça ne fonctionne pas, vérifiez les logs:"
echo "      - pm2 logs n8n --lines 50"
echo "      - sudo tail -f /var/log/nginx/error.log"
echo ""

