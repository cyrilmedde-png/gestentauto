#!/bin/bash

# Script de correction DÉFINITIVE du 404 pour /platform/make
# Recrée la page avec une structure ultra-minimaliste et force un rebuild complet

set -e

echo "🔧 Correction DÉFINITIVE du 404 pour /platform/make"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Arrêter PM2 si l'application tourne
echo "⏸️  Arrêt de PM2..."
pm2 stop talosprime 2>/dev/null || echo "  (PM2 n'était pas en cours d'exécution)"
echo ""

# 2. Backup de l'ancien dossier make
if [ -d "app/platform/make" ]; then
    echo "💾 Backup de l'ancien dossier make..."
    BACKUP_DIR="app/platform/make.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r app/platform/make "$BACKUP_DIR" 2>/dev/null || true
    echo "✅ Backup créé: $BACKUP_DIR"
    echo ""
fi

# 3. Supprimer le dossier make
echo "🗑️  Suppression de l'ancien dossier make..."
rm -rf app/platform/make
echo "✅ Dossier supprimé"
echo ""

# 4. Recréer le dossier
echo "📁 Création du nouveau dossier make..."
mkdir -p app/platform/make
echo "✅ Dossier créé"
echo ""

# 5. Créer la page ultra-minimaliste
echo "📝 Création de la page ultra-minimaliste..."
cat > app/platform/make/page.tsx << 'EOF'
'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function MakePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="w-full h-[calc(100vh-4rem)]" style={{ position: 'relative' }}>
          <iframe
            src="/api/platform/make/proxy"
            className="w-full h-full border-0"
            title="Make - Automatisation"
          />
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
EOF
echo "✅ Page créée"
echo ""

# 6. Vérifier que le fichier existe et afficher son contenu
echo "🔍 Vérification du fichier créé..."
if [ -f "app/platform/make/page.tsx" ]; then
    echo "✅ app/platform/make/page.tsx existe"
    echo "📋 Contenu du fichier:"
    echo "---"
    cat app/platform/make/page.tsx
    echo "---"
else
    echo "❌ ERREUR: Le fichier n'a pas été créé!"
    exit 1
fi
echo ""

# 7. Nettoyage TOTAL du cache Next.js
echo "🧹 Nettoyage COMPLET du cache Next.js..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf node_modules/.next
echo "✅ Caches supprimés"
echo ""

# 8. Vérifier qu'il n'y a pas de caractères cachés dans le nom du dossier
echo "🔍 Vérification du nom du dossier..."
ls -la app/platform/ | grep -i make || echo "  (dossier non trouvé - normal avant build)"
echo ""

# 9. Rebuild COMPLET
echo "🔨 Rebuild complet de l'application..."
if npm run build 2>&1 | tee /tmp/make-build.log; then
    echo ""
    echo "✅ Build réussi!"
else
    echo ""
    echo "❌ ERREUR lors du build!"
    echo "📋 Logs du build:"
    cat /tmp/make-build.log
    exit 1
fi
echo ""

# 10. Vérifier que la route apparaît dans le build
echo "🔍 Vérification que la route /platform/make est dans le build..."
if grep -q "/platform/make" /tmp/make-build.log; then
    echo "✅ Route /platform/make trouvée dans le build"
    grep "/platform/make" /tmp/make-build.log | head -1
else
    echo "⚠️  Route /platform/make non trouvée dans les logs du build"
fi
echo ""

# 11. Vérifier que le fichier build existe
echo "🔍 Vérification du fichier build généré..."
if [ -f ".next/server/app/platform/make/page.js" ]; then
    echo "✅ .next/server/app/platform/make/page.js existe"
    ls -lh .next/server/app/platform/make/page.js
else
    echo "❌ .next/server/app/platform/make/page.js n'existe pas!"
    echo "📋 Contenu du dossier .next/server/app/platform/:"
    ls -la .next/server/app/platform/ 2>/dev/null || echo "  (dossier inexistant)"
    exit 1
fi
echo ""

# 12. Redémarrer PM2
echo "🔄 Redémarrage de PM2..."
pm2 start talosprime --update-env || pm2 restart talosprime --update-env
echo "✅ PM2 redémarré"
echo ""

# 13. Attendre un peu pour que l'application démarre
echo "⏳ Attente du démarrage de l'application (5 secondes)..."
sleep 5
echo ""

# 14. Tester la route localement
echo "🧪 Test de la route /platform/make sur localhost..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/platform/make 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Route fonctionne! (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ] || [ "$HTTP_CODE" = "308" ]; then
    echo "⚠️  Redirection détectée (HTTP $HTTP_CODE) - peut être normal (authentification)"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ ERREUR: Route retourne toujours 404!"
    echo "📋 Vérifications supplémentaires:"
    echo "  1. Vérifiez les logs PM2: pm2 logs talosprime --lines 50"
    echo "  2. Vérifiez que le fichier existe: ls -la app/platform/make/page.tsx"
    echo "  3. Vérifiez le build: ls -la .next/server/app/platform/make/page.js"
    exit 1
else
    echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
fi
echo ""

echo "✅ Correction terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Testez sur le domaine: https://www.talosprimes.com/platform/make"
echo "  2. Si ça ne fonctionne toujours pas, vérifiez les logs: pm2 logs talosprime --lines 100"
echo "  3. Vérifiez la configuration Nginx si nécessaire"
echo ""

