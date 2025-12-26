#!/bin/bash
# Script pour corriger la configuration PM2 de N8N
# Usage: sudo bash scripts/fix-n8n-pm2.sh

echo "🔧 Correction de la configuration PM2 pour N8N"
echo "=============================================="
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script devrait être exécuté en tant que root"
fi

# 1. Trouver où N8N est installé
echo "1️⃣ Recherche de l'installation N8N..."
echo "--------------------------------------"

N8N_PATH=""
N8N_CMD=""

# Vérifier si n8n est dans le PATH
if command -v n8n &> /dev/null; then
    N8N_CMD=$(which n8n)
    N8N_PATH=$(dirname "$N8N_CMD")
    echo "✅ N8N trouvé dans PATH: $N8N_CMD"
elif [ -f "/usr/local/bin/n8n" ]; then
    N8N_CMD="/usr/local/bin/n8n"
    N8N_PATH="/usr/local/bin"
    echo "✅ N8N trouvé: $N8N_CMD"
elif [ -f "/usr/bin/n8n" ]; then
    N8N_CMD="/usr/bin/n8n"
    N8N_PATH="/usr/bin"
    echo "✅ N8N trouvé: $N8N_CMD"
elif [ -f "$HOME/.n8n/node_modules/.bin/n8n" ]; then
    N8N_CMD="$HOME/.n8n/node_modules/.bin/n8n"
    N8N_PATH="$HOME/.n8n/node_modules/.bin"
    echo "✅ N8N trouvé (installation locale): $N8N_CMD"
else
    echo "❌ N8N non trouvé"
    echo ""
    echo "💡 Options:"
    echo "   1. Installer N8N globalement: npm install -g n8n@2.0.3"
    echo "   2. Utiliser le script d'installation: bash scripts/install-n8n-2.0.3.sh"
    exit 1
fi

# Vérifier que le fichier existe vraiment
if [ ! -f "$N8N_CMD" ]; then
    echo "❌ Le fichier $N8N_CMD n'existe pas"
    exit 1
fi

echo "   📍 Chemin N8N: $N8N_CMD"
echo ""

# 2. Vérifier la version de N8N
echo "2️⃣ Vérification de la version N8N..."
echo "------------------------------------"
if [ -f "$N8N_CMD" ]; then
    N8N_VERSION=$("$N8N_CMD" --version 2>/dev/null || echo "inconnue")
    echo "   📋 Version: $N8N_VERSION"
else
    echo "   ⚠️  Impossible de vérifier la version"
fi
echo ""

# 3. Vérifier PM2
echo "3️⃣ Vérification PM2..."
echo "----------------------"
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 non installé"
    echo "   Installation: npm install -g pm2"
    exit 1
fi

echo "✅ PM2 installé: $(which pm2)"
echo ""

# 4. Arrêter N8N dans PM2 s'il existe
echo "4️⃣ Arrêt de N8N dans PM2..."
echo "-----------------------------"
if pm2 list 2>/dev/null | grep -qi n8n; then
    echo "   📋 N8N trouvé dans PM2, arrêt..."
    pm2 stop n8n 2>/dev/null || true
    pm2 delete n8n 2>/dev/null || true
    echo "   ✅ N8N arrêté et supprimé de PM2"
else
    echo "   ℹ️  N8N non trouvé dans PM2"
fi
echo ""

# 5. Créer la configuration PM2 correcte
echo "5️⃣ Création de la configuration PM2..."
echo "--------------------------------------"

# Déterminer le répertoire de travail N8N
N8N_WORK_DIR="$HOME/.n8n"
if [ ! -d "$N8N_WORK_DIR" ]; then
    mkdir -p "$N8N_WORK_DIR"
    echo "   📁 Répertoire créé: $N8N_WORK_DIR"
fi

# Variables d'environnement N8N
N8N_ENV_VARS="
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_CORS_ORIGIN=https://www.talosprimes.com
WEBHOOK_URL=https://n8n.talosprimes.com/
"

# Créer un script de démarrage
START_SCRIPT="/tmp/n8n-start.sh"
cat > "$START_SCRIPT" << EOF
#!/bin/bash
cd $N8N_WORK_DIR
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
export N8N_PROTOCOL=https
export N8N_CORS_ORIGIN=https://www.talosprimes.com
export WEBHOOK_URL=https://n8n.talosprimes.com/
$N8N_CMD start
EOF

chmod +x "$START_SCRIPT"
echo "   ✅ Script de démarrage créé: $START_SCRIPT"
echo ""

# 6. Démarrer N8N avec PM2
echo "6️⃣ Démarrage de N8N avec PM2..."
echo "---------------------------------"

# Méthode 1: Utiliser le script de démarrage
pm2 start "$START_SCRIPT" --name n8n --interpreter bash || {
    echo "   ⚠️  Méthode 1 échouée, essai méthode 2..."
    
    # Méthode 2: Démarrer directement avec les variables d'environnement
    pm2 start "$N8N_CMD" --name n8n -- start \
        --host=0.0.0.0 \
        --port=5678 \
        --protocol=https \
        --cors-origin=https://www.talosprimes.com \
        || {
        echo "   ⚠️  Méthode 2 échouée, essai méthode 3..."
        
        # Méthode 3: Utiliser ecosystem.config.js
        ECOSYSTEM_FILE="$HOME/.pm2/ecosystem.config.js"
        if [ ! -f "$ECOSYSTEM_FILE" ]; then
            cat > "$ECOSYSTEM_FILE" << EOFJS
module.exports = {
  apps: [{
    name: 'n8n',
    script: '$N8N_CMD',
    args: 'start',
    env: {
      N8N_HOST: '0.0.0.0',
      N8N_PORT: '5678',
      N8N_PROTOCOL: 'https',
      N8N_CORS_ORIGIN: 'https://www.talosprimes.com',
      WEBHOOK_URL: 'https://n8n.talosprimes.com/'
    }
  }]
}
EOFJS
            echo "   ✅ Fichier ecosystem.config.js créé"
        fi
        
        pm2 start ecosystem.config.js
    }
}

# Attendre un peu pour que N8N démarre
sleep 3

# Vérifier le statut
echo ""
echo "📋 Statut PM2:"
pm2 list | grep -i n8n || echo "   ⚠️  N8N non trouvé dans PM2"

echo ""

# 7. Sauvegarder la configuration PM2
echo "7️⃣ Sauvegarde de la configuration PM2..."
echo "----------------------------------------"
pm2 save
echo "✅ Configuration sauvegardée"
echo ""

# 8. Vérifier que N8N fonctionne
echo "8️⃣ Vérification de N8N..."
echo "--------------------------"
sleep 2

# Vérifier les logs
echo "📋 Dernières lignes des logs:"
pm2 logs n8n --lines 10 --nostream 2>/dev/null | tail -10 || echo "   ⚠️  Impossible de lire les logs"

echo ""

# Vérifier si N8N répond
echo "🌐 Test de connexion à N8N..."
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" http://localhost:5678 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "   ✅ N8N répond sur le port 5678 (Code: $HTTP_CODE)"
else
    echo "   ⚠️  N8N ne répond pas encore (Code: $HTTP_CODE)"
    echo "   💡 Attendez quelques secondes et vérifiez: pm2 logs n8n"
fi

echo ""
echo "=============================================="
echo "✅ Configuration terminée"
echo ""
echo "📝 Commandes utiles:"
echo "   - Voir les logs: pm2 logs n8n"
echo "   - Voir le statut: pm2 list | grep n8n"
echo "   - Redémarrer: pm2 restart n8n"
echo "   - Arrêter: pm2 stop n8n"
echo ""

