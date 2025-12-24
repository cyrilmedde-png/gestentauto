#!/bin/bash
# Script pour tester si les variables N8N sont bien dans .env.production
# Usage: ./scripts/test-n8n-vars.sh

set -e

cd /var/www/talosprime

echo "🔍 Test des variables N8N"
echo "========================"
echo ""

# Lire directement depuis .env.production
if [ ! -f .env.production ]; then
    echo "❌ Fichier .env.production non trouvé"
    exit 1
fi

echo "📋 Variables dans .env.production:"
echo ""

# Extraire les variables
N8N_URL=$(grep "^N8N_URL=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
N8N_USER=$(grep "^N8N_BASIC_AUTH_USER=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)
N8N_PASS=$(grep "^N8N_BASIC_AUTH_PASSWORD=" .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | xargs)

echo "N8N_URL: ${N8N_URL:-❌ NON DÉFINI}"
echo "N8N_BASIC_AUTH_USER: ${N8N_USER:-❌ NON DÉFINI}"
if [ -n "$N8N_PASS" ]; then
    PASS_LEN=${#N8N_PASS}
    echo "N8N_BASIC_AUTH_PASSWORD: ✅ défini ($PASS_LEN caractères)"
else
    echo "N8N_BASIC_AUTH_PASSWORD: ❌ NON DÉFINI"
fi
echo ""

# Vérifier que toutes les variables sont définies
if [ -z "$N8N_URL" ] || [ -z "$N8N_USER" ] || [ -z "$N8N_PASS" ]; then
    echo "❌ Certaines variables sont manquantes !"
    exit 1
fi

echo "✅ Toutes les variables sont définies"
echo ""

# Tester la connexion avec ces variables
echo "🧪 Test de connexion à N8N..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -u "$N8N_USER:$N8N_PASS" "$N8N_URL" || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Impossible de se connecter"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ Connexion réussie (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Réponse HTTP $HTTP_CODE"
fi
echo ""

# Vérifier si Next.js a chargé les variables (en regardant le build)
echo "📦 Vérification du build Next.js..."
if [ -d .next ]; then
    echo "   ✅ Dossier .next existe (build présent)"
    
    # Vérifier la date du build
    BUILD_TIME=$(stat -c %y .next 2>/dev/null || stat -f %Sm .next 2>/dev/null || echo "inconnue")
    echo "   📅 Dernier build: $BUILD_TIME"
    
    # Vérifier si les variables sont dans le build (Next.js les inline)
    if grep -r "n8n.talosprimes.com" .next/server 2>/dev/null | head -1 > /dev/null; then
        echo "   ✅ URL N8N trouvée dans le build"
    else
        echo "   ⚠️  URL N8N non trouvée dans le build (peut être normal)"
    fi
else
    echo "   ❌ Dossier .next n'existe pas - BUILD REQUIS"
    echo "   💡 Exécutez: npm run build"
fi
echo ""

echo "========================"
echo "📊 Résumé:"
echo ""
if [ -n "$N8N_URL" ] && [ -n "$N8N_USER" ] && [ -n "$N8N_PASS" ]; then
    echo "✅ Variables configurées correctement"
    echo ""
    echo "💡 Si Next.js ne peut toujours pas se connecter:"
    echo "   1. Rebuild: rm -rf .next && npm run build"
    echo "   2. Redémarrer: pm2 restart talosprime"
    echo "   3. Vérifier les logs: pm2 logs talosprime --err --lines 30 | grep testN8NConnection"
else
    echo "❌ Variables manquantes - ajoutez-les dans .env.production"
fi

