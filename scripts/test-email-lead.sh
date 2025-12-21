#!/bin/bash

# Script de test pour créer un lead et vérifier l'envoi d'email
# Usage: ./scripts/test-email-lead.sh ou bash scripts/test-email-lead.sh

echo "🧪 Test de création de lead avec envoi d'email"
echo ""

# Configuration
EMAIL_TEST="${1:-test-email-$(date +%s)@example.com}"
API_URL="${2:-http://localhost:3000}"
# Pour le serveur, utilisez: http://82.165.129.143 ou https://talosprime.fr

echo "📧 Email de test : $EMAIL_TEST"
echo "🌐 URL API : $API_URL"
echo ""

# Créer un lead
echo "1️⃣ Création du lead..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/platform/leads" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL_TEST\",
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"company_name\": \"Test Company\",
    \"phone\": \"+33612345678\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📊 Code HTTP : $HTTP_CODE"
echo "📦 Réponse :"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Lead créé avec succès !"
  echo ""
  echo "📧 Vérifiez maintenant :"
  echo "   1. Votre boîte mail ($EMAIL_TEST) pour voir si l'email de confirmation est arrivé"
  echo "   2. Le dashboard Resend : https://resend.com/emails"
  echo "   3. Les logs de l'application : pm2 logs talosprime"
  echo ""
  echo "💡 Si l'email n'arrive pas, vérifiez :"
  echo "   - Que RESEND_API_KEY est correctement configurée"
  echo "   - Que le domaine est vérifié dans Resend (ou utilisez onboarding@resend.dev)"
  echo "   - Les logs PM2 pour voir les erreurs : pm2 logs talosprime --lines 50"
else
  echo "❌ Erreur lors de la création du lead"
  echo "   Vérifiez que l'application est démarrée et accessible"
fi

