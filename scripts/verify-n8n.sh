#!/bin/bash

# Script de vérification de l'installation N8N

set -e

N8N_DOMAIN="n8n.talosprimes.com"
N8N_DIR="/var/n8n"
N8N_USER="n8n"

echo "🔍 Vérification de l'installation N8N..."
echo ""

# Vérifier que N8N est installé
if command -v n8n &> /dev/null; then
    echo "✅ N8N est installé"
    n8n --version
else
    echo "❌ N8N n'est pas installé"
    exit 1
fi

echo ""

# Vérifier le statut PM2
echo "📊 Statut PM2 :"
sudo -u "$N8N_USER" pm2 status

echo ""

# Vérifier les fichiers
echo "📁 Vérification des fichiers :"
[ -f "$N8N_DIR/.env" ] && echo "✅ Fichier .env existe" || echo "❌ Fichier .env manquant"
[ -d "$N8N_DIR/data" ] && echo "✅ Répertoire data existe" || echo "❌ Répertoire data manquant"
[ -d "$N8N_DIR/logs" ] && echo "✅ Répertoire logs existe" || echo "❌ Répertoire logs manquant"

echo ""

# Vérifier Nginx
echo "🌐 Vérification Nginx :"
if nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Configuration Nginx valide"
else
    echo "❌ Erreur dans la configuration Nginx"
    nginx -t
fi

echo ""

# Vérifier SSL
echo "🔒 Vérification SSL :"
if [ -d "/etc/letsencrypt/live/$N8N_DOMAIN" ]; then
    echo "✅ Certificat SSL installé"
    certbot certificates | grep "$N8N_DOMAIN"
else
    echo "⚠️  Certificat SSL non trouvé"
fi

echo ""

# Vérifier l'accessibilité
echo "🌐 Test de connectivité :"
if curl -s -o /dev/null -w "%{http_code}" "https://$N8N_DOMAIN" | grep -q "200\|401"; then
    echo "✅ N8N est accessible via HTTPS"
else
    echo "⚠️  N8N n'est pas accessible (vérifiez le DNS et le firewall)"
fi

echo ""

# Vérifier les sauvegardes
echo "💾 Vérification des sauvegardes :"
if [ -f "$N8N_DIR/backup.sh" ]; then
    echo "✅ Script de sauvegarde existe"
    if crontab -u "$N8N_USER" -l 2>/dev/null | grep -q "backup.sh"; then
        echo "✅ Tâche cron de sauvegarde configurée"
    else
        echo "⚠️  Tâche cron de sauvegarde non trouvée"
    fi
else
    echo "❌ Script de sauvegarde manquant"
fi

echo ""
echo "✅ Vérification terminée"






