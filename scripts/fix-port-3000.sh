#!/bin/bash
# Script pour libérer le port 3000 et redémarrer l'application

echo "🔍 Recherche des processus utilisant le port 3000..."

# Trouver les processus sur le port 3000
PID=$(lsof -ti:3000)

if [ -z "$PID" ]; then
  echo "✅ Aucun processus n'utilise le port 3000"
else
  echo "⚠️  Processus trouvé(s) sur le port 3000: $PID"
  echo "🛑 Arrêt des processus..."
  kill -9 $PID
  sleep 2
  echo "✅ Processus arrêté(s)"
fi

# Arrêter toutes les instances PM2
echo ""
echo "🛑 Arrêt de toutes les instances PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Attendre un peu
sleep 2

# Redémarrer l'application
echo ""
echo "🚀 Redémarrage de l'application..."
cd /var/www/talosprime || exit 1

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
  echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le bon répertoire."
  exit 1
fi

# Démarrer avec PM2
pm2 start npm --name "talosprime" -- start

# Sauvegarder la configuration
pm2 save

echo ""
echo "✅ Application redémarrée"
echo ""
echo "📊 Statut PM2:"
pm2 list

echo ""
echo "📝 Pour voir les logs: pm2 logs talosprime"


