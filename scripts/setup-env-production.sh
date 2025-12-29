#!/bin/bash
# Script pour créer/configurer le fichier .env.production
# Usage: ./scripts/setup-env-production.sh

set -e

cd /var/www/talosprime

echo "🔧 Configuration du fichier .env.production"
echo ""

# Vérifier si le fichier existe déjà
if [ -f .env.production ]; then
    echo "⚠️  Le fichier .env.production existe déjà"
    read -p "Voulez-vous le sauvegarder avant de continuer ? (o/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        BACKUP_FILE=".env.production.backup.$(date +%Y%m%d_%H%M%S)"
        cp .env.production "$BACKUP_FILE"
        echo "✅ Backup créé: $BACKUP_FILE"
    fi
fi

echo ""
echo "📝 Veuillez entrer les valeurs suivantes :"
echo ""

# Variables Supabase
read -p "NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -p "NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
read -p "SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_KEY

# Variables N8N
read -p "N8N_URL [https://n8n.talosprimes.com]: " N8N_URL
N8N_URL=${N8N_URL:-https://n8n.talosprimes.com}
read -p "N8N_BASIC_AUTH_USER: " N8N_USER
read -p "N8N_BASIC_AUTH_PASSWORD: " N8N_PASSWORD

# Variables Application
read -p "NEXT_PUBLIC_APP_URL [https://www.talosprimes.com]: " APP_URL
APP_URL=${APP_URL:-https://www.talosprimes.com}

# Variables Resend
read -p "RESEND_API_KEY (optionnel, appuyez sur Entrée pour ignorer): " RESEND_KEY
read -p "RESEND_FROM_EMAIL [noreply@talosprime.fr]: " RESEND_EMAIL
RESEND_EMAIL=${RESEND_EMAIL:-noreply@talosprime.fr}
read -p "RESEND_FROM_NAME [TalosPrime]: " RESEND_NAME
RESEND_NAME=${RESEND_NAME:-TalosPrime}

# Variables Twilio (optionnel)
read -p "TWILIO_ACCOUNT_SID (optionnel, appuyez sur Entrée pour ignorer): " TWILIO_SID
read -p "TWILIO_AUTH_TOKEN (optionnel, appuyez sur Entrée pour ignorer): " TWILIO_TOKEN
read -p "TWILIO_PHONE_NUMBER (optionnel, appuyez sur Entrée pour ignorer): " TWILIO_PHONE

echo ""
echo "📝 Création du fichier .env.production..."

cat > .env.production << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# N8N
N8N_URL=$N8N_URL
N8N_BASIC_AUTH_USER=$N8N_USER
N8N_BASIC_AUTH_PASSWORD=$N8N_PASSWORD

# Application
NEXT_PUBLIC_APP_URL=$APP_URL
NODE_ENV=production
EOF

# Ajouter Resend si fourni
if [ -n "$RESEND_KEY" ]; then
    cat >> .env.production << EOF

# Resend
RESEND_API_KEY=$RESEND_KEY
RESEND_FROM_EMAIL=$RESEND_EMAIL
RESEND_FROM_NAME=$RESEND_NAME
EOF
fi

# Ajouter Twilio si fourni
if [ -n "$TWILIO_SID" ] && [ -n "$TWILIO_TOKEN" ]; then
    cat >> .env.production << EOF

# Twilio
TWILIO_ACCOUNT_SID=$TWILIO_SID
TWILIO_AUTH_TOKEN=$TWILIO_TOKEN
EOF
    if [ -n "$TWILIO_PHONE" ]; then
        echo "TWILIO_PHONE_NUMBER=$TWILIO_PHONE" >> .env.production
    fi
fi

echo "✅ Fichier .env.production créé avec succès !"
echo ""
echo "🔒 Vérification des permissions..."
chmod 600 .env.production
echo "✅ Permissions configurées (600 - lecture/écriture uniquement pour le propriétaire)"
echo ""
echo "📋 Contenu du fichier (sans les valeurs sensibles):"
grep -v "KEY\|PASSWORD\|TOKEN" .env.production | head -20
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Vérifiez que toutes les variables sont correctes"
echo "   2. Rebuild l'application: npm run build"
echo "   3. Redémarrez: pm2 restart talosprime"






