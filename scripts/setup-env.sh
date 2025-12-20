#!/bin/bash

# Script pour configurer les variables d'environnement
# À exécuter sur le serveur

set -e

APP_DIR="/var/www/talosprime"
ENV_FILE="$APP_DIR/.env.production"

echo "⚙️  Configuration des variables d'environnement..."

# Créer le fichier .env.production s'il n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
    echo "📝 Fichier $ENV_FILE créé"
fi

echo ""
echo "📋 Variables d'environnement nécessaires :"
echo ""
echo "Supabase :"
echo "  NEXT_PUBLIC_SUPABASE_URL=..."
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=..."
echo "  SUPABASE_SERVICE_ROLE_KEY=..."
echo ""
echo "Resend (Email) :"
echo "  RESEND_API_KEY=re_..."
echo "  RESEND_FROM_EMAIL=noreply@talosprime.fr"
echo "  RESEND_FROM_NAME=TalosPrime"
echo ""
echo "Twilio (SMS) :"
echo "  TWILIO_ACCOUNT_SID=AC..."
echo "  TWILIO_AUTH_TOKEN=..."
echo "  TWILIO_PHONE_NUMBER=+336..."
echo ""
echo "Application :"
echo "  NODE_ENV=production"
echo "  PORT=3000"
echo ""

# Demander si on veut éditer le fichier maintenant
read -p "Voulez-vous éditer le fichier maintenant ? (o/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    ${EDITOR:-nano} "$ENV_FILE"
    echo "✅ Fichier sauvegardé"
else
    echo "📝 Pour éditer plus tard : nano $ENV_FILE"
fi

echo ""
echo "✅ Configuration terminée !"

