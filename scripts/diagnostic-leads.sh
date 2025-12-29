#!/bin/bash
# Script de diagnostic pour l'erreur 500 sur /api/platform/leads

echo "🔍 Diagnostic de l'erreur 500 sur /api/platform/leads"
echo "=================================================="
echo ""

# 1. Vérifier que PM2 est actif
echo "1. Vérification PM2..."
pm2 list
echo ""

# 2. Vérifier les logs récents
echo "2. Logs récents (dernières 100 lignes)..."
echo "----------------------------------------"
pm2 logs talosprime --lines 100 --nostream | tail -50
echo ""

# 3. Vérifier les erreurs uniquement
echo "3. Erreurs uniquement (dernières 50 lignes)..."
echo "--------------------------------------------"
pm2 logs talosprime --err --lines 50 --nostream | tail -30
echo ""

# 4. Vérifier que le code utilise platform_leads
echo "4. Vérification du code..."
echo "-------------------------"
cd /var/www/talosprime
if grep -q "possibleTableNames = \['platform_leads'\]" app/api/platform/leads/route.ts; then
    echo "✅ Le code utilise uniquement 'platform_leads'"
else
    echo "❌ Le code utilise encore l'ancien système de fallback"
    echo "   Vérifiez que git pull a bien récupéré les modifications"
fi
echo ""

# 5. Vérifier la dernière modification du fichier
echo "5. Dernière modification du code..."
echo "-----------------------------------"
ls -lh app/api/platform/leads/route.ts
echo ""

# 6. Vérifier la branche Git
echo "6. État Git..."
echo "--------------"
git status --short
git log --oneline -5
echo ""

# 7. Vérifier les variables d'environnement Supabase
echo "7. Variables d'environnement Supabase..."
echo "----------------------------------------"
if [ -f .env.local ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL est défini"
        grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | sed 's/=.*/=***/'
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL n'est pas défini"
    fi
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "✅ SUPABASE_SERVICE_ROLE_KEY est défini"
    else
        echo "❌ SUPABASE_SERVICE_ROLE_KEY n'est pas défini"
    fi
else
    echo "⚠️  Fichier .env.local non trouvé"
fi
echo ""

echo "=================================================="
echo "✅ Diagnostic terminé"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Vérifier les logs ci-dessus pour l'erreur exacte"
echo "   2. Si le code n'est pas à jour : git pull origin main"
echo "   3. Si erreur de build : npm run build"
echo "   4. Redémarrer : pm2 restart talosprime"









