#!/bin/bash

###############################################################################
# Script complet pour créer un lead avec notifications
# Usage: bash scripts/create-lead-complete.sh
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "          Création d'un lead - Script complet"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Variables (à personnaliser)
API_URL="https://www.talosprimes.com/api/platform/leads"
N8N_WEBHOOK_URL="https://n8n.talosprimes.com/webhook/nouveau-lead"

# Demander les informations du lead
print_step "Informations du lead"
echo ""

read -p "Prénom : " FIRST_NAME
read -p "Nom : " LAST_NAME
read -p "Email : " EMAIL
read -p "Téléphone : " PHONE
read -p "Entreprise : " COMPANY
read -p "Source (web/referral/ads/autre) : " SOURCE
read -p "Notes (optionnel) : " NOTES

echo ""
print_step "Création du lead en cours..."

# Créer le payload JSON
PAYLOAD=$(cat <<EOF
{
  "first_name": "$FIRST_NAME",
  "last_name": "$LAST_NAME",
  "email": "$EMAIL",
  "phone": "$PHONE",
  "company": "$COMPANY",
  "source": "$SOURCE",
  "notes": "$NOTES",
  "status": "new"
}
EOF
)

# Créer le lead via l'API
print_step "1. Création du lead dans la base de données..."

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Vérifier si la création a réussi
if echo "$RESPONSE" | grep -q '"id"'; then
    LEAD_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_success "Lead créé avec succès ! ID: $LEAD_ID"
else
    print_error "Erreur lors de la création du lead"
    echo "$RESPONSE"
    exit 1
fi

# Envoyer notification email
print_step "2. Envoi de l'email de notification..."

EMAIL_PAYLOAD=$(cat <<EOF
{
  "to": "$EMAIL",
  "subject": "Bienvenue - Votre demande a été reçue",
  "html": "<h1>Bonjour $FIRST_NAME $LAST_NAME</h1><p>Nous avons bien reçu votre demande. Notre équipe vous contactera dans les plus brefs délais.</p><p>Informations de votre demande :</p><ul><li>Email: $EMAIL</li><li>Téléphone: $PHONE</li><li>Entreprise: $COMPANY</li></ul><p>Cordialement,<br>L'équipe Talos Prime</p>"
}
EOF
)

EMAIL_RESPONSE=$(curl -s -X POST "https://www.talosprimes.com/api/email/send" \
  -H "Content-Type: application/json" \
  -d "$EMAIL_PAYLOAD")

if echo "$EMAIL_RESPONSE" | grep -q '"success":true'; then
    print_success "Email envoyé à $EMAIL"
else
    print_warning "Erreur lors de l'envoi de l'email"
fi

# Envoyer notification SMS (optionnel)
print_step "3. Envoi du SMS de notification..."

SMS_PAYLOAD=$(cat <<EOF
{
  "to": "$PHONE",
  "message": "Bonjour $FIRST_NAME, nous avons bien reçu votre demande. Notre équipe vous contactera prochainement. - Talos Prime"
}
EOF
)

SMS_RESPONSE=$(curl -s -X POST "https://www.talosprimes.com/api/sms/send" \
  -H "Content-Type: application/json" \
  -d "$SMS_PAYLOAD")

if echo "$SMS_RESPONSE" | grep -q '"success":true'; then
    print_success "SMS envoyé au $PHONE"
else
    print_warning "Erreur lors de l'envoi du SMS (vérifiez la configuration Twilio)"
fi

# Déclencher le workflow N8N
print_step "4. Déclenchement du workflow N8N..."

N8N_PAYLOAD=$(cat <<EOF
{
  "lead_id": "$LEAD_ID",
  "first_name": "$FIRST_NAME",
  "last_name": "$LAST_NAME",
  "email": "$EMAIL",
  "phone": "$PHONE",
  "company": "$COMPANY",
  "source": "$SOURCE",
  "notes": "$NOTES",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

N8N_RESPONSE=$(curl -s -X POST "$N8N_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$N8N_PAYLOAD")

if [ $? -eq 0 ]; then
    print_success "Workflow N8N déclenché"
else
    print_warning "Erreur lors du déclenchement du workflow N8N"
fi

# Résumé
echo ""
echo "════════════════════════════════════════════════════════════════"
print_success "Lead créé avec succès !"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Informations du lead :"
echo "   ID: $LEAD_ID"
echo "   Nom: $FIRST_NAME $LAST_NAME"
echo "   Email: $EMAIL"
echo "   Téléphone: $PHONE"
echo "   Entreprise: $COMPANY"
echo "   Source: $SOURCE"
echo ""
echo "✅ Email de bienvenue envoyé"
echo "✅ SMS de confirmation envoyé"
echo "✅ Workflow N8N déclenché"
echo ""
echo "🔗 Voir le lead :"
echo "   https://www.talosprimes.com/platform/leads/$LEAD_ID"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

