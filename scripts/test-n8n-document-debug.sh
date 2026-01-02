#!/bin/bash

# Script de test pour débugger l'API N8N billing documents
# Affiche les logs détaillés

echo "=== Test API N8N Billing Documents (Mode Debug) ==="
echo ""

# Remplacer par un ID de document existant
DOCUMENT_ID="${1:-930f7b8b-3c6f-4a2a-8ec9-08681c2066f7}"

echo "Document ID: $DOCUMENT_ID"
echo ""

# Récupérer la clé depuis les variables d'environnement (à adapter selon votre setup)
API_KEY="${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxa2Zxdm12cXN3cHFsa3Zkb3d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjE2NDYzNywiZXhwIjoyMDgxNzQwNjM3fQ.LzFa_VaEF01ew1o2jE2s1xs3O4R8uQdjhj-3_qqQqbQ}"

echo "Test avec curl..."
echo ""

curl -X GET "https://www.talosprimes.com/api/n8n/billing/documents/$DOCUMENT_ID" \
  -H "Content-Type: application/json" \
  -H "apikey: $API_KEY" \
  -v 2>&1 | tee /tmp/n8n-test-response.log

echo ""
echo "=== Réponse complète ==="
echo ""
cat /tmp/n8n-test-response.log | grep -A 100 "< HTTP"

echo ""
echo "=== Pour voir les logs du serveur, consultez les logs Next.js ==="
echo "Les logs détaillés apparaîtront dans la console du serveur"

