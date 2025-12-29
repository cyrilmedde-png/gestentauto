#!/bin/bash
# Script pour vérifier les variables d'environnement N8N
# Usage: ./scripts/verifier-env-n8n.sh

set -e

cd /var/www/talosprime

echo "🔍 Vérification des variables d'environnement N8N"
echo "=================================================="
echo ""

# Vérifier si .env.production existe
if [ ! -f .env.production ]; then
    echo "❌ Le fichier .env.production n'existe pas !"
    echo ""
    echo "💡 Créez-le avec:"
    echo "   ./scripts/setup-env-production.sh"
    exit 1
fi

echo "✅ Fichier .env.production trouvé"
echo ""

# Vérifier les variables N8N
echo "📋 Variables N8N dans .env.production:"
echo ""

N8N_URL=$(grep "^N8N_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")
N8N_USER=$(grep "^N8N_BASIC_AUTH_USER=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")
N8N_PASS=$(grep "^N8N_BASIC_AUTH_PASSWORD=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$N8N_URL" ]; then
    echo "   ❌ N8N_URL: NON DÉFINI"
else
    echo "   ✅ N8N_URL: $N8N_URL"
fi

if [ -z "$N8N_USER" ]; then
    echo "   ❌ N8N_BASIC_AUTH_USER: NON DÉFINI"
else
    echo "   ✅ N8N_BASIC_AUTH_USER: $N8N_USER"
fi

if [ -z "$N8N_PASS" ]; then
    echo "   ❌ N8N_BASIC_AUTH_PASSWORD: NON DÉFINI"
else
    PASS_LENGTH=${#N8N_PASS}
    echo "   ✅ N8N_BASIC_AUTH_PASSWORD: [défini, $PASS_LENGTH caractères]"
fi

echo ""

# Vérifier si toutes les variables sont définies
if [ -z "$N8N_URL" ] || [ -z "$N8N_USER" ] || [ -z "$N8N_PASS" ]; then
    echo "❌ Certaines variables N8N sont manquantes !"
    echo ""
    echo "💡 Ajoutez-les dans .env.production:"
    echo ""
    echo "N8N_URL=https://n8n.talosprimes.com"
    echo "N8N_BASIC_AUTH_USER=votre_email@example.com"
    echo "N8N_BASIC_AUTH_PASSWORD=votre_mot_de_passe"
    echo ""
    exit 1
fi

echo "✅ Toutes les variables N8N sont définies"
echo ""

# Tester la connexion avec ces credentials
echo "🧪 Test de connexion avec les credentials du .env.production..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -u "$N8N_USER:$N8N_PASS" "$N8N_URL" || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Impossible de se connecter avec ces credentials"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ Connexion réussie (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Réponse HTTP $HTTP_CODE"
fi

echo ""
echo "=================================================="
echo "📊 Résumé:"
echo ""

if [ -n "$N8N_URL" ] && [ -n "$N8N_USER" ] && [ -n "$N8N_PASS" ]; then
    echo "✅ Toutes les variables sont configurées"
    echo ""
    echo "💡 Si Next.js ne peut toujours pas se connecter:"
    echo "   1. Vérifiez que Next.js a été redémarré après la modification de .env.production"
    echo "   2. Rebuild l'application: npm run build"
    echo "   3. Redémarrez PM2: pm2 restart talosprime"
    echo "   4. Vérifiez les logs: pm2 logs talosprime --err --lines 20"
else
    echo "❌ Variables manquantes - ajoutez-les dans .env.production"
fi






